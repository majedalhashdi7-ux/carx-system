# 🚀 Multi-Tenant Quick Start Guide

## Current System Status

✅ **5 Active Tenants**  
✅ **17 Registered Domains**  
✅ **Multi-Tenant System Working**  
⚠️ **Some files missing (logos/favicons)**

---

## Add New Client (5 Minutes)

### Method 1: Automated Script (Recommended)

```bash
node scripts/add-tenant.js
```

Follow the prompts:
- Tenant ID: `newclient`
- Name (Arabic): `معرض العميل الجديد`
- Name (English): `New Client Motors`
- Domain: `newclient.com`
- MongoDB URI: `mongodb+srv://...`
- WhatsApp: `+966501234567`
- Email: `info@newclient.com`
- Primary Color: `#3498db`

### Method 2: Manual Configuration

Edit `tenants/tenants.json`:

```json
{
  "newclient": {
    "id": "newclient",
    "name": "New Client Motors",
    "nameEn": "New Client Motors",
    "domains": ["newclient.com", "www.newclient.com"],
    "mongoUri": "mongodb+srv://...",
    "logo": "/uploads/tenants/newclient/logo.png",
    "favicon": "/uploads/tenants/newclient/favicon.ico",
    "theme": {
      "primaryColor": "#3498db",
      "secondaryColor": "#2980b9",
      "accentColor": "#e74c3c",
      "backgroundColor": "#ffffff",
      "textColor": "#2c3e50"
    },
    "contact": {
      "whatsapp": "+966501234567",
      "email": "info@newclient.com",
      "phone": "+966501234567"
    },
    "settings": {
      "currency": "SAR",
      "language": "ar",
      "direction": "rtl"
    },
    "enabled": true
  }
}
```

---

## Upload Files

```bash
# Create directory
mkdir -p uploads/tenants/newclient

# Upload files
uploads/tenants/newclient/logo.png      (400x120px)
uploads/tenants/newclient/favicon.ico   (32x32px)
```

---

## Connect Domain

### In Vercel Dashboard:
1. Go to Settings > Domains
2. Add domain: `newclient.com`
3. Follow instructions

### In Domain Provider:
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## Test

### Local Testing:
```bash
http://localhost:4002?tenant=newclient
```

### Production Testing:
```bash
https://newclient.com
```

### API Testing:
```bash
curl https://newclient.com/api/v2/tenant/info
```

---

## Check System

```bash
node scripts/check-system.js
```

Output:
```
✅ Active Tenants: 5
🌐 Total Domains: 17
🏠 Local Domains: 4
☁️  Vercel Domains: 3
🌍 Custom Domains: 10
```

---

## Current Clients

### 1. HM CAR (hmcar)
- Domain: hmcar.xyz
- Database: Shared with CAR X
- Color: Gold (#D4AF37)

### 2. CAR X (carx)
- Domain: carx-motors.com
- Database: Shared with HM CAR
- Color: Black (#000000)

### 3. Demo Showrooms (alwaha, luxury, stars)
- Status: Active but not in use
- Databases: Separate for each

---

## Ready Color Themes

### Professional Blue:
```json
{
  "primaryColor": "#3498db",
  "secondaryColor": "#2980b9",
  "accentColor": "#e74c3c"
}
```

### Natural Green:
```json
{
  "primaryColor": "#2ecc71",
  "secondaryColor": "#27ae60",
  "accentColor": "#3498db"
}
```

### Luxury Black & Gold:
```json
{
  "primaryColor": "#FFD700",
  "secondaryColor": "#000000",
  "accentColor": "#C0C0C0"
}
```

---

## Troubleshooting

### Client not showing?
```bash
# Check configuration
cat tenants/tenants.json | grep "newclient"

# Restart server
npm run dev
```

### Domain not working?
```bash
# Wait for DNS propagation (24-48 hours)
# Test with query parameter
https://hmcar.xyz?tenant=newclient
```

### Logo not showing?
```bash
# Check file exists
ls -la uploads/tenants/newclient/logo.png

# Check permissions
chmod 644 uploads/tenants/newclient/logo.png
```

---

## Documentation

- `دليل_إضافة_عميل_جديد.md` - Complete guide (Arabic)
- `تقرير_النظام.md` - System report (Arabic)
- `خطوات_سريعة_لإضافة_عميل.md` - Quick steps (Arabic)
- `MULTI_TENANT_GUIDE.md` - Technical guide (Arabic)

---

## Support

- Vercel: https://vercel.com/dashboard
- MongoDB: https://cloud.mongodb.com
- HM CAR: https://hmcar.xyz
- CAR X: https://carx-motors.com

---

**✅ Ready in 5 minutes!**

**Date:** March 29, 2026  
**Status:** Production Ready  
**System:** Multi-Tenant SaaS Platform
