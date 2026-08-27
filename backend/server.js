const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL
} = require('@solana/web3.js');
const dotenv = require('dotenv');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const nacl = require('tweetnacl');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Initialize Solana connection
const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');

// Load vault wallet (from private key in env - should be encrypted in production)
let vaultWallet;
if (process.env.SOLANA_PRIVATE_KEY) {
  const privateKeyArray = JSON.parse(process.env.SOLANA_PRIVATE_KEY);
  vaultWallet = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
} else {
  console.warn('No vault wallet private key found. Running in simulation mode.');
  vaultWallet = null;
}

// ============================================
// AUTH MIDDLEWARE
// ============================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// ============================================
// AUTH ENDPOINTS
// ============================================

// Get nonce for signing
app.get('/api/auth/nonce', async (req, res) => {
  try {
    const { wallet } = req.query;

    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    // Generate random nonce
    const nonce = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 15);

    // Store nonce with expiration (5 minutes)
    await prisma.user.upsert({
      where: { walletAddress: wallet },
      update: { email: nonce },
      create: {
        walletAddress: wallet,
        email: nonce,
        apeRank: 'CHIMPANZEE',
        reputationScore: 0
      }
    });

    res.json({ nonce });
  } catch (error) {
    console.error('Nonce generation error:', error);
    res.status(500).json({ error: 'Failed to generate nonce' });
  }
});

// Verify signature and issue JWT
app.post('/api/auth/wallet', async (req, res) => {
  try {
    const { wallet, signature } = req.body;

    if (!wallet || !signature) {
      return res.status(400).json({ error: 'Wallet and signature required' });
    }

    // Get user to retrieve nonce
    const user = await prisma.user.findUnique({
      where: { walletAddress: wallet }
    });

    if (!user || !user.email) {
      return res.status(400).json({ error: 'No nonce found. Request a nonce first.' });
    }

    const nonce = user.email;

    // Verify signature
    const message = new TextEncoder().encode(nonce);
    const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    const publicKeyBytes = new PublicKey(wallet).toBytes();

    const isValid = nacl.sign.detached.verify(
      message,
      signatureBytes,
      publicKeyBytes
    );

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Clear nonce after verification
    await prisma.user.update({
      where: { walletAddress: wallet },
      data: { email: null }
    });

    // Issue JWT
    const token = jwt.sign(
      { userId: user.id, walletAddress: user.walletAddress },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token, user });
  } catch (error) {
    console.error('Wallet auth error:', error);
    res.status(500).json({ error: 'Failed to authenticate wallet' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// JOB ENDPOINTS
// ============================================

// Get all available jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ jobs });
  } catch (error) {
    console.error('Jobs fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Apply for a job (requires auth)
app.post('/api/jobs/:jobId/apply', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body;
    const userId = req.user.userId;

    // Check if already applied
    const existing = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Already applied for this job' });
    }

    const application = await prisma.jobApplication.create({
      data: {
        userId,
        jobId,
        coverLetter,
        status: 'PENDING'
      },
      include: {
        job: true
      }
    });

    res.json({ success: true, application });
  } catch (error) {
    console.error('Job application error:', error);
    res.status(500).json({ error: 'Failed to apply for job' });
  }
});

// Get user's applications (requires auth)
app.get('/api/users/:userId/applications', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user can only access their own applications
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const applications = await prisma.jobApplication.findMany({
      where: { userId },
      include: {
        job: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ applications });
  } catch (error) {
    console.error('Applications fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// ============================================
// SHILL TRACKING ENDPOINTS
// ============================================

// Submit shill (requires auth)
app.post('/api/shill/submit', authenticateToken, async (req, res) => {
  try {
    const { tweetId, tickerMention } = req.body;
    const userId = req.user.userId;

    if (!tweetId) {
      return res.status(400).json({ error: 'Tweet ID required' });
    }

    // TODO: Verify X account is linked
    // const user = await prisma.user.findUnique({ where: { id: userId } });
    // if (!user.twitterVerified) {
    //   return res.status(400).json({ error: 'X account must be linked first' });
    // }

    // TODO: Fetch tweet metrics from X API
    let metrics = { likes: 0, retweets: 0, replies: 0, views: 0 };

    if (process.env.TWITTER_BEARER_TOKEN) {
      try {
        const response = await axios.get(
          `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics,created_at`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
            }
          }
        );

        const publicMetrics = response.data.data.public_metrics;
        metrics = {
          likes: publicMetrics.like_count || 0,
          retweets: publicMetrics.retweet_count || 0,
          replies: publicMetrics.reply_count || 0,
          views: publicMetrics.impression_count || 0
        };
      } catch (twitterError) {
        console.warn('Failed to fetch tweet metrics:', twitterError.message);
      }
    }

    // Calculate earnings based on engagement
    const earnings = calculateShillEarnings(metrics);

    // Create shill record
    const shillRecord = await prisma.shillRecord.create({
      data: {
        userId,
        tweetId,
        tweetContent: '',
        tickerMention,
        ...metrics,
        earnings
      }
    });

    // Update user stats
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalShillCount: { increment: 1 },
        totalEarnings: { increment: earnings },
        reputationScore: { increment: calculateReputationBoost(metrics) }
      }
    });

    // Check for rank upgrade
    await checkAndUpgradeApeRank(userId);

    res.json({ success: true, shillRecord, metrics, earnings });
  } catch (error) {
    console.error('Shill submission error:', error);
    res.status(500).json({ error: 'Failed to submit shill' });
  }
});

