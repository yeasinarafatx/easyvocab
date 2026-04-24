const EMAIL_NOT_CONFIRMED = "email not confirmed";
const RATE_LIMIT = "email rate limit exceeded";

export function isEmailNotConfirmedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.toLowerCase().includes(EMAIL_NOT_CONFIRMED);
}

export function getFriendlyAuthError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।";
  }

  const message = error.message.toLowerCase();

  if (message.includes(RATE_LIMIT)) {
    return "একই ইমেইলে খুব দ্রুত বেশি request হয়েছে। 60 সেকেন্ড অপেক্ষা করে আবার চেষ্টা করুন।";
  }

  if (message.includes(EMAIL_NOT_CONFIRMED)) {
    return "আপনার ইমেইল এখনো verify হয়নি। email-এর verification code দিয়ে verify করুন।";
  }

  if (message.includes("invalid login credentials")) {
    return "ইমেইল বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।";
  }

  if (message.includes("user already registered")) {
    return "এই ইমেইলে অ্যাকাউন্ট আগে থেকেই আছে। Login করুন অথবা Forgot Password ব্যবহার করুন।";
  }

  return error.message;
}
