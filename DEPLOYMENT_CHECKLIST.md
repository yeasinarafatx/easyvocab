# ডিজিটালোশন ডেপ্লয়মেন্ট চেকলিস্ট

## প্রস্তুতি (Deployment এর আগে)

### 1. GitHub Repository সেটআপ
- [ ] GitHub অ্যাকাউন্ট তৈরি করা
- [ ] রিপোজিটরি তৈরি করা (easy-vocab)
- [ ] সমস্ত কোড push করা (`git push origin main`)
- [ ] `.env.local` push না করা (sensitive data)

### 2. Environment Variables সংগ্রহ করুন

```
Supabase:
- [ ] NEXT_PUBLIC_SUPABASE_URL = ________________________
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY = ________________________

Cloudflare R2:
- [ ] R2_ACCOUNT_ID = ________________________
- [ ] R2_ACCESS_KEY_ID = ________________________
- [ ] R2_SECRET_ACCESS_KEY = ________________________
- [ ] R2_BUCKET_NAME = ________________________

Optional:
- [ ] NEXT_PUBLIC_META_PIXEL_ID = 980999427776233
- [ ] NEXT_PUBLIC_SITE_URL = ________________________
```

### 3. Database Setup

**Supabase-এ নিম্নলিখিত SQL চালান:**

```sql
-- SQL Editor-এ যান → নতুন query
-- Copy-paste করুন supabase/sql/ থেকে:
-- 1. 001_manual_payment_foundation.sql
-- 2. 002_admin_review_read_policy.sql  
-- 3. 003_resources_table.sql
```

- [ ] 001 SQL চালানো ✓
- [ ] 002 SQL চালানো ✓
- [ ] 003 SQL চালানো ✓

### 4. Admin Users তৈরি করুন

```sql
-- Supabase SQL Editor
insert into public.admin_users (user_id)
values ('YOUR_USER_ID_HERE');
```

- [ ] আপনার user ID খুঁজে নিন (Supabase Auth → Users)
- [ ] Admin user insert করা ✓

### 5. R2 Bucket সেটআপ

**Cloudflare R2-এ:**
- [ ] Bucket তৈরি করা
- [ ] R2 API টোকেন তৈরি করা (Account ID, Access Key, Secret)
- [ ] Bucket name নোট করা

---

## ডিজিটালোশন ডেপ্লয়মেন্ট

### ধাপ 1: ডিজিটালোশন অ্যাপ তৈরি করুন
- [ ] DigitalOcean কনসোল খুলুন: https://cloud.digitalocean.com
- [ ] **Apps** → **Create App**
- [ ] **GitHub** সিলেক্ট করুন
- [ ] `easy-vocab` রিপোজিটরি সিলেক্ট করুন
- [ ] Branch: `main` রাখুন
- [ ] **Next** ক্লিক করুন

### ধাপ 2: Build কনফিগ যাচাই করুন
- [ ] Build Command: `npm ci && npm run build`
- [ ] Run Command: `node server.js`
- [ ] HTTP Port: `3000`

### ধাপ 3: Environment Variables সেট করুন
- [ ] **Settings** → **Environment**
- [ ] উপরোক্ত সমস্ত 8 ভ্যারিয়েবল যোগ করুন
- [ ] **Encrypt** চেক করুন প্রতিটি ভ্যারিয়েবলের জন্য
- [ ] **Save** ক্লিক করুন

### ধাপ 4: Resource Allocation
- [ ] **Settings** → **Resource Allocation**
- [ ] CPU: `512m`
- [ ] Memory: `512Mi`
- [ ] Auto-scale: Enabled (optional)

### ধাপ 5: Health Check
- [ ] **Settings** → **Health Check**
- [ ] Path: `/`
- [ ] Initial Delay: `5` seconds
- [ ] Timeout: `3` seconds
- [ ] Period: `10` seconds

### ধাপ 6: Deploy করুন
- [ ] সমস্ত সেটিংস পর্যালোচনা করুন
- [ ] **Create App** ক্লিক করুন
- [ ] Build শুরু হবে (3-5 মিনিট অপেক্ষা করুন)

---

## Post-Deployment Tests

### ধাপ 1: App URL টেস্ট করুন
- [ ] ডিজিটালোশন থেকে App URL কপি করুন
- [ ] ব্রাউজারে খুলুন
- [ ] Landing page দেখা যায় কিনা চেক করুন

