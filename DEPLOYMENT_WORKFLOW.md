# 🚀 Deployment Workflow — vocabspeak.me

**Live URL:** https://vocabspeak.me

---

## Workflow: How to Deploy Changes (User → Live in Minutes)

### **Step 1: Report Issue or Improvement**
User sends message with:
- **What**: Feature request / bug fix / improvement description
- **Where** (optional): Specific page/component affected
- **Example**: "Signup page এ email validation error টা ফিক্স করতে হবে" or "Speak mode এ voice recognition improve করতে হবে"

### **Step 2: Agent Fixes Code**
- Read & understand the request
- Make changes locally
- **Test locally** (`npm run build`, `npm run dev`)
- Commit with clear message

### **Step 3: Push to GitHub**
```bash
git add .
git commit -m "Fix: [clear description of what changed]"
git push origin main
```

### **Step 4: Vercel Auto-Redeploy**
- Vercel detects push to `main` branch
- Triggers production build automatically
- Build logs: https://vercel.com/vocabspeak (Project → Deployments tab)

### **Step 5: Live Verification**
- Visit https://vocabspeak.me to verify changes
- Check console for any runtime errors (F12 → Console)

---

## Current Setup

### **Vercel Configuration**
- **Project**: vocabspeak (Vercel organization)
- **GitHub Connection**: Automatic redeploy on push to `main`
- **Environment Variables**: Set in Vercel dashboard (production)
- **Build Command**: `npm run build`
- **Start Command**: `next start` (handled by Vercel)

### **Environment Variables** (Production — stored in Vercel only)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_META_PIXEL_ID
```

### **Local Testing Before Push**
```bash
# 1. Make changes
# 2. Install deps (if needed)
npm install

# 3. Build locally (exactly like Vercel)
npm run build

# 4. Check for errors — if build passes, safe to push
# 5. Run dev server to test UX
npm run dev
# Visit http://localhost:3000
```

---

## Common Scenarios

### Scenario A: Quick Bug Fix
```
User: "Login page এ error message দেখাচ্ছে না"
↓
Agent: Fix src/app/login/page.tsx
↓
Agent: npm run build → passes
↓
Agent: git push origin main
↓
Vercel: Auto-redeploy (2-3 min)
↓
User: Check vocabspeak.me — fixed!
```

### Scenario B: Feature Addition
```
User: "Dashboard এ user stats দেখাতে হবে"
↓
Agent: Create new component + add to dashboard page
↓
Agent: Test with npm run dev locally
↓
Agent: npm run build → passes
↓
Agent: git push origin main
↓
Vercel: Auto-redeploy
↓
User: vocabspeak.me/dashboard — feature live!
```

### Scenario C: Emergency Rollback
If deployed code breaks something:
```bash
# Find last working commit
git log --oneline | head -5

# Revert to last working state
git revert <commit-hash>
git push origin main

# Vercel redeploys immediately
```

---

## Safety Rules

✅ **Always test locally before push:**
```bash
npm run build  # Must pass — shows Vercel's build conditions
npm run dev    # Test the UI
```

❌ **Never push code that:**
- Fails local `npm run build`
- Has console errors in dev mode
- Breaks auth flow (login/signup/verify-email)
- Accesses undefined env variables

📋 **Checklist before `git push`:**
- [ ] Feature works locally (`npm run dev`)
- [ ] No console errors (F12 → Console tab)
- [ ] `npm run build` passes with no errors
- [ ] No secrets hardcoded (all secrets in Vercel env)
- [ ] Commit message is clear

---

## Monitoring & Logs

### **After Push**
1. Go to https://vercel.com/vocabspeak
2. Click **Deployments** tab
3. Latest commit appears at top
4. Green ✅ = build success → live!
5. Red ❌ = build error → check logs (usually missing env or syntax error)

### **Runtime Issues After Deploy**
- Visit https://vocabspeak.me
- Open browser console (F12 → Console tab)
- Look for red errors
- Report to agent with screenshot

---

## Key Files (Do Not Break)

⚠️ **Critical paths — careful when modifying:**
- `src/app/layout.tsx` — Service Worker registration, global styles
- `src/lib/supabase.ts`, `src/lib/supabaseServer.ts` — Auth flow
- `src/lib/envValidation.ts` — Production safety checks
- `package.json` — Dependencies (must run `npm install` after changes)

---

## Next Steps (Future Optimization)

- [ ] Add CI/CD tests (Jest/Playwright) before deploy
- [ ] Replace in-memory rate limiter with Redis for scaling
- [ ] Add Sentry for production error tracking
- [ ] Set up Slack alerts for failed deployments
- [ ] Add database migrations tracking

---

**Version:** 1.0  
**Last Updated:** May 7, 2026  
**Status:** 🟢 Live on Vercel
