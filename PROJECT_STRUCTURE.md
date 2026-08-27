# Apeployee - Project Structure

```
C:\tech\Apeployed/
├── README.md                          # Main documentation
├── DEPLOYMENT.md                      # Deployment guide
├── PROJECT_STRUCTURE.md               # This file
├── docker-compose.yml                 # Docker orchestration
├── Anchor.toml                        # Anchor configuration
├── .gitignore                         # Git ignore rules
│
├── backend/                           # Node.js/Express API
│   ├── package.json                   # Backend dependencies
│   ├── server.js                      # Main API server
│   ├── .env                           # Environment variables (not committed)
│   ├── .gitignore                     # Backend git ignore
│   ├── railway.json                   # Railway deployment config
│   ├── Dockerfile                     # Backend Docker image
│   └── prisma/
│       └── schema.prisma              # Database schema
│
├── frontend/                          # React 19 + Vite + TypeScript
│   ├── package.json                   # Frontend dependencies
│   ├── vite.config.ts                 # Vite configuration
│   ├── tailwind.config.js             # Tailwind CSS config
│   ├── postcss.config.js              # PostCSS config
│   ├── .env                           # Environment variables (not committed)
│   ├── railway.json                   # Railway deployment config
│   ├── Dockerfile                     # Frontend Docker image
│   ├── index.html                     # HTML entry point
│   └── src/
│       ├── main.tsx                   # React entry point
│       ├── App.tsx                    # Main React component
│       └── index.css                  # Global styles
│
└── programs/                          # Anchor Solana program
    ├── package.json                   # Program dependencies
    ├── Cargo.toml                     # Rust crate config
    └── src/
        └── lib.rs                     # Solana smart contract
```

## 📂 Detailed Directory Breakdown

### Root Directory
- **README.md**: Complete project documentation, features, tech stack, installation, usage
- **DEPLOYMENT.md**: Step-by-step deployment guide for Railway, environment variables, troubleshooting
- **PROJECT_STRUCTURE.md**: This file, explaining the project structure
- **docker-compose.yml**: Local development with Docker (PostgreSQL + Backend + Frontend)
- **Anchor.toml**: Anchor framework configuration for Solana program deployment
- **.gitignore**: Git ignore patterns for the entire project

### Backend (`backend/`)
Core API server built with Express.js and Prisma.

**Key Files:**
- `server.js`: Main Express server with all API endpoints
  - Auth: `/api/auth/wallet` - Wallet connection and user registration
  - Jobs: `/api/jobs` - Job listings and applications
  - Shills: `/api/shill/*` - Shill submission and tracking
  - Bounties: `/api/bounties/*` - Bounty system
  - Payments: `/api/payments/*` - Payment requests and history
  - Leaderboard: `/api/leaderboard` - Top shillers ranking
  - Referrals: `/api/referrals` - Referral system
  - Utility: `/health` - Health check endpoint

- `prisma/schema.prisma`: Complete database schema
  - User: Wallet, X account, rank, earnings
  - Job: Job postings with roles and pay
  - JobApplication: User job applications
  - ShillRecord: Tweet tracking with metrics
  - Payment: Payment history and status
  - Bounty: Task-based rewards
  - Referral: Referral tracking
  - Badge: On-chain reputation badges
  - VaultTransaction: Treasury management

**Features:**
- X (Twitter) API integration for shill tracking
- Solana Web3.js for on-chain payments
- Pump.fun fee distribution system
- Automatic rank upgrades
- Earnings calculation based on engagement

### Frontend (`frontend/`)
React 19 application with TypeScript and Tailwind CSS.

**Key Files:**
- `src/App.tsx`: Main React component with all UI
  - Landing page with "Connect Wallet"
  - Dashboard with stats and earnings
  - Jobs section with application form
  - Shills section with submission form
  - Bounties section with active tasks
  - Leaderboard with top shillers
  - Ape rank display (Chimpanzee → Silverback)

- `src/index.css`: Custom CSS with:
  - Ape-themed color palette (brown, green, yellow)
  - Custom utility classes (.ape-card, .ape-button, etc.)
  - Jungle pattern background
  - Custom scrollbars
  - Animations (float, pulse-glow)

