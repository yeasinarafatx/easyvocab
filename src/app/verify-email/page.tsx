import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a] text-slate-100">
          <p className="text-sm">Loading...</p>
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}
