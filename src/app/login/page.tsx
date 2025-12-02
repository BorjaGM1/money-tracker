import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<LoginSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow animate-pulse">
      <div className="h-8 bg-muted rounded w-3/4 mb-2" />
      <div className="h-4 bg-muted rounded w-full mb-6" />
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-20" />
          <div className="h-9 bg-muted rounded w-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-20" />
          <div className="h-9 bg-muted rounded w-full" />
        </div>
        <div className="h-9 bg-muted rounded w-full" />
      </div>
    </div>
  );
}
