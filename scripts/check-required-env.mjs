#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const REQUIRED_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
];

const OPTIONAL_RECOMMENDED_KEYS = ["NEXT_PUBLIC_SITE_URL"];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const result = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalIndex = line.indexOf("=");
    if (equalIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalIndex).trim();
    let value = line.slice(equalIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

function readMergedEnv() {
  const root = process.cwd();
  const envFromFiles = {
    ...parseEnvFile(path.join(root, ".env")),
    ...parseEnvFile(path.join(root, ".env.local")),
    ...parseEnvFile(path.join(root, ".env.production")),
    ...parseEnvFile(path.join(root, ".env.production.local")),
  };

  return {
    ...envFromFiles,
    ...process.env,
  };
}

function isMissing(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function main() {
  const env = readMergedEnv();

  const missingRequired = REQUIRED_KEYS.filter((key) => isMissing(env[key]));
  const missingRecommended = OPTIONAL_RECOMMENDED_KEYS.filter((key) => isMissing(env[key]));

  if (missingRequired.length > 0) {
    console.error("\n[deploy-check] Missing required environment variables:\n");
    for (const key of missingRequired) {
      console.error(`- ${key}`);
    }
    console.error("\n[deploy-check] Set them in your deployment provider before release.\n");
    process.exit(1);
  }

  if (missingRecommended.length > 0) {
    console.warn("\n[deploy-check] Recommended environment variables not set:\n");
    for (const key of missingRecommended) {
      console.warn(`- ${key}`);
    }
    console.warn("\n[deploy-check] Continuing, but metadata/canonical URL may be incorrect.\n");
  }

  console.log("[deploy-check] Environment validation passed.");
}

main();
