<!-- OWNED-BY-CLAUDE — GLM: do not edit anything under nft/ -->
# 🦍 Apeployee Worker Pass — NFT Collection

1000 generative office-monkey PFPs (Season 1: ids 001–300, Season 2: ids 301–1000).
Holding a Worker Pass in your wallet boosts your shill pay — passes are auto-mined
for workers as they work (see backend integration below).

## Rarity & pay boost (totals across both seasons)

| Tier | Count | Pay Boost | Signature traits |
|---|---|---|---|
| Common | 500 | 1.05x | Everyday office apes (XP Bliss / Office / Jungle, Beanie) |
| Uncommon | 300 | 1.10x | Sunset Grind, Trading Floor, Hawaiian, Hi-Vis Vest, Sunglasses, 3D Glasses, Headset, Banana Phone |
| Rare | 140 | 1.20x | Server Room, Moon Desk, Albino fur, Business Suit, Tracksuit, Monocle, Hard Hat, Party Hat, Propeller Cap, Money Stack |
| Epic | 45 | 1.35x | Golden fur always; can carry Laser Eyes and Diamond |
| Legendary | 15 | 1.50x | Silverback fur + Crown + Gold Suit + Golden Vault always; Golden Banana / Diamond / Money Stack |

Boost values are defaults — the backend maps `Tier -> multiplier`, so tuning pay
does not require re-minting. Only the user's **highest-tier held pass** should count
(no stacking), enforced server-side.

## Files

- `output/images/001.png … 1000.png` — 1000×1000 renders (Season 1 files unchanged by Season 2)
- `output/metadata/001.json … 1000.json` — Metaplex-standard metadata (image URIs are
  relative filenames; the upload pipeline rewrites them at asset-upload time)
- `output/manifest.json` — flat list of every token's tier + traits
- `output/contact-sheet.png` — all 1000 at a glance (40×25 grid)
- `generator/` — deterministic generator (seeded RNG; Season 1 seed 0xA9E10, Season 2
  seed 0xA9E20). First run produces 001–300; a rerun with the manifest present extends
  to 301–1000. Tier previews: `node generate.js --sample`.

## Traits

6 layers + a constant brand element (every ape wears the purple lanyard with the
APEPLOYEE ID badge):
Background (8) · Fur (6) · Outfit (8) · Eyewear (7) · Headwear (9) · Item (8).
Higher tiers unlock flashier pools; Epic forces Golden fur; Legendary is fully forced
except eyewear + item. All 1000 combinations are unique (enforced in the generator,
verified after generation).

## Mint plan (next step, not yet done)

Compressed NFTs via Metaplex Bubblegum V2 (~0.00001 SOL per mint):
1. Upload images+metadata to Arweave/Irys or IPFS; rewrite `image`/`files.uri`.
2. Create one Merkle tree sized ≥ 2048 leaves (this 1000 + future mining seasons).
3. Backend "mining" service mints a pass **directly to the worker's wallet** (no user
   signature needed — leafOwner can be any pubkey) when they hit work milestones.
4. Boost check: DAS API (Helius `getAssetsByOwner`, filter by collection) on a cron;
   writes `User.nftBoostMultiplier` — the field GLM's earnings calc reads.

## Integration contract (agreed with GLM)

- GLM reads `User.nftBoostMultiplier` (default 1.0) in earnings calculation.
- This engine (Claude's lane) is the only writer of that field.
- Everything under `nft/` and `backend/services/nft/` is Claude's lane.
