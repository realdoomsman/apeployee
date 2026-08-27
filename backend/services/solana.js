// Solana vault service. The vault is a hot keypair loaded from SOLANA_PRIVATE_KEY.
// With no key configured, payouts run in SIMULATED mode (clearly labeled, no chain calls).
const {
  Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL,
} = require('@solana/web3.js');
const bs58 = require('bs58');

const RPC = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(RPC, 'confirmed');

let vault = null;
const raw = (process.env.SOLANA_PRIVATE_KEY || '').trim();
if (raw) {
  try {
    const secret = raw.startsWith('[')
      ? Uint8Array.from(JSON.parse(raw))
      : (bs58.default || bs58).decode(raw);
    vault = Keypair.fromSecretKey(secret);
    console.log(`[solana] vault loaded: ${vault.publicKey.toBase58()} (${RPC})`);
  } catch (e) {
    console.error('[solana] SOLANA_PRIVATE_KEY is set but invalid — running SIMULATED:', e.message);
  }
} else {
  console.log('[solana] no vault key configured — payouts run in SIMULATED mode');
}

const isLive = () => vault !== null;

function isValidAddress(addr) {
  try {
    new PublicKey(addr);
    return true;
  } catch {
    return false;
  }
}

async function getVaultBalance() {
  if (!vault) return null;
  return connection.getBalance(vault.publicKey);
}

// Sends integer lamports from the vault. Broadcasts first (so we always have a
// signature to reconcile against), then tries to confirm. Returns
// { signature, confirmed }. A confirmation timeout returns confirmed:false with
// the signature still set — the caller reconciles rather than blindly refunding.
async function sendLamports(toAddress, lamports) {
  if (!vault) throw new Error('vault not configured');
  const amount = Math.round(lamports);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('invalid lamport amount');
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction({ feePayer: vault.publicKey, blockhash, lastValidBlockHeight }).add(
    SystemProgram.transfer({ fromPubkey: vault.publicKey, toPubkey: new PublicKey(toAddress), lamports: amount })
  );
  tx.sign(vault);
  // The signature is fixed once signed — capture it BEFORE sending so that even if
  // sendRawTransaction throws after the tx reached the network, the caller still has
  // a signature to reconcile against (never a blind refund → no double-spend).
  const enc = bs58.default || bs58;
  const signature = enc.encode(tx.signature);
  try {
    await connection.sendRawTransaction(tx.serialize(), { maxRetries: 5 });
  } catch (e) {
    // Broadcast ambiguous: return the signature so the caller holds PENDING and the
    // reconcile cron settles it (COMPLETED if it landed, refund if it never does).
    return { signature, confirmed: false, broadcastError: e.message };
  }
  try {
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
    return { signature, confirmed: true };
  } catch {
    return { signature, confirmed: false };
  }
}

// Definitive on-chain status of a signature: 'landed' | 'dropped' | 'unknown'.
async function signatureLanded(signature) {
  try {
    const { value } = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });
    if (value && (value.confirmationStatus === 'confirmed' || value.confirmationStatus === 'finalized')) {
      return value.err ? 'dropped' : 'landed';
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

module.exports = {
  isLive, isValidAddress, getVaultBalance, sendLamports, signatureLanded,
  LAMPORTS_PER_SOL, vaultPubkey: () => (vault ? vault.publicKey.toBase58() : null),
};