- `src/main.tsx`: React entry point with Phantom wallet types

**Features:**
- Phantom wallet integration
- Real-time stats and earnings display
- Job application flow
- Shill submission with tweet URL parsing
- Leaderboard with rankings
- Responsive design for mobile/desktop

### Programs (`programs/`)
Anchor Solana smart contract for vault treasury.

**Key File:**
- `src/lib.rs`: Main program with instructions:
  - `initialize_vault`: Create the treasury with authority
  - `collect_fees`: Collect Pump.fun creator fees
  - `distribute_earnings`: Pay workers from vault
  - `update_authority`: Change vault authority

**Features:**
- PDA-based vault account
- Authority-based access control
- On-chain payment records
- Fee collection and distribution tracking

## 🔄 Data Flow

```
1. User connects Phantom wallet
   ↓
2. Frontend calls /api/auth/wallet
   ↓
3. Backend creates/updates user in PostgreSQL
   ↓
4. User browses jobs and applies
   ↓
5. User submits tweet URLs for shilling
   ↓
6. Backend fetches tweet metrics from X API
   ↓
7. Backend calculates earnings based on engagement
   ↓
8. Backend updates user stats and checks rank upgrade
   ↓
9. User requests payout
   ↓
10. Backend creates Solana transaction from vault wallet
   ↓
11. Backend records payment on-chain and in database
   ↓
12. Frontend displays updated earnings
```

## 🛠️ Development Workflow

### Local Development
```bash
# Start all services with Docker
docker-compose up -d

# Or start individually:
# 1. Start PostgreSQL (or use Docker)
# 2. Start backend
cd backend
node server.js

# 3. Start frontend
cd frontend
npm run dev
```

### Database Migrations
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### Building Smart Contract
```bash
cd ..
anchor build
anchor deploy
```

### Running Tests
```bash
# Backend
cd backend
npm test

# Smart Contract
anchor test

# Frontend
cd frontend
npm test
```

## 📦 Key Dependencies

### Backend
- `express`: Web framework
- `@prisma/client`: Database ORM
- `@solana/web3.js`: Solana blockchain interaction
- `axios`: HTTP client for X API
- `cors`: Cross-origin resource sharing
- `dotenv`: Environment variable management

### Frontend
- `react`: UI library
- `@solana/web3.js`: Solana wallet connection
- `axios`: API client
- `lucide-react`: Icon library
- `tailwindcss`: CSS framework

### Smart Contract
- `anchor-lang`: Solana framework
- `solana-program`: Solana program library

## 🔐 Security Considerations

- Vault wallet private key stored in environment variables (never in git)
- JWT secret for authentication
- X API credentials for shill tracking
- Authority-based access control on smart contract
- Rate limiting on API endpoints
- CORS configuration for frontend-backend communication

## 🚀 Deployment Strategy

### Railway (Recommended)
1. PostgreSQL service
2. Backend service (Node.js)
3. Frontend service (static site)
4. Custom domains with SSL

### Alternative: Self-Hosted
1. Docker Compose for orchestration
2. Nginx reverse proxy
3. PostgreSQL database
4. PM2 process manager for Node.js

## 📊 Key Metrics Tracked

- **User Metrics**: Total users, active users, new signups
- **Earnings Metrics**: Total SOL distributed, average earnings per user
- **Shill Metrics**: Total shills, average engagement per shill
- **Job Metrics**: Jobs posted, applications, hires
- **Rank Distribution**: Users per rank level

## 🎯 Next Steps for Production

1. ✅ Complete codebase (done)
2. ⏳ Set up Railway deployment
3. ⏳ Configure X API access
4. ⏳ Set up Pump.fun integration
5. ⏳ Deploy smart contract to mainnet
6. ⏳ Configure domain and SSL
7. ⏳ Set up monitoring and alerts
8. ⏳ Test complete user flow
9. ⏳ Launch!

## 📞 Support

For issues or questions:
- Check README.md for documentation
- Check DEPLOYMENT.md for deployment issues
- Review code comments in server.js and App.tsx
- Open GitHub issue

---

**Built with 🦍 for the memecoin community**
