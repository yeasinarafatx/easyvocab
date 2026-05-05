# 🚀 Deploy করার আগে করতে হবে

## ১. Environment Variables সেট করুন

```bash
# .env.local ফাইলে এগুলো যোগ করুন:

NEXT_PUBLIC_SUPABASE_URL=আপনার_সুপাবেস_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=আপনার_সুপাবেস_কী
```

**কোথায় পাবেন:**
1. supabase.com এ যান
2. আপনার প্রজেক্ট খুলুন
3. Settings > API এ ক্লিক করুন
4. URL এবং Anon Key কপি করুন

---

## ২. Build Testing

```bash
# Build করুন
npm run build

# কোনো error আছে কিনা চেক করুন
```

যদি build pass হয় ✅ তাহলে আপনি ready for deployment!

---

## ৩. এই জিনিসগুলো Test করুন

### Test ১: Network Offline
1. Browser DevTools খুলুন (F12)
2. Network tab এ যান
3. Offline checkbox টিক করুন
4. Page refresh করুন
5. **Expected**: App crash না হয়ে cache থেকে data দেখাবে

### Test ২: Error Boundary
1. Browser Console এ এটা লিখুন:
   ```javascript
   throw new Error("Test error");
   ```
2. **Expected**: Error page দেখাবে, app crash হবে না

### Test ৩: Missing Env Variables
1. `.env.local` ফাইল মুছে ফেলুন
2. `npm run build` করুন
3. **Expected**: Build start এ error দেখাবে

### Test ৪: Data Loading Errors
1. Browser DevTools এ Console tab খুলুন
2. একটি level open করুন
3. যদি data load fail হয় তাহলে **Error UI দেখাবে** retry button সহ

---

## ৪. Production Deploy সময়

### Vercel এ Deploy করলে:

```bash
# 1. Vercel Dashboard এ যান
# 2. Project settings এ যান
# 3. Environment Variables এ যোগ করুন:
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
# 4. Redeploy করুন
```

---

## ✅ Final Checklist

- [ ] .env.local ফাইল তৈরি করা হয়েছে?
- [ ] Supabase credentials যোগ হয়েছে?
- [ ] `npm run build` pass হয়েছে?
- [ ] Offline test pass হয়েছে?
- [ ] Browser console এ কোনো error নেই?
- [ ] Error Boundary test pass হয়েছে?

যদি সব ✅ হয় তাহলে আপনি **Safe to Deploy**!

---

## 📊 Users Deploy এর পর কি দেখবে

### ✅ **হবার কথা:**
- App smooth এ load হবে
- Network disconnect হলে cached data দেখাবে
- Error হলে friendly error message দেখাবে
- "Retry" button দিয়ে আবার চেষ্টা করতে পারবে
- No crashes ❌

### ❌ **হওয়ার কথা না:**
- White blank screen ✗
- Unexpected error messages ✗
- Data না load হওয়া ✗
- App crash ✗

---

## 🔍 Production Monitoring

### User Issue হলে:

**Step 1: Browser Console এ লোগ চেক করুন**
```javascript
// F12 → Console tab খুলুন
// এগুলো দেখতে পাবেন:
// "✅ Environment variables validated successfully"
// "❌ Failed to load data: beginner/level_01"
```

**Step 2: Error Logs Export করুন**
```javascript
// Console এ এই command দিন:
const logs = JSON.parse(localStorage.getItem('app_error_logs') || '[]');
console.table(logs);
copy(JSON.stringify(logs, null, 2));
// তারপর [Ctrl+C] দিয়ে copy করুন
```

**Step 3: Support এ পাঠান**
- যে error logs export করেছেন সেটা পাঠান
- কি ঘটছিল সেটা বলুন
- কোন browser/device এ ঘটেছে

---

## 🆘 যদি সমস্যা হয়

### Problem: "Missing NEXT_PUBLIC_SUPABASE_URL"
**Solution**: `.env.local` ফাইলে environment variables যোগ করুন

### Problem: "Word data load করা যায়নি"
**Solution**: JSON file সঠিক location এ আছে কিনা চেক করুন

### Problem: "Cannot read property subscription"
**Solution**: এটি fixed - dashboard auth cleanup ঠিক করা হয়েছে

### Problem: App still crashes
**Solution**: Browser console error copy করুন এবং share করুন

---

## 📞 Support

যদি কোনো problem হয়:
1. Browser console (F12) খুলুন
2. Error message screenshot নিন
3. Error logs export করুন (উপরে দেখুন)
4. Support team কে জানান

