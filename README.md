# 🦍 Apeployee

**The First Memecoin Where You Get PAID to Shill Your Bags**

> "The market is rough. People need work. We're the first memecoin where the community gets jobs — real positions, real pay, for working for your bags."

## 🌟 What is Apeployee?

Apeployee is a revolutionary platform that transforms memecoin shilling into a legitimate job market. Users can apply for positions like **Bag Worker**, **Meme Maker**, **Shill Captain**, and **Ape Artist**, then get paid in SOL for every engagement they generate.

### Core Features

- **Job Application System** → Apply for real positions with base pay + performance bonuses
- **X Account Verification** → Link and verify your Twitter account
- **Automated Shill Tracking** → Track tweets, engagement metrics, and earnings automatically
- **Pump.fun Integration** → Auto-distribute creator fees to workers
- **Vault Wallet Automation** → Treasury management with on-chain transparency
- **Ape Rank System** → Level up from Chimpanzee → Silverback (3x earnings multiplier)
- **Bounty Board** → Complete specific shilling missions for upfront SOL payouts
- **Referral Program** → Earn 10% of referred users' first month earnings
- **Performance Dashboard** → Real-time stats, earnings, and leaderboard
- **On-Chain Badges** → NFT reputation badges for milestones
- **Auto-Reinvest** → Compound earnings back into more tokens
- **Monkey Business DAO** → Governance tokens for long-term contributors

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Apeployee Platform                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   React 19   │  │  Express.js  │  │   Anchor     │          │
│  │   Frontend   │  │   Backend    │  │  Solana      │          │
│  │              │  │              │  │  Program     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Phantom     │  │  Prisma +    │  │   Vault      │          │
│  │  Wallet      │  │  PostgreSQL  │  │   Treasury   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              External Integrations                       │     │
│  │  • X (Twitter) API for shill tracking                  │     │
│  │  • Pump.fun API for fee distribution                   │     │
│  │  • Solana RPC for on-chain payments                    │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Tech Stack

### Frontend
- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS** with custom ape-themed design system
- **Lucide React** icons
- **Phantom Wallet** integration
- **@solana/web3.js** for wallet connections

### Backend
- **Node.js** + **Express.js**
- **Prisma ORM** + **PostgreSQL**
- **@solana/web3.js** for on-chain operations
- **X (Twitter) API** for shill tracking
- **Axios** for external API calls

### Smart Contract
- **Anchor Framework** (Solana)
- **Vault Treasury** for fee collection and distribution
- **On-chain payment records**
- **Authority-based access control**

### Database
- **PostgreSQL** with Prisma ORM
- Complete schema for users, jobs, shills, payments, bounties, referrals, badges

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Solana CLI
- Anchor Framework
- Rust (for building Anchor programs)

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/Apeployed.git
cd Apeployed
```

### 2. Install Dependencies

**Frontend:**
```bash
cd frontend
npm install
```

**Backend:**
```bash
cd ../backend
npm install
```

**Smart Contract:**
```bash
cd ../programs
npm install
```

### 3. Set Up Environment Variables

**Backend (backend/.env):**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/apeployed"
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
SOLANA_PRIVATE_KEY="[...]vault_private_key_array"
PUMPFUN_API_KEY="your_pumpfun_api_key"
PUMPFUN_CREATOR_WALLET="creator_wallet_address"
PUMPFUN_TREASURY_WALLET="treasury_wallet_address"
TWITTER_API_KEY="your_twitter_api_key"
TWITTER_API_SECRET="your_twitter_api_secret"
TWITTER_BEARER_TOKEN="your_twitter_bearer_token"
TWITTER_CALLBACK_URL="http://localhost:5173/auth/twitter/callback"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

**Frontend (frontend/.env):**
```env
VITE_API_URL=http://localhost:3001
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### 4. Set Up Database

**Create PostgreSQL database:**
```bash
createdb apeployed
```

**Run Prisma migrations:**
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Build and Deploy Smart Contract

**Build the Anchor program:**
```bash
cd ..
anchor build
```