// Get user's shills (requires auth)
app.get('/api/users/:userId/shills', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verify user can only access their own shills
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const shills = await prisma.shillRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.shillRecord.count({ where: { userId } });

    res.json({ shills, total, hasMore: total > parseInt(offset) + parseInt(limit) });
  } catch (error) {
    console.error('Shills fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch shills' });
  }
});

// ============================================
// BOUNTY SYSTEM ENDPOINTS
// ============================================

// Get active bounties
app.get('/api/bounties', async (req, res) => {
  try {
    const bounties = await prisma.bounty.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        job: true,
        _count: {
          select: { submissions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ bounties });
  } catch (error) {
    console.error('Bounties fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch bounties' });
  }
});

// Submit bounty (requires auth)
app.post('/api/bounties/:bountyId/submit', authenticateToken, async (req, res) => {
  try {
    const { bountyId } = req.params;
    const { proofUrl } = req.body;
    const userId = req.user.userId;

    const submission = await prisma.bountySubmission.create({
      data: {
        bountyId,
        userId,
        proofUrl,
        status: 'PENDING'
      },
      include: {
        bounty: true
      }
    });

    res.json({ success: true, submission });
  } catch (error) {
    console.error('Bounty submission error:', error);
    res.status(500).json({ error: 'Failed to submit bounty' });
  }
});

// ============================================
// PAYMENT ENDPOINTS
// ============================================

// Get user's payment history (requires auth)
app.get('/api/users/:userId/payments', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user can only access their own payments
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    res.json({ payments });
  } catch (error) {
    console.error('Payments fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Request payout (requires auth)
app.post('/api/payments/request', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.totalEarnings < amount) {
      return res.status(400).json({ error: 'Insufficient earnings' });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        currency: 'SOL',
        type: 'SHILL_EARNINGS',
        status: 'PENDING'
      }
    });

    // Process payment on-chain (if vault wallet available)
    if (vaultWallet) {
      try {
        const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: vaultWallet.publicKey,
            toPubkey: new PublicKey(user.walletAddress),
            lamports
          })
        );

        const signature = await sendAndConfirmTransaction(connection, transaction, [vaultWallet]);

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            transactionHash: signature,
            processedAt: new Date()
          }
        });

        // Update user earnings
        await prisma.user.update({
          where: { id: userId },
          data: { totalEarnings: { decrement: amount } }
        });

        // Record vault transaction
        await prisma.vaultTransaction.create({
          data: {
            userId,
            type: 'EARNING_PAYOUT',
            amount,
            description: `Payout request: ${signature}`,
            transactionHash: signature
          }
        });

        return res.json({ success: true, payment, transactionHash: signature });
      } catch (solanaError) {
        console.error('Solana payment error:', solanaError);
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' }
        });
        return res.status(500).json({ error: 'Payment failed on-chain' });
      }
    } else {
      // Simulation mode
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SIMULATED',
          transactionHash: 'simulated-' + Date.now(),
          processedAt: new Date()
        }
      });

      return res.json({ success: true, payment, simulated: true });
    }
  } catch (error) {
    console.error('Payout request error:', error);
    res.status(500).json({ error: 'Failed to request payout' });
  }
});