### ধাপ 2: Authentication টেস্ট করুন
- [ ] `/signup` এ যান
- [ ] নতুন অ্যাকাউন্ট তৈরি করুন
- [ ] ইমেইল ভেরিফাই করুন
- [ ] `/login` এ লগইন করুন
- [ ] ড্যাশবোর্ডে রিডাইরেক্ট হন

### ধাপ 3: Payment Flow টেস্ট করুন
- [ ] `/payment` এ যান
- [ ] bKash/Nagad নির্বাচন করুন
- [ ] পেমেন্ট রিকোয়েস্ট জমা দিন
- [ ] Admin panel (`/admin/reviews`) চেক করুন
- [ ] রিকোয়েস্ট অনুমোদন করুন

### ধাপ 4: File Upload/Download টেস্ট করুন
- [ ] Admin অ্যাকাউন্ট দিয়ে `/admin/resources` এ যান
- [ ] PDF ফাইল আপলোড করুন
- [ ] ডাউনলোড লিংক টেস্ট করুন
- [ ] ফাইল ডাউনলোড হয় কিনা চেক করুন

### ধাপ 5: Premium গেটিং টেস্ট করুন
- [ ] Free ব্যবহারকারী হিসেবে লগইন করুন
- [ ] `/resources/paid` এ যান
- [ ] "Premium প্রয়োজন" বার্তা দেখা যায় কিনা চেক করুন

---

## Monitoring চলছে

### Daily চেক করুন:
- [ ] App Health Status (সবুজ দেখা যাচ্ছে কিনা)
- [ ] Error Logs (কোনো ত্রুটি নেই কিনা)
- [ ] CPU/Memory Usage (normal range-এ আছে কিনা)

### Weekly চেক করুন:
- [ ] Payment requests processed সংখ্যা
- [ ] New user signups সংখ্যা
- [ ] File download count
- [ ] Performance metrics

---

## Troubleshooting

### Build ফেইল হচ্ছে
```
Solution:
1. Local-এ `npm run build` চালান
2. Errors fix করুন
3. GitHub push করুন
4. Redeploy করুন
```

### App Crashed (Health Check Failed)
```
Solution:
1. Logs দেখুন (ডিজিটালোশন → Logs)
2. Environment variables চেক করুন
3. Redeploy করুন (App Settings → Redeploy)
```

### Database Connection Error
```
Solution:
1. Supabase URL ও Key যাচাই করুন
2. Environment variables রি-এন্টার করুন
3. Supabase Status Page চেক করুন
```

### R2 Upload Failing
```
Solution:
1. R2 credentials যাচাই করুন
2. Bucket permissions চেক করুন
3. Bucket name সঠিক কিনা চেক করুন
```

---

## Custom Domain সেটআপ (Optional)

- [ ] Domain registrar-এ যান
- [ ] DNS Settings খুলুন
- [ ] **CNAME Record যোগ করুন:**
  - Name: `www`
  - Value: `app-name-xxxxx.ondigitalocean.app`
- [ ] ডিজিটালোশন-এ Domain যোগ করুন:
  - **Settings** → **Domains**
  - Add: `yourdomain.com`
- [ ] DNS প্রোপাগেশন অপেক্ষা করুন (15-30 মিনিট)

---

## Success Checklist ✅

- [ ] App URL কাজ করছে
- [ ] Health check passed
- [ ] Login flow কাজ করছে
- [ ] Payment flow টেস্ট সফল
- [ ] File upload/download কাজ করছে
- [ ] Admin panel অ্যাক্সেসযোগ্য
- [ ] Meta Pixel ট্র্যাকিং কাজ করছে
- [ ] No critical errors in logs

**অভিনন্দন! আপনার অ্যাপ প্রোডাকশনে লাইভ 🎉**

---

## Monthly Costs Estimate

| Item | Cost |
|------|------|
| Basic App (512m CPU) | $6-12 |
| Auto-scaling (if needed) | +$6-12 |
| Bandwidth (if exceeds 1TB) | ~$0.12/GB |
| Total | ~$6-30/মাস |

---

## Support & Help

**ডিজিটালোশন Docs:** https://docs.digitalocean.com/products/app-platform/

**Issues?** 
- ডিজিটালোশন Support: https://support.digitalocean.com/
- GitHub Issues: GitHub রিপোজিটরিতে issue তৈরি করুন
