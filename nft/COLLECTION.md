<!-- OWNED-BY-CLAUDE — GLM: do not edit anything under nft/ -->
# 🦍 Apeployee Worker Pass — NFT Collection

300 generative office-monkey PFPs. Holding a Worker Pass in your wallet boosts your
shill pay — passes are auto-mined for workers as they work (see backend integration below).

## Rarity & pay boost

| Tier | Count | Pay Boost | Signature traits |
|---|---|---|---|
| Common | 150 | 1.05x | Everyday office apes (XP Bliss / Office / Jungle) |
| Uncommon | 90 | 1.10x | Sunset Grind, Hawaiian, Sunglasses, Headset, Banana Phone |
| Rare | 40 | 1.20x | Server Room, Business Suit, Monocle, Hard Hat, Party Hat, Money Stack |
| Epic | 15 | 1.35x | Golden fur, always |
| Legendary | 5 | 1.50x | Silverback fur + Crown + Gold Suit + Golden Vault, always |

Boost values are defaults — the backend maps `Tier -> multiplier`, so tuning pay
does not require re-minting. Only the user's **highest-tier held pass** should count
(no stacking), enforced server-side.

## Files

- `output/images/001.png … 300.png` — 1000×1000 renders
- `output/metadata/001.json … 300.json` — Metaplex-standard metadata (image URIs are
  relative filenames; the upload pipeline rewrites them at asset-upload time)
- `output/manifest.json` — flat list of every token's tier + traits
- `output/contact-sheet.png` — all 300 at a glance
- `generator/` — deterministic generator (seeded RNG; same seed ⇒ same collection).
  Regenerate with `node generate.js`; tier previews with `node generate.js --sample`.

## Traits

6 layers + a constant brand element (every ape wears the purple lanyard with the
APEPLOYEE ID badge):
Background (6) · Fur (5) · Outfit (6) · Eyewear (5) · Headwear (7) · Item (6).
Higher tiers unlock flashier pools; Epic forces Golden fur; Legendary is fully forced
except eyewear. All 300 combinations are unique (verified in the generator).

## Mint plan (next step, not yet done)

Compressed NFTs via Metaplex Bubblegum V2 (~0.00001 SOL per mint):
1. Upload images+metadata to Arweave/Irys or IPFS; rewrite `image`/`files.uri`.
2. Create one Merkle tree sized ≥ 1024 leaves (this 300 + future mining seasons).
3. Backend "mining" service mints a pass **directly to the worker's wallet** (no user
   signature needed — leafOwner can be any pubkey) when they hit work milestones.
4. Boost check: DAS API (Helius `getAssetsByOwner`, filter by collection) on a cron;
   writes `User.nftBoostMultiplier` — the field GLM's earnings calc reads.

## Integration contract (agreed with GLM)

- GLM reads `User.nftBoostMultiplier` (default 1.0) in earnings calculation.
- This engine (Claude's lane) is the only writer of that field.
- Everything under `nft/` and `backend/services/nft/` is Claude's lane.
