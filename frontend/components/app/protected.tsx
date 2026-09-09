"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/app/shell";
import { LoadingState } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";

export function Protected({
  children,
  admin,
}: {
  children: React.ReactNode;
  admin?: boolean;
}) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (admin && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [admin, pathname, ready, router, user]);

  if (!ready || !user || (admin && user.role !== "admin")) {
    return (
      <div className="p-8">
        <LoadingState />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
