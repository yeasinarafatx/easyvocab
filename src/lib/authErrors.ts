const EMAIL_NOT_CONFIRMED = "email not confirmed";
const RATE_LIMIT = "email rate limit exceeded";

export function getFriendlyAuthError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।";
  }

  const message = error.message.toLowerCase();

  if (message.includes(RATE_LIMIT)) {
    return "একই ইমেইলে খুব দ্রুত বেশি request হয়েছে। 60 সেকেন্ড অপেক্ষা করে আবার চেষ্টা করুন।";
  }

  if (message.includes(EMAIL_NOT_CONFIRMED)) {
    return "এই অ্যাকাউন্টে login করা যাচ্ছে না। email/password ঠিক আছে কি না দেখুন, দরকার হলে Forgot Password ব্যবহার করুন।";
  }

  if (message.includes("invalid login credentials")) {
    return "ইমেইল বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।";
  }

  if (message.includes("user already registered")) {
    return "এই ইমেইলে অ্যাকাউন্ট আগে থেকেই আছে। Login করুন অথবা Forgot Password ব্যবহার করুন।";
  }

  return error.message;
}
