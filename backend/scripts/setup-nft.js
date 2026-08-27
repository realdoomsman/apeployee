// One-time on-chain setup for Worker Pass minting.
//   node scripts/setup-nft.js
// Requires SOLANA_PRIVATE_KEY (funded on the target cluster) and SOLANA_RPC_URL.
// Creates a Merkle tree (capacity for the collection + future seasons) and a
// collection NFT, then prints the env vars to add. Idempotent-ish: re-running
// creates NEW addresses, so only run once and save the output.
require('dotenv').config();
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { generateSigner, keypairIdentity, percentAmount } = require('@metaplex-foundation/umi');
const { createTree, mplBubblegum } = require('@metaplex-foundation/mpl-bubblegum');
const { createNft, mplTokenMetadata } = require('@metaplex-foundation/mpl-token-metadata');
const { mplToolbox } = require('@metaplex-foundation/mpl-toolbox');
const bs58 = require('bs58');

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:3001';

async function main() {
  const RPC = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const KEY = (process.env.SOLANA_PRIVATE_KEY || '').trim();
  if (!KEY) throw new Error('set SOLANA_PRIVATE_KEY (funded on this cluster) in backend/.env first');

  // Register the programs createNft/createTree need (splAssociatedToken lives in mplToolbox).
  const umi = createUmi(RPC).use(mplToolbox()).use(mplTokenMetadata()).use(mplBubblegum());
  const secret = KEY.startsWith('[') ? Uint8Array.from(JSON.parse(KEY)) : (bs58.default || bs58).decode(KEY);
  umi.use(keypairIdentity(umi.eddsa.createKeypairFromSecretKey(secret)));
  console.log(`authority: ${umi.identity.publicKey}`);
  console.log(`cluster:   ${RPC}`);

  // Reuse an existing tree/collection if already created (so a re-run never double-spends).
  let tree = (process.env.NFT_MERKLE_TREE || '').trim();
  if (tree) {
    console.log(`\nusing existing Merkle tree: ${tree}`);
  } else {
    const merkleTree = generateSigner(umi);
    console.log('\ncreating Merkle tree…');
    await (await createTree(umi, { merkleTree, maxDepth: 14, maxBufferSize: 64 })).sendAndConfirm(umi);
    tree = merkleTree.publicKey;
    console.log(`  tree: ${tree}`);
  }

  let collection = (process.env.NFT_COLLECTION_MINT || '').trim();
  if (collection) {
    console.log(`using existing collection: ${collection}`);
  } else {
    console.log('creating collection NFT…');
    const collectionMint = generateSigner(umi);
    await createNft(umi, {
      mint: collectionMint,
      name: 'Apeployee Worker Pass',
      uri: `${PUBLIC_BASE_URL}/nft/collection.json`,
      sellerFeeBasisPoints: percentAmount(5),
      isCollection: true,
    }).sendAndConfirm(umi);
    collection = collectionMint.publicKey;
    console.log(`  collection: ${collection}`);
  }

  console.log('\n=== add these to Railway variables (and backend/.env) ===');
  console.log(`NFT_MERKLE_TREE="${tree}"`);
  console.log(`NFT_COLLECTION_MINT="${collection}"`);
  console.log('==========================================================');
}

main().catch((e) => { console.error(e); process.exit(1); });
