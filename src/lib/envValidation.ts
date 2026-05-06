/**
 * Environment variables validation for startup
 * Ensures all required env vars are set before app runs
 */

export interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isDevelopment: boolean;
}

function warnIfMissing(name: string): void {
  if (!process.env[name]) {
    console.warn(`⚠️  Missing ${name} environment variable`);
  }
}

export function validateEnvironment(): EnvConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check Supabase configuration
  if (!supabaseUrl) {
    throw new Error(
      `❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable.\n` +
      `Please add it to your .env.local file:`
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      `❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.\n` +
      `Please add it to your .env.local file:`
    );
  }

  warnIfMissing("R2_ACCOUNT_ID");
  warnIfMissing("R2_ACCESS_KEY_ID");
  warnIfMissing("R2_SECRET_ACCESS_KEY");
  warnIfMissing("R2_BUCKET_NAME");

  // Validate URL format
  if (!supabaseUrl.includes("supabase.co")) {
    console.warn(`⚠️  NEXT_PUBLIC_SUPABASE_URL looks invalid: ${supabaseUrl}`);
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    isDevelopment: process.env.NODE_ENV === "development",
  };
}

// Validate on app startup.
// Fail fast in production so missing secrets do not surface as random runtime crashes.
if (typeof window === "undefined") {
  try {
    validateEnvironment();
    console.log("✅ Environment variables validated successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }

    console.error(message);
  }
}
