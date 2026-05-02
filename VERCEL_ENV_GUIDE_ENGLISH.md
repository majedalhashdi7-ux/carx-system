# Correct Environment Variables Guide for CAR X

## ✅ Correct Steps

### 1. Open Vercel Dashboard
- Go to: https://vercel.com/dashboard
- Select project `carx-system`

### 2. Go to Settings
- Click on **Settings** tab
- From sidebar select **Environment Variables**

### 3. Add these variables EXACTLY

⚠️ **IMPORTANT**: Pay attention to the exact names (with underscore)

```
NEXT_PUBLIC_API_URL = https://hmcar-system.vercel.app/api/v2
NEXT_PUBLIC_TENANT = carx
NEXT_PUBLIC_APP_NAME = CAR X
NEXT_PUBLIC_WHATSAPP = +967781007805
NODE_ENV = production
```

### 4. Verify Settings
- ✅ Environment: Select **Production**, **Preview**, and **Development**
- ✅ Click **Save** for each variable

### 5. Redeploy
- Go to **Deployments** tab
- Click on latest deployment
- Click three dots (⋯)
- Select **Redeploy**
- ✅ Optionally enable **Use existing Build Cache**

---

## ❌ Common Mistakes

### Mistake 1: Wrong variable name
```
❌ NEXT_PUBLIC_APIURL (wrong - no underscore)
✅ NEXT_PUBLIC_API_URL (correct - with underscore)
```

### Mistake 2: Forgetting to redeploy
- After adding variables, you MUST redeploy
- Variables don't apply automatically to current deployment

### Mistake 3: Wrong Environment selection
- Make sure to select **Production** at minimum
- Better to select all three (Production, Preview, Development)

---

## 🔍 Verify Success

After redeploying, check:

1. **Build Status**: Should be ✅ **Ready**
2. **Open site**: https://carx-system.vercel.app
3. **Check Backend connection**: Should work without 404 errors

---

## 📝 Important Notes

1. **Shared Backend**: CAR X and HM CAR use same Backend
   - Backend URL: `https://hmcar-system.vercel.app/api/v2`
   - Separation via `NEXT_PUBLIC_TENANT`

2. **Tenant**: 
   - HM CAR: `tenant=hmcar`
   - CAR X: `tenant=carx`

3. **No separate Backend needed**: Current system works efficiently with one Backend

---

## 🎯 Expected Result

After following steps:
- ✅ carx-system builds successfully
- ✅ Site works at https://carx-system.vercel.app
- ✅ Backend connection works without issues
- ✅ Data displays correctly

---

Updated: 2026-04-02