**Deploy to Solana:**
```bash
# Set network (devnet for testing, mainnet for production)
solana config set --url mainnet

# Deploy
anchor deploy
```

**Update program ID in:**
- `programs/Cargo.toml`
- `Anchor.toml`
- `programs/src/lib.rs`

## 🎮 Usage

### Start Development Servers

**Backend:**
```bash
cd backend
node server.js
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` to see the Apeployee dashboard.

### Smart Contract Operations

**Initialize Vault:**
```bash
anchor test --test init_vault
```

**Collect Fees:**
```bash
anchor test --test collect_fees
```

**Distribute Earnings:**
```bash
anchor test --test distribute_earnings
```

## 📊 Database Schema

Key models:
- **User** → Wallet address, X account, ape rank, earnings, reputation
- **Job** → Available positions with base pay and bonuses
- **JobApplication** → User applications with status tracking
- **ShillRecord** → Tweet tracking with engagement metrics
- **Payment** → Payment history and on-chain transaction hashes
- **Bounty** → Specific tasks with upfront rewards
- **Referral** → Referral tracking and bonus management
- **Badge** → On-chain reputation badges (NFTs)

See `prisma/schema.prisma` for complete schema.

## 🦍 Ape Rank System

| Rank | Shills Required | Earning Multiplier |
|------|-----------------|-------------------|
| 🐒 Chimpanzee | 0 | 1.0x |
| 🦍 Baboon | 100 | 1.2x |
| 🦧 Orangutan | 500 | 1.5x |
| 🦍 Gorilla | 1,000 | 2.0x |
| 👑 Silverback | 5,000 | 3.0x |

## 💰 Earnings Calculation

**Shill Earnings Formula:**
```
earnings = (likes × 0.00001) + (retweets × 0.00002) + (views × 0.0000001)
final_earnings = earnings × rank_multiplier
```

**Example:**
- Tweet with 100 likes, 20 retweets, 1,000 views
- Base: (100 × 0.00001) + (20 × 0.00002) + (1000 × 0.0000001) = 0.0017 SOL
- With Baboon rank (1.2x): 0.00204 SOL

## 🔐 Security

- **Vault Wallet** → Private key encrypted in environment variables
- **Authority Control** → Only authorized addresses can distribute funds
- **On-Chain Records** → Every payment recorded immutably
- **Rate Limiting** → API endpoints protected from abuse
- **X Verification** → OAuth 2.0 secure authentication

## 🚢 Deployment

### Frontend (Vercel/Railway)
```bash
cd frontend
npm run build
# Deploy to Vercel: vercel --prod
# Deploy to Railway: railway up
```

### Backend (Railway/Heroku)
```bash
cd backend
# Deploy to Railway: railway up
# Deploy to Heroku: heroku create
```

### Database (Railway/Supabase/Neon)
- Use managed PostgreSQL service
- Update `DATABASE_URL` in environment variables

### Smart Contract
```bash
# Ensure you're on mainnet
solana config set --url mainnet

# Deploy
anchor deploy --provider.cluster mainnet
```

## 🧪 Testing

**Backend Tests:**
```bash
cd backend
npm test
```

**Smart Contract Tests:**
```bash
anchor test
```

**Frontend Tests:**
```bash
cd frontend
npm test
```

## 📈 Roadmap

### Phase 1: MVP ✅
- [x] Wallet connection
- [x] Job application system
- [x] Shill tracking
- [x] Basic payments
- [x] Ape rank system

### Phase 2: Advanced Features
- [ ] Pump.fun integration
- [ ] Auto-reinvest system
- [ ] On-chain NFT badges
- [ ] Referral program
- [ ] DAO governance

### Phase 3: Scaling
- [ ] Multi-token support
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Enterprise partnerships

## 🤝 Contributing

Contributions welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Solana ecosystem
- Pump.fun platform
- X (Twitter) API
- Phantom wallet
- The memecoin community

## 📞 Support

- Discord: [Join our server]
- Twitter: [@Apeployee]
- GitHub Issues: [Report bugs]

---

**Built with ❤️ by the Apeployee team**

*Remember: The market is rough. People need work. We're hiring.* 🦍💰
