import { useState } from 'react'
import { Wallet, Briefcase, TrendingUp, DollarSign, Award, Users } from 'lucide-react'
import './index.css'

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Ape Rank configuration
const APE_RANKS = {
  CHIMPANZEE: { name: 'Chimpanzee', color: 'bg-ape-brown-400', emoji: '🐒', threshold: 0, multiplier: 1.0 },
  BABOON: { name: 'Baboon', color: 'bg-ape-brown-500', emoji: '🦍', threshold: 100, multiplier: 1.2 },
  ORANGUTAN: { name: 'Orangutan', color: 'bg-ape-brown-600', emoji: '🦧', threshold: 500, multiplier: 1.5 },
  GORILLA: { name: 'Gorilla', color: 'bg-ape-brown-700', emoji: '🦍', threshold: 1000, multiplier: 2.0 },
  SILVERBACK: { name: 'Silverback', color: 'bg-ape-brown-800', emoji: '👑', threshold: 5000, multiplier: 3.0 }
}

function App() {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [jobs, setJobs] = useState([])
  const [bounties, setBounties] = useState([])
  const [shills, setShills] = useState([])
  const [leaderboard, setLeaderboard] = useState([])

  // Connect wallet and authenticate
  const connectWallet = async () => {
    try {
      if (!window.solana?.isPhantom) {
        alert('Please install Phantom wallet to continue')
        window.open('https://phantom.app/', '_blank')
        return
      }

      const { solana } = window
      const response = await solana.connect()
      const publicKey = response.publicKey.toString()

      // Get nonce
      const nonceRes = await fetch(`${API_URL}/api/auth/nonce?wallet=${publicKey}`)
      const { nonce } = await nonceRes.json()

      // Sign nonce
      const encodedMessage = new TextEncoder().encode(`Sign this message to authenticate with Apeployee:\n\n${nonce}`)
      const signature = await solana.signMessage(encodedMessage, 'utf8')

      // Verify and get token
      const authRes = await fetch(`${API_URL}/api/auth/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey,
          signature: signature.signature
        })
      })

      const authData = await authRes.json()
      if (authData.success) {
        setToken(authData.token)
        setUser(authData.user)
        loadData(authData.user.id)
      }
    } catch (error) {
      console.error('Wallet connection error:', error)
      alert('Failed to connect wallet')
    }
  }

  // Load data for the user
  const loadData = async (userId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` }

      // Load jobs
      const jobsRes = await fetch(`${API_URL}/api/jobs`, { headers })
      const jobsData = await jobsRes.json()
      setJobs(jobsData.jobs)

      // Load bounties
      const bountiesRes = await fetch(`${API_URL}/api/bounties`, { headers })
      const bountiesData = await bountiesRes.json()
      setBounties(bountiesData.bounties)

      // Load user's shills
      const shillsRes = await fetch(`${API_URL}/api/users/${userId}/shills`, { headers })
      const shillsData = await shillsRes.json()
      setShills(shillsData.shills)

      // Load leaderboard
      const leaderboardRes = await fetch(`${API_URL}/api/leaderboard?limit=10`, { headers })
      const leaderboardData = await leaderboardRes.json()
      setLeaderboard(leaderboardData.leaderboard)
    } catch (error) {
      console.error('Data loading error:', error)
    }
  }

  // Connect Twitter account
  const connectTwitter = async () => {
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/api/auth/twitter/start`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Twitter connection error:', error)
      alert('Failed to start Twitter OAuth')
    }
  }

  // Apply for a job
  const applyForJob = async (jobId, coverLetter = '') => {
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ coverLetter })
      })

      const data = await res.json()
      if (data.success) {
        alert('Application submitted successfully!')
        loadData(user.id)
      } else {
        alert('Failed to apply for job')
      }
    } catch (error) {
      console.error('Job application error:', error)
      alert('Failed to apply for job')
    }
  }

  // Submit shill
  const submitShill = async (tweetUrl) => {
    if (!token) return

    try {
      const tweetId = tweetUrl.match(/status\/(\d+)/)?.[1]
      if (!tweetId) {
        alert('Invalid tweet URL')
        return
      }

      const res = await fetch(`${API_URL}/api/shill/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tweetId
        })
      })

      const data = await res.json()
      if (data.success) {
        alert(`Shill submitted! You earned ${data.earnings.toFixed(8)} SOL`)
        loadData(user.id)
      } else {
        alert(data.error || 'Failed to submit shill')
      }
    } catch (error) {
      console.error('Shill submission error:', error)
      alert('Failed to submit shill')
    }
  }

  // Request payout
  const requestPayout = async (amount) => {
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/api/payments/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      })

      const data = await res.json()
      if (data.success) {
        alert(`Payout of ${amount} SOL ${data.simulated ? '(simulated)' : ''} processed!`)
        loadData(user.id)
      } else {
        alert('Failed to request payout')
      }
    } catch (error) {
      console.error('Payout error:', error)
      alert('Failed to request payout')
    }
  }

  // Get current rank info
  const getCurrentRank = () => {
    if (!user) return APE_RANKS.CHIMPANZEE
    return APE_RANKS[user.apeRank] || APE_RANKS.CHIMPANZEE
  }

  const currentRank = getCurrentRank()

  if (!token) {
    return (
      <div className="min-h-screen jungle-pattern flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="ape-card text-center">
            <div className="text-8xl mb-6 float-animation">🦍</div>
            <h1 className="text-5xl font-bold mb-4 text-ape-brown-800">APEPLOYEE</h1>
            <p className="text-xl text-ape-brown-600 mb-8">
              The First Memecoin Where You Get PAID to Shill Your Bags
            </p>

            <div className="bg-ape-brown-50 rounded-xl p-6 mb-8 border border-ape-brown-200">
              <h2 className="text-2xl font-bold mb-4 text-ape-brown-700">How It Works</h2>
              <div className="grid md:grid-cols-3 gap-4 text-left">
                <div className="flex flex-col items-center text-center">
                  <div className="text-4xl mb-2">1️⃣</div>
                  <h3 className="font-bold mb-2">Apply for a Job</h3>
                  <p className="text-sm text-ape-brown-600">Become a Bag Worker, Meme Maker, or Shill Captain</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="text-4xl mb-2">2️⃣</div>
                  <h3 className="font-bold mb-2">Get Hired</h3>
                  <p className="text-sm text-ape-brown-600">Once approved, you're officially APELOYED</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="text-4xl mb-2">3️⃣</div>
                  <h3 className="font-bold mb-2">Earn While Shilling</h3>
                  <p className="text-sm text-ape-brown-600">Get paid in SOL for every engagement you generate</p>
                </div>
              </div>
            </div>

            <button
              onClick={connectWallet}
              className="ape-button ape-button-primary text-lg w-full md:w-auto px-12 py-4"
            >
              <Wallet className="inline mr-2" size={24} />
              Connect Wallet to Get Started
            </button>

            <div className="mt-8 flex justify-center gap-4 flex-wrap">
              <div className="ape-badge-rank px-4 py-2">🐒 Chimpanzee: 1x</div>
              <div className="ape-badge-rank px-4 py-2">🦍 Baboon: 1.2x</div>
              <div className="ape-badge-rank px-4 py-2">🦧 Orangutan: 1.5x</div>
              <div className="ape-badge-rank px-4 py-2">🦍 Gorilla: 2x</div>
              <div className="ape-badge-rank px-4 py-2">👑 Silverback: 3x</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen jungle-pattern">
      {/* Header */}
      <header className="bg-ape-brown-800 text-white py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🦍</span>
            <h1 className="text-2xl font-bold">APEPLOYEE</h1>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <>
                {!user.twitterVerified && (
                  <button
                    onClick={connectTwitter}
                    className="text-sm bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-bold transition-all"
                  >
                    🔗 Connect X
                  </button>
                )}
                {user.twitterVerified && (
                  <div className="flex items-center gap-2 text-sm bg-blue-500/20 px-4 py-2 rounded-lg">
                    <span>✅</span>
                    <span>{user.twitterUsername}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className={`${currentRank.color} px-3 py-1 rounded-full text-sm font-bold`}>
                    {currentRank.emoji} {currentRank.name}
                  </span>
                  <span className="text-jungle-green-400 font-bold">
                    {user.totalEarnings.toFixed(4)} SOL
                  </span>
                </div>
              </>
            )}
            <div className="text-sm bg-ape-brown-700 px-4 py-2 rounded-lg">
              {user?.walletAddress.slice(0, 4)}...{user?.walletAddress.slice(-4)}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-ape-brown-100 border-b border-ape-brown-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 overflow-x-auto py-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-jungle-green-500 text-white'
                  : 'text-ape-brown-700 hover:bg-ape-brown-200'
              }`}
            >
              <TrendingUp className="inline mr-2" size={18} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'jobs'
                  ? 'bg-jungle-green-500 text-white'
                  : 'text-ape-brown-700 hover:bg-ape-brown-200'
              }`}
            >
              <Briefcase className="inline mr-2" size={18} />
              Jobs
            </button>
            <button
              onClick={() => setActiveTab('shills')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'shills'
                  ? 'bg-jungle-green-500 text-white'
                  : 'text-ape-brown-700 hover:bg-ape-brown-200'
              }`}
            >
              <DollarSign className="inline mr-2" size={18} />
              My Shills
            </button>
            <button
              onClick={() => setActiveTab('bounties')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'bounties'
                  ? 'bg-jungle-green-500 text-white'
                  : 'text-ape-brown-700 hover:bg-ape-brown-200'
              }`}
            >
              <Award className="inline mr-2" size={18} />
              Bounties
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-jungle-green-500 text-white'
                  : 'text-ape-brown-700 hover:bg-ape-brown-200'
              }`}
            >
              <Users className="inline mr-2" size={18} />
              Leaderboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && <Dashboard user={user} shills={shills} onRequestPayout={requestPayout} />}
        {activeTab === 'jobs' && <JobsSection jobs={jobs} onApply={applyForJob} />}
        {activeTab === 'shills' && <ShillsSection shills={shills} onSubmitShill={submitShill} />}
        {activeTab === 'bounties' && <BountiesSection bounties={bounties} />}
        {activeTab === 'leaderboard' && <LeaderboardSection leaderboard={leaderboard} />}
      </main>
    </div>
  )
}

// Dashboard Component
function Dashboard({ user, shills, onRequestPayout }) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-ape-brown-800">Your Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="ape-card bg-gradient-to-br from-jungle-green-500 to-jungle-green-600 text-white">
          <div className="text-4xl mb-2">💰</div>
          <div className="text-2xl font-bold">{user?.totalEarnings.toFixed(4)} SOL</div>
          <div className="text-sm opacity-90">Total Earnings</div>
        </div>
        <div className="ape-card">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-2xl font-bold text-ape-brown-800">{user?.totalShillCount}</div>
          <div className="text-sm text-ape-brown-600">Total Shills</div>
        </div>
        <div className="ape-card">
          <div className="text-4xl mb-2">⭐</div>
          <div className="text-2xl font-bold text-ape-brown-800">{user?.reputationScore.toFixed(0)}</div>
          <div className="text-sm text-ape-brown-600">Reputation Score</div>
        </div>
        <div className="ape-card">
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-2xl font-bold text-ape-brown-800">{user?.apeRank}</div>
          <div className="text-sm text-ape-brown-600">Current Rank</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="ape-card">
        <h3 className="text-xl font-bold mb-4 text-ape-brown-800">Quick Actions</h3>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => onRequestPayout(user?.totalEarnings)}
            disabled={!user || user.totalEarnings < 0.001}
            className="ape-button ape-button-primary"
          >
            <DollarSign className="inline mr-2" size={18} />
            Request Payout
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="ape-card">
        <h3 className="text-xl font-bold mb-4 text-ape-brown-800">Recent Shills</h3>
        {shills.length === 0 ? (
          <p className="text-ape-brown-600">No shills yet. Start earning!</p>
        ) : (
          <div className="space-y-3">
            {shills.slice(0, 5).map((shill) => (
              <div key={shill.id} className="flex items-center justify-between p-3 bg-ape-brown-50 rounded-lg">
                <div>
                  <div className="font-medium text-ape-brown-800">{shill.tickerMention || 'Unknown'}</div>
                  <div className="text-sm text-ape-brown-600">
                    {shill.likes} likes • {shill.retweets} retweets • {shill.views} views
                  </div>
                </div>
                <div className="text-jungle-green-600 font-bold">
                  +{shill.earnings.toFixed(6)} SOL
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Jobs Section Component
function JobsSection({ jobs, onApply }) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-ape-brown-800">Available Jobs</h2>

      <div className="grid gap-4">
        {jobs.map((job) => (
          <div key={job.id} className="ape-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-ape-brown-800 mb-2">{job.title}</h3>
                <p className="text-ape-brown-600 mb-3">{job.description}</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="ape-badge-rank">{job.role}</span>
                  <span className="ape-badge bg-jungle-green-100 text-jungle-green-800 border border-jungle-green-200">
                    {job.basePay} SOL
                  </span>
                </div>
              </div>
              <button
                onClick={() => onApply(job.id)}
                className="ape-button ape-button-primary"
              >
                Apply Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Shills Section Component
function ShillsSection({ shills, onSubmitShill }) {
  const [tweetUrl, setTweetUrl] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!tweetUrl) {
      alert('Please provide tweet URL')
      return
    }
    onSubmitShill(tweetUrl)
    setTweetUrl('')
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-ape-brown-800">Submit Your Shills</h2>

      {/* Submit Form */}
      <div className="ape-card">
        <h3 className="text-xl font-bold mb-4 text-ape-brown-800">Submit a Tweet</h3>
        <p className="text-sm text-ape-brown-600 mb-4">
          Your tweet must mention <strong>$APEPLOY</strong> and be from your linked X account.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ape-brown-700 mb-2">
              Tweet URL
            </label>
            <input
              type="text"
              value={tweetUrl}
              onChange={(e) => setTweetUrl(e.target.value)}
              placeholder="https://x.com/username/status/1234567890"
              className="ape-input"
            />
          </div>
          <button type="submit" className="ape-button ape-button-primary">
            <DollarSign className="inline mr-2" size={18} />
            Submit for Earnings
          </button>
        </form>
      </div>

      {/* Shill History */}
      <div className="ape-card">
        <h3 className="text-xl font-bold mb-4 text-ape-brown-800">Your Shill History</h3>
        {shills.length === 0 ? (
          <p className="text-ape-brown-600">No shills submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {shills.map((shill) => (
              <div key={shill.id} className="p-4 bg-ape-brown-50 rounded-lg border border-ape-brown-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold text-ape-brown-800">{shill.tickerMention}</span>
                    <span className="text-sm text-ape-brown-600 ml-2">
                      {new Date(shill.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-jungle-green-600 font-bold">
                    +{shill.earnings.toFixed(6)} SOL
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-ape-brown-600">
                  <span>❤️ {shill.likes}</span>
                  <span>🔄 {shill.retweets}</span>
                  <span>💬 {shill.replies}</span>
                  <span>👁️ {shill.views}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Bounties Section Component
function BountiesSection({ bounties }) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-ape-brown-800">Active Bounties</h2>

      <div className="grid gap-4">
        {bounties.length === 0 ? (
          <p className="text-ape-brown-600">No active bounties at the moment.</p>
        ) : (
          bounties.map((bounty) => (
            <div key={bounty.id} className="ape-card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-ape-brown-800 mb-2">{bounty.title}</h3>
                  <p className="text-ape-brown-600 mb-3">{bounty.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="ape-badge bg-banana-yellow-100 text-banana-yellow-800 border border-banana-yellow-200">
                      {bounty.reward} SOL
                    </span>
                    <span className="ape-badge-rank">
                      {bounty.currentProgress}/{bounty.targetValue}
                    </span>
                  </div>
                </div>
                <button className="ape-button ape-button-accent">
                  <Award className="inline mr-2" size={18} />
                  Claim Bounty
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Leaderboard Section Component
function LeaderboardSection({ leaderboard }) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-ape-brown-800">Top Shillers</h2>

      <div className="ape-card">
        {leaderboard.map((user, index) => (
          <div
            key={user.id}
            className={`flex items-center justify-between p-4 ${
              index < leaderboard.length - 1 ? 'border-b border-ape-brown-200' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-ape-brown-800 w-8">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
              </div>
              <div>
                <div className="font-bold text-ape-brown-800">
                  {user.twitterUsername || user.walletAddress.slice(0, 8)}
                </div>
                <div className="text-sm text-ape-brown-600">{user.apeRank}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-jungle-green-600 font-bold">
                {user.totalEarnings.toFixed(4)} SOL
              </div>
              <div className="text-sm text-ape-brown-600">
                {user.totalShillCount} shills
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
