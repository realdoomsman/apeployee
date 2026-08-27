// Pump.fun creator-fee sweeper. Claims $APEPLOYEE creator fees into the vault so
// payroll can distribute them to workers. Safe no-op unless configured.
//
// Claim backends, chosen by env PUMPFUN_CLAIM_MODE:
//   distribute  -> official @pump-fun/pump-sdk distributeCreatorFees crank. USE THIS
//                  when the coin has a FEE SHARING config (our setup: 100% of shares
//                  -> the vault). Permissionless: the vault cranks the distribution
//                  and receives its share directly.
//   pumpportal  -> PumpPortal collectCreatorFee (classic path — only works when the
//                  signing wallet IS the coin's creator/fee authority; ours is not).
//   off         -> disabled (default).
const axios = require('axios');
const {
  Connection, Keypair, PublicKey, Transaction, VersionedTransaction, ComputeBudgetProgram,
} = require('@solana/web3.js');
const bs58 = require('bs58');

const MODE = (process.env.PUMPFUN_CLAIM_MODE || 'off').toLowerCase();
const MINT = process.env.PUMPFUN_TOKEN_MINT || '';
const RPC = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const KEY = (process.env.SOLANA_PRIVATE_KEY || '').trim();
const dec = (s) => (s.startsWith('[') ? Uint8Array.from(JSON.parse(s)) : (bs58.default || bs58).decode(s));

let creator = null;
if (KEY && MODE !== 'off') {
  try { creator = Keypair.fromSecretKey(dec(KEY)); } catch { creator = null; }
}

const enabled = () => creator !== null && (MODE === 'pumpportal' || (MODE === 'distribute' && Boolean(MINT)));

// Fee-sharing distribution via the official SDK. The vault holds 100% of the fee
// shares, so cranking the distribution pays the vault. Skips (free, simulation-only)
// while accrued fees are below the program's minimum distributable amount.
async function claimViaDistribute(conn) {
  const { OnlinePumpSdk } = require('@pump-fun/pump-sdk');
  const sdk = new OnlinePumpSdk(conn);
  const mintPk = new PublicKey(MINT);

  const min = await sdk.getMinimumDistributableFee(mintPk);
  if (!min.canDistribute) return null; // nothing (or too little) accrued — no tx, no fee

  const before = await conn.getBalance(creator.publicKey);
  const { instructions } = await sdk.buildDistributeCreatorFeesInstructions(mintPk);
  const tx = new Transaction()
    .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }))
    .add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 }))
    .add(...instructions);
  tx.feePayer = creator.publicKey;
  tx.recentBlockhash = (await conn.getLatestBlockhash('confirmed')).blockhash;
  tx.sign(creator);
  const sig = await conn.sendRawTransaction(tx.serialize());
  await conn.confirmTransaction(sig, 'confirmed');

  const after = await conn.getBalance(creator.publicKey);
  return { signature: sig, claimed: Math.max(0, after - before) };
}

// Legacy classic-creator claim via PumpPortal (kept for coins created BY the vault).
async function claimViaPumpPortal(conn) {
  const before = await conn.getBalance(creator.publicKey);
  const res = await axios.post('https://pumpportal.fun/api/trade-local', {
    publicKey: creator.publicKey.toBase58(),
    action: 'collectCreatorFee',
    priorityFee: 0.000001,
    pool: 'pump',
  }, { responseType: 'arraybuffer' });
  const tx = VersionedTransaction.deserialize(new Uint8Array(res.data));
  tx.sign([creator]);
  const sig = await conn.sendRawTransaction(tx.serialize());
  await conn.confirmTransaction(sig, 'confirmed');
  const after = await conn.getBalance(creator.publicKey);
  return { signature: sig, claimed: Math.max(0, after - before) };
}

// Claims outstanding creator fees to the vault. Returns { signature, claimed } or null.
async function claimFees() {
  if (!enabled()) return null;
  const conn = new Connection(RPC, 'confirmed');
  return MODE === 'distribute' ? claimViaDistribute(conn) : claimViaPumpPortal(conn);
}

module.exports = { enabled, claimFees, mode: MODE, mint: MINT };
