// On-chain Worker Pass minting — compressed NFTs via Metaplex Bubblegum.
// Enabled only when a vault key, a Merkle tree, and a collection are configured
// (see scripts/setup-nft.js). Without them the app runs fully; passes are just
// tracked off-chain in the NftPass table until launch.
const {
  createUmi,
} = require('@metaplex-foundation/umi-bundle-defaults');
const {
  keypairIdentity, publicKey, none, some,
} = require('@metaplex-foundation/umi');
const { mintToCollectionV1, parseLeafFromMintToCollectionV1Transaction } = require('@metaplex-foundation/mpl-bubblegum');
const bs58 = require('bs58');

const RPC = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const TREE = process.env.NFT_MERKLE_TREE || '';
const COLLECTION = process.env.NFT_COLLECTION_MINT || '';
const KEY = (process.env.SOLANA_PRIVATE_KEY || '').trim();
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:3001';
const TICKER = process.env.TICKER || '$APE';

let umi = null;
if (KEY && TREE && COLLECTION) {
  try {
    umi = createUmi(RPC);
    const secret = KEY.startsWith('[') ? Uint8Array.from(JSON.parse(KEY)) : (bs58.default || bs58).decode(KEY);
    const kp = umi.eddsa.createKeypairFromSecretKey(secret);
    umi.use(keypairIdentity(kp));
    console.log(`[mint] on-chain minting ENABLED — tree ${TREE.slice(0, 8)}… collection ${COLLECTION.slice(0, 8)}…`);
  } catch (e) {
    umi = null;
    console.error('[mint] disabled — bad config:', e.message);
  }
}

const enabled = () => umi !== null;

// Mints pass to `toAddress` (the holder's payout address) or, if none, to the
// vault identity as custodian. Returns the mint transaction signature (base58).
async function mintPass(pass, toAddress) {
  if (!umi) throw new Error('minting not configured');
  const num = String(pass.id).padStart(3, '0');
  const owner = toAddress ? publicKey(toAddress) : umi.identity.publicKey;
  const builder = mintToCollectionV1(umi, {
    leafOwner: owner,
    merkleTree: publicKey(TREE),
    collectionMint: publicKey(COLLECTION),
    metadata: {
      name: `Apeployee Worker Pass #${num}`,
      uri: `${PUBLIC_BASE_URL}/nft/metadata/${num}`,
      sellerFeeBasisPoints: 500,
      collection: some({ key: publicKey(COLLECTION), verified: false }),
      creators: [{ address: umi.identity.publicKey, verified: true, share: 100 }],
    },
  });
  const { signature } = await builder.sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } });
  return bs58.default ? bs58.default.encode(signature) : bs58.encode(signature);
}

module.exports = { enabled, mintPass };
