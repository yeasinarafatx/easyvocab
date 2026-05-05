import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }

  return value;
}

export function getR2BucketName(): string {
  return getRequiredEnv("R2_BUCKET_NAME");
}

function getR2Client(): S3Client {
  const accountId = getRequiredEnv("R2_ACCOUNT_ID");
  const accessKeyId = getRequiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = getRequiredEnv("R2_SECRET_ACCESS_KEY");

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
}

export function buildResourceKey(fileName: string, folderId?: string | null): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const prefix = folderId ? `resources/${folderId}` : "resources";

  return `${prefix}/${crypto.randomUUID()}-${safeName}`;
}

export async function createR2UploadUrl(objectKey: string, contentType: string): Promise<string> {
  const client = getR2Client();

  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: getR2BucketName(),
      Key: objectKey,
      ContentType: contentType,
    }),
    { expiresIn: 60 * 10 }
  );
}

export async function createR2DownloadUrl(objectKey: string): Promise<string> {
  const client = getR2Client();

  // 1 hour expiration instead of 10 minutes
  // This allows users to start downloads and complete them within reasonable time
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: getR2BucketName(),
      Key: objectKey,
    }),
    { expiresIn: 60 * 60 }
  );
}