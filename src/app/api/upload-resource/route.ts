import { NextResponse } from "next/server";
import { buildResourceKey, createR2UploadUrl } from "@/lib/r2";
import { createSupabaseTokenClient } from "@/lib/supabaseServer";

type UploadResourceBody = {
  fileName?: string;
  fileType?: string;
  isFree?: boolean;
  fileSize?: number;
  folderId?: string | null;
};

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authClient = createSupabaseTokenClient(token);
    const { data: userResult, error: userError } = await authClient.auth.getUser();
    if (userError || !userResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminRow, error: adminError } = await authClient
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userResult.user.id)
      .maybeSingle();

    if (adminError) {
      return NextResponse.json({ error: "Failed to verify admin access" }, { status: 500 });
    }

    if (!adminRow?.user_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as UploadResourceBody;
    const fileName = body.fileName?.trim();
    const fileType = body.fileType?.trim() || "application/octet-stream";
    const fileSize = body.fileSize;

    if (!fileName) {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }

    // File size validation: max 100 MB
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB in bytes
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds maximum limit of 100 MB. Uploaded file is ${(fileSize / 1024 / 1024).toFixed(2)} MB.`,
          maxSizeBytes: MAX_FILE_SIZE,
          maxSizeMB: 100,
        },
        { status: 413 }
      );
    }

    const fileKey = buildResourceKey(fileName, body.folderId ?? null);
    const uploadUrl = await createR2UploadUrl(fileKey, fileType);

    return NextResponse.json({ uploadUrl, fileKey });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}