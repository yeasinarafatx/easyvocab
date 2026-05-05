# DigitalOcean App Platform Deployment Guide

## পূর্বশর্ত

1. ✅ GitHub repository সেটআপ (private/public)
2. ✅ DigitalOcean অ্যাকাউন্ট
3. ✅ Supabase প্রজেক্ট চালু
4. ✅ Cloudflare R2 বাকেট সেটআপ
5. ✅ কাস্টম ডোমেইন (বৈকল্পিক)

---

## ধাপ ১: Repository Push করুন

```bash
# আপনার রিপোজিটরিতে GitHub Push করুন
git add .
git commit -m "Deploy: Add DigitalOcean Dockerfile and app.yaml"
git push origin main
```

---

## ধাপ ২: ডিজিটালোশন Apps তৈরি করুন

1. [ডিজিটালোশন কনসোল](https://cloud.digitalocean.com) খুলুন
2. **Apps** → **Create App** ক্লিক করুন
3. **GitHub** সিলেক্ট করুন
4. আপনার রিপোজিটরি নির্বাচন করুন (`easy-vocab`)
5. **Branch**: `main` রেখে দিন
6. **Next** ক্লিক করুন

---

## ধাপ ৩: App Configuration

### স্বয়ংক্রিয় কনফিগারেশন (সুপারিশকৃত)

ডিজিটালোশন `app.yaml` স্বয়ংক্রিয়ভাবে ডিটেক্ট করবে। শুধু **Next** ক্লিক করুন।

### ম্যানুয়াল কনফিগারেশন (যদি প্রয়োজন হয়)

1. **Service Name**: `app` রাখুন
2. **Source Type**: GitHub রাখুন
3. **Build Command**: 
   ```
   npm ci && npm run build
   ```
4. **Run Command**: 
   ```
   node server.js
   ```
5. **HTTP Port**: `3000` রাখুন

---

## ধাপ ৪: Environment Variables সেট করুন

**Settings** ট্যাব → **Environment** → **Add Variable** ক্লিক করুন

নিম্নলিখিত যোগ করুন:

```
NEXT_PUBLIC_SUPABASE_URL          = your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY    = your_supabase_anon_key
R2_ACCOUNT_ID                     = your_r2_account_id
R2_ACCESS_KEY_ID                  = your_r2_access_key_id
R2_SECRET_ACCESS_KEY              = your_r2_secret_key
R2_BUCKET_NAME                    = your_r2_bucket_name
NEXT_PUBLIC_META_PIXEL_ID         = 980999427776233
NEXT_PUBLIC_SITE_URL              = https://your-domain.com
NODE_ENV                          = production
```

**💡 সংবেদনশীল ডেটা সুরক্ষিত রাখুন:**
- **Encrypt** চেকবক্স চেক করুন
- মাস্ক ভ্যালু সক্ষম করুন লগ থেকে সুরক্ষার জন্য

---

## ধাপ ৫: Health Check কনফিগার করুন

**Settings** → **Health Check**

```
Path:          /
Initial Delay: 5 seconds
Timeout:       3 seconds
Period:        10 seconds
```

---

## ধাপ ৬: Resource Allocation

**Settings** → **Resource Allocation**

শুরুর জন্য ন্যূনতম:
- **CPU**: 512m
- **Memory**: 512Mi

✅ Auto-scale এনাবল করুন (যদি পরে প্রয়োজন হয়)

---

## ধাপ ৭: Custom Domain (যদি প্রয়োজন)

**Settings** → **Domains**

1. **Add Domain** ক্লিক করুন
2. আপনার কাস্টম ডোমেইন এন্টার করুন
3. DNS records আপডেট করুন (ডিজিটালোশন নির্দেশনা অনুসরণ করুন)

---

## ধাপ ৮: Deploy শুরু করুন

1. সমস্ত সেটিংস পর্যালোচনা করুন
2. **Create App** ক্লিক করুন
3. **Build** প্রক্রিয়া শুরু হবে (3-5 মিনিট)

---

## Deployment Status চেক করুন

**Logs** ট্যাবে লাইভ বিল্ড লগ দেখুন:

```
✓ Dependencies installed
✓ Build completed successfully
✓ App running on port 3000
```

❌ **ত্রুটি হলে:**
- **Environment variables** যাচাই করুন
- **R2 credentials** সঠিক কিনা চেক করুন
- Supabase প্রজেক্ট অনলাইন আছে কিনা চেক করুন

---

## Deployment চেক করুন

✅ **Health Check Pass**
- Green status দেখবেন

✅ **App Running**
- `https://app-name-xxxxx.ondigitalocean.app` এ যান
- ল্যান্ডিং পেজ দেখা যাবে

---

## Continuous Deployment সেটআপ

✅ স্বয়ংক্রিয় (ডিফল্ট)
- GitHub push করলে স্বয়ংক্রিয়ভাবে রিডিপ্লয় হবে
- **Settings** → **GitHub** → Deployment trigger চেক করুন

---

## Production Checklist

- [ ] Environment variables সঠিকভাবে সেট করা
- [ ] Database migrations চালানো (SQL ফাইল)
- [ ] Admin users তৈরি করা
- [ ] R2 বাকেট অ্যাক্সেসযোগ্য
- [ ] Health check পাস করছে
- [ ] Login flow কাজ করছে
- [ ] Payment flow টেস্ট করা
- [ ] File upload/download টেস্ট করা
- [ ] Custom domain DNS সেট (যদি প্রয়োজন)

---

## Troubleshooting

### Build ফেইল হচ্ছে

```bash
# Local-এ টেস্ট করুন
npm run build
npm run start
```

### Memory Out of Bounds

`Resource Allocation` বাড়িয়ে দিন:
- CPU: 512m → 1024m
- Memory: 512Mi → 1Gi

### Environment Variables কাজ করছে না

- ডাবল-চেক করুন ভ্যারিয়েবল নাম
- অতিরিক্ত স্পেস নেই কিনা চেক করুন
- App রিস্টার্ট করুন (Redeploy)

---

## Cost Estimation

**ডিজিটালোশন অ্যাপ প্রাইসিং** (প্রতি মাস):

| Resource | Cost |
|----------|------|
| Basic App (512m CPU + 512Mi RAM) | $6-12 |
| Auto-scale (1-3 instances) | $12-30 |
| Bandwidth | $0-5 (প্রথম 1TB ফ্রি) |
| **Total** | **$6-35/মাস** |

**ডিজিটালোশন App Platform সুবিধা:**
✅ ডোমেইন অন্তর্ভুক্ত
✅ Auto SSL সার্টিফিকেট
✅ CDN অন্তর্ভুক্ত
✅ GitHub auto-deploy

---

## Performance Optimization

### CDN Enable করুন

**Settings** → **Networking** → **Enable CDN**

### Auto-scale Configure করুন

**Settings** → **Auto-scaling**

```
Min instances:  1
Max instances:  3
CPU threshold:  70%
Memory threshold: 80%
```

---

## Git Push-এর পর Redeploy করুন

স্বয়ংক্রিয় ডিপ্লয়মেন্ট সক্ষম থাকলে:

```bash
git add .
git commit -m "feat: Add new feature"
git push origin main
# ডিজিটালোশন স্বয়ংক্রিয়ভাবে রিডিপ্লয় করবে (~2-3 মিনিট)
```

---

## Monitoring & Logs

**Logs** ট্যাবে দেখুন:
- Build logs
- Runtime errors
- Request logs
- Health check status

---

## শেষ পরীক্ষা

```bash
# স্থানীয়ভাবে ডকার দিয়ে টেস্ট করুন (যদি Docker ইনস্টল করা থাকে)
docker build -t easy-vocab .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  easy-vocab
# http://localhost:3000 এ যান
```

---

## সাফল্যের চিহ্ন ✅

- App URL কাজ করছে
- Health check সবুজ
- Login/Signup প্রবাহ কাজ করছে
- ফাইল আপলোড/ডাউনলোড কাজ করছে
- Admin panel অ্যাক্সেসযোগ্য
- পেমেন্ট প্রক্রিয়া কাজ করছে

**আপনার অ্যাপ লাইভ! 🎉**
