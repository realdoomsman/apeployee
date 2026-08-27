// One-time on-chain setup for Worker Pass minting.
//   node scripts/setup-nft.js
// Requires SOLANA_PRIVATE_KEY (funded on the target cluster) and SOLANA_RPC_URL.
// Creates a Merkle tree (capacity for the collection + future seasons) and a
// collection NFT, then prints the env vars to add. Idempotent-ish: re-running
// creates NEW addresses, so only run once and save the output.
require('dotenv').config();
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { generateSigner, keypairIdentity, percentAmount } = require('@metaplex-foundation/umi');
const { createTree } = require('@metaplex-foundation/mpl-bubblegum');
const { createNft } = require('@metaplex-foundation/mpl-token-metadata');
const bs58 = require('bs58');

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:3001';

async function main() {
  const RPC = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const KEY = (process.env.SOLANA_PRIVATE_KEY || '').trim();
  if (!KEY) throw new Error('set SOLANA_PRIVATE_KEY (funded on this cluster) in backend/.env first');

  const umi = createUmi(RPC);
  const secret = KEY.startsWith('[') ? Uint8Array.from(JSON.parse(KEY)) : (bs58.default || bs58).decode(KEY);
  umi.use(keypairIdentity(umi.eddsa.createKeypairFromSecretKey(secret)));
  console.log(`authority: ${umi.identity.publicKey}`);
  console.log(`cluster:   ${RPC}`);

  // Tree sized for 16384 leaves (>1000 collection + future mining seasons).
  const merkleTree = generateSigner(umi);
  console.log('\ncreating Merkle tree…');
  await (await createTree(umi, { merkleTree, maxDepth: 14, maxBufferSize: 64 })).sendAndConfirm(umi);
  console.log(`  tree: ${merkleTree.publicKey}`);

  console.log('creating collection NFT…');
  const collectionMint = generateSigner(umi);
  await createNft(umi, {
    mint: collectionMint,
    name: 'Apeployee Worker Pass',
    uri: `${PUBLIC_BASE_URL}/nft/collection.json`,
    sellerFeeBasisPoints: percentAmount(5),
    isCollection: true,
  }).sendAndConfirm(umi);
  console.log(`  collection: ${collectionMint.publicKey}`);

  console.log('\n=== add these to backend/.env ===');
  console.log(`NFT_MERKLE_TREE="${merkleTree.publicKey}"`);
  console.log(`NFT_COLLECTION_MINT="${collectionMint.publicKey}"`);
  console.log('=================================');
  console.log('Then restart the server; newly mined passes will mint on-chain.');
  console.log('Backfill already-mined passes with: node scripts/mint-existing.js');
}

main().catch((e) => { console.error(e); process.exit(1); });
