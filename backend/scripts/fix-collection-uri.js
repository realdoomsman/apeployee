// One-time fix: point the collection NFT's metadata URI at the live domain.
//   node scripts/fix-collection-uri.js
// (setup-nft.js baked in the local PUBLIC_BASE_URL — http://localhost:3001 —
// which marketplaces can never fetch, so Magic Eden showed a blank image.)
// Signs one updateV1 tx with the vault key; costs only the ~0.000005 SOL fee.
require('dotenv').config();
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { keypairIdentity, publicKey } = require('@metaplex-foundation/umi');
const { updateV1, fetchMetadataFromSeeds, mplTokenMetadata } = require('@metaplex-foundation/mpl-token-metadata');
const { mplToolbox } = require('@metaplex-foundation/mpl-toolbox');
const bs58 = require('bs58');

// Deliberately NOT read from PUBLIC_BASE_URL — that's how localhost got on-chain.
const NEW_URI = process.argv[2] || 'https://apeployee.fun/nft/collection.json';

async function main() {
  const RPC = process.env.SOLANA_RPC_URL;
  const KEY = (process.env.SOLANA_PRIVATE_KEY || '').trim();
  const MINT = (process.env.NFT_COLLECTION_MINT || '').trim();
  if (!RPC || !KEY || !MINT) throw new Error('need SOLANA_RPC_URL, SOLANA_PRIVATE_KEY, NFT_COLLECTION_MINT in backend/.env');

  const umi = createUmi(RPC).use(mplToolbox()).use(mplTokenMetadata());
  const secret = KEY.startsWith('[') ? Uint8Array.from(JSON.parse(KEY)) : (bs58.default || bs58).decode(KEY);
  umi.use(keypairIdentity(umi.eddsa.createKeypairFromSecretKey(secret)));

  const mint = publicKey(MINT);
  const current = await fetchMetadataFromSeeds(umi, { mint });
  console.log(`collection: ${MINT}`);
  console.log(`current URI: ${current.uri}`);
  if (current.uri === NEW_URI) { console.log('already correct — nothing to do.'); return; }

  console.log(`new URI:     ${NEW_URI}`);
  await updateV1(umi, { mint, authority: umi.identity, data: { ...current, uri: NEW_URI } })
    .sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } });
  console.log('URI updated on-chain. Hit the refresh icon on the Magic Eden page (or wait for its next crawl).');
}

main().catch((e) => { console.error(e); process.exit(1); });
