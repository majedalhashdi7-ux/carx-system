# 🚀 Deployment Checklist - Car Auction System

## ✅ Pre-Deployment Checks

### Security
- [ ] All passwords changed from defaults
- [ ] NEXTAUTH_SECRET is unique random string (64+ chars)
- [ ] SESSION_SECRET is unique random string (64+ chars)
- [ ] JWT_SECRET is unique random string (64+ chars)
- [ ] Admin password is strong (20+ chars, mixed case, numbers, symbols)
- [ ] MongoDB passwords are strong and unique
- [ ] `.env` files are in `.gitignore`
- [ ] No secrets committed to Git
- [ ] MongoDB Atlas IP whitelist configured for production

### Database
- [ ] MongoDB Atlas cluster is running
- [ ] Database users created with proper permissions
- [ ] Connection strings tested and working
- [ ] Database indexes created (run `npm run optimize:db`)
- [ ] Backup strategy in place

### Environment Variables
- [ ] All required env vars set in Vercel/Server
- [ ] MONGO_URI is correct and accessible
- [ ] MONGO_URI_CARX is correct and accessible
- [ ] All secrets are unique per environment
- [ ] NODE_ENV=production is set

### API & Services
- [ ] Cloudinary account setup (for image uploads)
- [ ] Email service configured (for notifications)
- [ ] Redis configured (optional, for performance)
- [ ] Sentry configured (optional, for error tracking)

---

## 📦 Backend Deployment (Vercel Serverless)

### 1. Update Vercel Environment Variables
```bash
# In Vercel Dashboard > Project Settings > Environment Variables
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/db
MONGO_URI_CARX=mongodb+srv://user:password@cluster.mongodb.net/carx
NEXTAUTH_SECRET=<random-64-char-string>
SESSION_SECRET=<random-64-char-string>
JWT_SECRET=<random-64-char-string>
NODE_ENV=production
```

### 2. Deploy Backend
```bash
# From project root
vercel --prod
```

### 3. Verify Deployment
```bash
# Test health endpoint
curl https://daood.okigo.net/api/v2/health

# Expected response:
# {"status":"ok","timestamp":"...","engine":"HM-CAR-V2"}
```

### 4. Check Logs
```bash
vercel logs <deployment-url>
```

---

## 🎨 Frontend Deployment (HM CAR Client)

### 1. Update Environment Variables
```bash
# In Vercel Dashboard > client-app > Environment Variables
NEXT_PUBLIC_API_URL=https://daood.okigo.net/api
NEXTAUTH_SECRET=<unique-random-string>
MONGO_URI=mongodb://127.0.0.1:27017/hmcar_local  # For local dev only
```

### 2. Build & Deploy
```bash
cd client-app
npm install
npm run build
vercel --prod
```

### 3. Verify Deployment
```bash
# Test frontend
curl https://daood.okigo.net

# Test health endpoint
curl https://daood.okigo.net/api/health
```

---

## 🚗 CAR X System Deployment

### 1. Update Environment Variables
```bash
# In Vercel Dashboard > carx-system > Environment Variables
NEXT_PUBLIC_API_URL=https://daood.okigo.net/api
NEXTAUTH_SECRET=<unique-random-string>
MONGO_URI=mongodb://127.0.0.1:27017/carx_local  # For local dev only
```

### 2. Build & Deploy
```bash
cd carx-system
npm install
npm run build
vercel --prod
```

### 3. Verify Deployment
```bash
# Test CAR X health
curl https://daood.okigo.net/carx/api/health
```

---

## 🔍 Post-Deployment Testing

### API Tests
```bash
# Health check
curl https://daood.okigo.net/api/v2/health

# Test authentication
curl -X POST https://daood.okigo.net/api/v2/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test@123456"}'

# Test public endpoints
curl https://daood.okigo.net/api/v2/cars
curl https://daood.okigo.net/api/v2/brands
```

### Frontend Tests
- [ ] Homepage loads correctly
- [ ] Navigation works
- [ ] Images load
- [ ] Forms submit
- [ ] Login/Registration works
- [ ] Admin panel accessible
- [ ] Mobile responsive
- [ ] PWA installable

### Performance Tests
```bash
# Lighthouse score
# Target: Performance > 90, Accessibility > 90, Best Practices > 90, SEO > 90

# Load testing (optional)
npm install -g artillery
artillery quick --count 100 --num 10 https://daood.okigo.net/api/v2/health
```

---

## 📊 Monitoring Setup

### 1. Vercel Analytics
- Enable Vercel Analytics in dashboard
- Set up custom domains
- Configure alerts

### 2. Error Tracking (Sentry)
```bash
# Add to .env
SENTRY_DSN=https://<key>@sentry.io/<project>
```

### 3. Database Monitoring
- MongoDB Atlas monitoring enabled
- Set up alerts for:
  - High CPU usage
  - High memory usage
  - Connection pool exhaustion
  - Slow queries

### 4. Uptime Monitoring
- Setup UptimeRobot or similar
- Monitor:
  - https://daood.okigo.net
  - https://daood.okigo.net/api/v2/health
  - https://daood.okigo.net/api/health

---

## 🔄 Maintenance Tasks

### Daily
- [ ] Check error logs
- [ ] Monitor database connections
- [ ] Review failed API requests

### Weekly
- [ ] Review performance metrics
- [ ] Check disk space
- [ ] Update dependencies (test in staging first)

### Monthly
- [ ] Rotate passwords
- [ ] Review access logs
- [ ] Database backup verification
- [ ] Security audit

### Quarterly
- [ ] Full security review
- [ ] Performance optimization
- [ ] Dependency updates
- [ ] Disaster recovery test

---

## 🚨 Rollback Plan

### If Deployment Fails
```bash
# 1. Check what went wrong
vercel logs <deployment-url>

# 2. Rollback to previous deployment
vercel rollback

# 3. Or redeploy previous version
vercel deploy --target=production <previous-deployment-url>
```

### If Database Issues
```bash
# 1. Check connection
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGO_URI).then(() => console.log('OK')).catch(console.error);"

# 2. Restore from backup
mongorestore --uri="<MONGO_URI>" --gzip --archive=backup.gz
```

---

## 📞 Emergency Contacts

- **Developer**: dawoodalhash@gmail.com
- **WhatsApp**: +967781007805
- **Vercel Support**: https://vercel.com/support
- **MongoDB Atlas Support**: https://support.mongodb.com

---

## ✅ Final Checklist

- [ ] All tests passing
- [ ] No console errors in production
- [ ] All environment variables set
- [ ] Database backups working
- [ ] Monitoring configured
- [ ] Error tracking active
- [ ] SSL certificate valid
- [ ] Domain DNS configured
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Security headers set
- [ ] PWA working
- [ ] Mobile responsive
- [ ] Performance acceptable
- [ ] Documentation updated

---

**Last Updated**: 2026-04-17
**Version**: 2.0.0
