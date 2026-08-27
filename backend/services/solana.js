// Solana vault service. The vault is a hot keypair loaded from SOLANA_PRIVATE_KEY.
// With no key configured, payouts run in SIMULATED mode (clearly labeled, no chain calls).
const {
  Connection, Keypair, PublicKey, SystemProgram, Transaction,
  sendAndConfirmTransaction, LAMPORTS_PER_SOL,
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

// Sends integer lamports from the vault. Returns the confirmed signature.
async function sendLamports(toAddress, lamports) {
  if (!vault) throw new Error('vault not configured');
  const amount = Math.round(lamports);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('invalid lamport amount');
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: vault.publicKey,
      toPubkey: new PublicKey(toAddress),
      lamports: amount,
    })
  );
  return sendAndConfirmTransaction(connection, tx, [vault]);
}

module.exports = { isLive, isValidAddress, getVaultBalance, sendLamports, LAMPORTS_PER_SOL, vaultPubkey: () => (vault ? vault.publicKey.toBase58() : null) };
