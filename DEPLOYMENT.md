# Apeployee - Deployment Guide

## 🚀 Railway Deployment

### Prerequisites
- Railway account
- GitHub repository with Apeployed code
- PostgreSQL database on Railway
- Environment variables configured

### Step 1: Deploy Database
1. Go to Railway Dashboard
2. Create New Project → Add Service → PostgreSQL
3. Copy the DATABASE_URL from service settings

### Step 2: Deploy Backend
1. In your Railway project, Add New Service
2. Connect your GitHub repository
3. Select `backend/` directory as root
4. Configure environment variables:
   ```
   DATABASE_URL=<from PostgreSQL service>
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   SOLANA_PRIVATE_KEY=<your_vault_private_key_array>
   PUMPFUN_API_KEY=<your_pumpfun_key>
   TWITTER_API_KEY=<your_twitter_key>
   TWITTER_API_SECRET=<your_twitter_secret>
   TWITTER_BEARER_TOKEN=<your_twitter_bearer>
   JWT_SECRET=<random_secure_string>
   PORT=3001
   FRONTEND_URL=<your_frontend_url>
   ```
5. Deploy!

### Step 3: Deploy Frontend
1. Add New Service → Connect GitHub repo
2. Select `frontend/` directory as root
3. Configure environment variables:
   ```
   VITE_API_URL=<your_backend_railway_url>
   VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   ```
4. Deploy!

### Step 4: Set Up Custom Domains (Optional)
1. Go to each service → Settings → Domains
2. Add your custom domain (e.g., api.apeployed.com, apeployed.com)
3. Configure DNS records as shown

### Step 5: Run Database Migrations
```bash
# Access Railway backend service console
railway shell

# Run migrations
npx prisma migrate deploy
npx prisma generate
```

## 🔧 Environment Variables Reference

### Backend
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SOLANA_RPC_URL` | ✅ | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` |
| `SOLANA_PRIVATE_KEY` | ✅ | Vault wallet key (JSON array) | `[1,2,3,...]` |
| `PUMPFUN_API_KEY` | ⚠️ | Pump.fun API key | `abc123...` |
| `TWITTER_API_KEY` | ⚠️ | X API key | `xyz789...` |
| `TWITTER_API_SECRET` | ⚠️ | X API secret | `secret456...` |
| `TWITTER_BEARER_TOKEN` | ⚠️ | X bearer token | `bearer789...` |
| `JWT_SECRET` | ✅ | JWT signing secret | `random-secret-string` |
| `PORT` | ❌ | Server port (default: 3001) | `3001` |
| `FRONTEND_URL` | ✅ | Frontend URL for CORS | `https://apeployed.com` |

### Frontend
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | ✅ | Backend API URL | `https://api.apeployed.com` |
| `VITE_SOLANA_RPC_URL` | ❌ | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` |

## 🔐 Security Checklist

- [ ] Change default database password
- [ ] Use strong JWT secret (32+ random characters)
- [ ] Store vault private key securely (use Railway environment variables, not git)
- [ ] Enable Railway's private networking between backend and database
- [ ] Set up domain and SSL certificates
- [ ] Configure rate limiting on API endpoints
- [ ] Enable audit logging
- [ ] Set up monitoring and alerts

## 📊 Monitoring

### Railway Built-in Metrics
- CPU usage
- Memory usage
- Network traffic
- Response times

### Recommended External Monitoring
- **Uptime** → UptimeRobot, Pingdom
- **Error Tracking** → Sentry
- **Analytics** → Vercel Analytics, Plausible
- **Logs** → Logtail, Datadog

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: railwayapp/cli-action@v1.3.0
        with:
          service-id: ${{ secrets.RAILWAY_BACKEND_SERVICE_ID }}
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          command: "up"

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: railwayapp/cli-action@v1.3.0
        with:
          service-id: ${{ secrets.RAILWAY_FRONTEND_SERVICE_ID }}
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          command: "up"
```

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check logs
railway logs

# Access shell
railway shell

# Test database connection
npx prisma db pull

# Check environment variables
echo $DATABASE_URL
```

### Frontend Can't Connect to Backend
- Check CORS settings in `server.js`
- Verify `FRONTEND_URL` matches actual frontend URL
- Ensure backend is running and accessible

### Database Connection Errors
- Verify DATABASE_URL is correct
- Check PostgreSQL service is running
- Ensure database exists: `npx prisma db push`

### Wallet Connection Issues
- Ensure Phantom wallet is installed
- Check browser console for errors
- Verify wallet is on correct network (mainnet/devnet)

## 📈 Scaling

### Horizontal Scaling (Backend)
1. Go to Railway backend service
2. Settings → Scaling
3. Adjust instance count based on load

### Database Scaling
1. Upgrade PostgreSQL plan
2. Enable connection pooling
3. Add read replicas for reads

### CDN for Frontend
1. Deploy frontend to Vercel/Netlify
2. Configure CDN edge locations
3. Enable caching for static assets

## 💰 Cost Optimization

- **Database**: Use smaller plan initially, scale as needed
- **Backend**: Enable auto-suspend during low traffic
- **Frontend**: Deploy to Vercel (free tier available)
- **Monitoring**: Use free tiers of monitoring services

## 🔗 Useful Links

- Railway Docs: https://docs.railway.app
- Prisma Deployment: https://www.prisma.io/docs/guides/deployment
- Solana RPC Endpoints: https://solana.com/rpc
- X API Docs: https://developer.twitter.com

---

**Need help?** Join our Discord or open a GitHub issue.
