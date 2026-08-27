// Pump.fun creator-fee sweeper. Claims $APE creator fees into the vault so the
// payroll can distribute them to workers. Enabled only when the creator key +
// mint are configured; otherwise a safe no-op (the app runs fully without it).
//
// Two claim backends, chosen by env:
//   PUMPFUN_CLAIM_MODE=pumpportal  -> PumpPortal /api/trade-local (build+sign locally)
//   PUMPFUN_CLAIM_MODE=off (default until launch)
//
// The creator fee wallet IS the vault wallet (SOLANA_PRIVATE_KEY), so claimed
// SOL lands directly in the vault the payroll pays from.
const axios = require('axios');
const {
  Connection, Keypair, VersionedTransaction,
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

const enabled = () => creator !== null && MODE === 'pumpportal';

// Claims all outstanding creator fees to the vault. Returns lamports claimed
// (best-effort; PumpPortal doesn't report the amount, so we diff the balance).
async function claimFees() {
  if (!enabled()) return 0;
  const conn = new Connection(RPC, 'confirmed');
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

module.exports = { enabled, claimFees, mode: MODE, mint: MINT };
