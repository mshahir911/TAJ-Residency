# Taj Residency PMS — Vercel Deployment & Production Setup Guide

This guide walks you through deploying **Taj Residency PMS** to **Vercel** with GitHub CI/CD, Supabase environment variables, and custom domain configuration.

---

## 1. Push to GitHub

Create a new repository on your GitHub account (e.g. `taj-residency-pms`), then run the following commands in your terminal:

```bash
# Add your GitHub remote (replace with your GitHub repository URL)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/taj-residency-pms.git
git branch -M main
git push -u origin main
```

---

## 2. Deploy on Vercel (1-Click Setup)

1. Go to **[https://vercel.com/new](https://vercel.com/new)** and log in with your GitHub account.
2. Under **Import Git Repository**, select `taj-residency-pms` and click **Import**.
3. **Framework Preset**: Vite (automatically detected).
4. **Root Directory**: `./` (default).
5. **Build and Output Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

---

## 3. Configure Environment Variables in Vercel

In the Vercel project configuration page before clicking Deploy (or in **Project Settings ➔ Environment Variables**):

| Key | Value | Purpose |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://cdhrpaunmcyknmrcvqdg.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | *(Paste your Supabase public anon key)* | Supabase Client Authentication |

> [!IMPORTANT]
> The `.env` file is protected by `.gitignore` and is never committed to GitHub. Adding these variables directly in Vercel ensures your API keys remain secure.

Click **Deploy**. In under 60 seconds, your production URL (e.g. `https://taj-residency-pms.vercel.app`) will be live with automatic SSL!

---

## 4. Custom Domain Setup (Optional / Recommended)

To point a branded domain (such as `app.tajresidency.com` or `pms.tajresidency.com`):

1. In your Vercel Project Dashboard, navigate to **Settings ➔ Domains**.
2. Enter your desired domain (e.g. `app.tajresidency.com`) and click **Add**.
3. In your DNS provider (Cloudflare, GoDaddy, Namecheap, etc.), add the recommended CNAME record:
   - **Type:** `CNAME`
   - **Name:** `app`
   - **Value:** `cname.vercel-dns.com`
4. Vercel will automatically provision a free, auto-renewing SSL certificate.

---

## 5. Mobile PWA Installation (Phone & Tablet Counter)

Once deployed to your Vercel URL or custom domain:

- **iOS (iPhone / iPad)**: Open in Safari, tap the **Share** button ➔ **Add to Home Screen**.
- **Android (Pixel / Samsung)**: Open in Chrome, tap the menu (⋮) ➔ **Install App / Add to Home Screen**.

The app will launch full-screen without browser address bars as **Taj PMS** with instant offline caching!