// ============================================
// LEADERBOARD ENDPOINTS
// ============================================

// Get top shillers (leaderboard)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { limit = 10, period = 'all' } = req.query;

    let dateFilter = {};
    if (period === 'week') {
      dateFilter = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (period === 'month') {
      dateFilter = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

    const leaderboard = await prisma.user.findMany({
      where: {
        shillRecords: dateFilter ? { some: { createdAt: dateFilter } } : undefined
      },
      orderBy: { totalEarnings: 'desc' },
      take: parseInt(limit),
      select: {
        id: true,
        walletAddress: true,
        twitterUsername: true,
        apeRank: true,
        totalEarnings: true,
        totalShillCount: true,
        reputationScore: true
      }
    });

    res.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ============================================
// REFERRAL ENDPOINTS
// ============================================

// Create referral (requires auth)
app.post('/api/referrals', authenticateToken, async (req, res) => {
  try {
    const { refereeId } = req.body;
    const referrerId = req.user.userId;

    // Check if referee already has a referrer
    const existing = await prisma.referral.findUnique({
      where: { refereeId }
    });

    if (existing) {
      return res.status(400).json({ error: 'User already referred' });
    }

    const referral = await prisma.referral.create({
      data: {
        referrerId,
        refereeId,
        bonusAmount: 0,
        bonusPaid: false
      },
      include: {
        referrer: { select: { walletAddress: true, twitterUsername: true } },
        referee: { select: { walletAddress: true, twitterUsername: true } }
      }
    });

    res.json({ success: true, referral });
  } catch (error) {
    console.error('Referral creation error:', error);
    res.status(500).json({ error: 'Failed to create referral' });
  }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Calculate shill earnings based on engagement
function calculateShillEarnings(metrics) {
  const likeEarnings = metrics.likes * 0.00001;
  const retweetEarnings = metrics.retweets * 0.00002;
  const viewEarnings = metrics.views * 0.0000001;
  return likeEarnings + retweetEarnings + viewEarnings;
}

// Calculate reputation boost from a shill
function calculateReputationBoost(metrics) {
  return metrics.likes + (metrics.retweets * 2) + (metrics.replies * 1.5);
}

// Check and upgrade ape rank based on shill count
async function checkAndUpgradeApeRank(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) return;

  let newRank = user.apeRank;

  if (user.totalShillCount >= 5000) {
    newRank = 'SILVERBACK';
  } else if (user.totalShillCount >= 1000) {
    newRank = 'GORILLA';
  } else if (user.totalShillCount >= 500) {
    newRank = 'ORANGUTAN';
  } else if (user.totalShillCount >= 100) {
    newRank = 'BABOON';
  }

  if (newRank !== user.apeRank) {
    await prisma.user.update({
      where: { id: userId },
      data: { apeRank: newRank }
    });
    console.log(`User ${userId} upgraded to ${newRank}`);
  }
}

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`🦍 Apeployee API server running on port ${PORT}`);
  console.log(`🔗 Vault wallet: ${vaultWallet ? vaultWallet.publicKey.toString() : 'Simulation mode'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
