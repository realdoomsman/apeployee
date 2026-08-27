# 🦍 Apeployee - Quick Start Guide

Get Apeployed up and running in 5 minutes!

## ⚡ Prerequisites

Before starting, make sure you have:
- Node.js 18+ installed
- PostgreSQL 14+ (or use Docker)
- Git
- Phantom wallet browser extension

## 🚀 Option 1: Docker (Fastest)

### 1. Clone and Start
```bash
git clone <your-repo-url> Apeployed
cd Apeployed
docker-compose up -d
```

### 2. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Database: localhost:5432

### 3. That's It!
The application is now running with:
- PostgreSQL database
- Backend API server
- Frontend React app

---

## 🛠️ Option 2: Manual Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url> Apeployed
cd Apeployed
```

### 2. Set Up Database

**Using Docker (easiest):**
```bash
docker run -d \
  --name apeployed-db \
  -e POSTGRES_USER=apeployee \
  -e POSTGRES_PASSWORD=apeployee_secure_password \
  -e POSTGRES_DB=apeployed \
  -p 5432:5432 \
  postgres:16-alpine
```

**Or use existing PostgreSQL:**
```bash
createdb apeployee
```

### 3. Configure Backend
```bash
cd backend
npm install
```

Create `.env` file:
```env
DATABASE_URL="postgresql://apeployee:apeployee_secure_password@localhost:5432/apeployed?schema=public"
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
PORT=3001
FRONTEND_URL="http://localhost:5173"
JWT_SECRET="your-super-secret-jwt-key-change-this"
# Other vars are optional for testing
```

Run migrations:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

Start backend:
```bash
node server.js
```

### 4. Configure Frontend
```bash
cd ../frontend
npm install
```

Create `.env` file:
```env
VITE_API_URL=http://localhost:3001
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

Start frontend:
```bash
npm run dev
```

### 5. Access the Application
Open http://localhost:5173 in your browser

---

## 🎮 First Steps

1. **Connect Your Wallet**
   - Click "Connect Wallet to Get Started"
   - Approve the Phantom wallet connection

2. **Explore the Dashboard**
   - View your current stats (earnings, shills, rank)
   - Check available jobs
   - Browse active bounties

3. **Apply for a Job**
   - Go to "Jobs" tab
   - Find a job that interests you
   - Click "Apply Now"

4. **Submit Your First Shill**
   - Go to "My Shills" tab
   - Paste a tweet URL where you shilled a token
   - Enter the ticker symbol
   - Click "Submit Shill"

5. **Watch Your Earnings Grow**
   - View engagement metrics (likes, retweets, views)
   - See your SOL earnings increase
   - Level up your Ape rank!

---

## 🔧 Testing the Application

### Test Backend Health
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test Frontend
1. Open http://localhost:5173
2. Click "Connect Wallet"
3. If Phantom isn't installed, you'll see a prompt to install it
4. Once connected, you should see your wallet address and rank

### Test Database Connection
```bash
cd backend
npx prisma studio
```
This opens Prisma Studio at http://localhost:5555 to view your database.

---

## 🎯 Common Tasks

### Add a New Job
```bash
# Access PostgreSQL
psql postgresql://apeployee:apeployee_secure_password@localhost:5432/apeployed

# Insert job
INSERT INTO "Job" (id, title, description, role, "basePay", "bonusPay", "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Elite Bag Worker',
  'Top-tier shilling for premium bags. Must have 1000+ verified shills.',
  'BAG_WORKER',
  0.5,
  0.2,
  true,
  NOW(),
  NOW()
);
```

### Create a Bounty
```sql
INSERT INTO "Bounty" (id, title, description, reward, "targetMetric", "currentProgress", "targetValue", "isActive", "createdAt")
VALUES (
  gen_random_uuid(),
  'Viral Shill Mission',
  'Create a tweet with 500+ retweets about $APEPLOY',
  1.0,
  'retweets',
  0,
  500,
  true,
  NOW()
);
```

### View All Users
```sql
SELECT "walletAddress", "twitterUsername", "apeRank", "totalEarnings", "totalShillCount"
FROM "User"
ORDER BY "totalEarnings" DESC;
```

---

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check if PostgreSQL is running: `docker ps` or `ps aux | grep postgres`
- Verify DATABASE_URL in `.env` file
- Check if port 5432 is available

### "Wallet connection failed"
- Ensure Phantom wallet is installed
- Check browser console for errors (F12)
- Try refreshing the page

### "Backend not responding"
- Check if backend is running: `curl http://localhost:3001/health`
- Check backend logs for errors
- Verify PORT is set correctly in `.env`

### "Frontend build failed"
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version: `node --version` (should be 18+)

---

## 📚 Next Steps

1. **Read the Full Documentation**
   - [README.md](README.md) - Complete feature list and architecture
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment guide
   - [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Code organization

2. **Configure Production Environment**
   - Set up Railway deployment
   - Configure X API access
   - Set up Pump.fun integration
   - Deploy smart contract

3. **Customize the Platform**
   - Modify job roles and pay rates
   - Adjust earning multipliers
   - Add custom bounties
   - Customize the UI theme

4. **Launch and Grow**
   - Onboard first users
   - Create initial jobs and bounties
   - Monitor engagement metrics
   - Iterate based on feedback

---

## 🆘 Getting Help

- **Documentation**: Check [README.md](README.md) for detailed info
- **Issues**: Open a GitHub issue for bugs
- **Discord**: Join our community server
- **Email**: support@apeployed.com

---

**Ready to earn? Connect your wallet and start shilling! 🦍💰**
