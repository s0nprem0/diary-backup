"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    // Auth removed — redirect to home
    router.replace('/');
  }, [router]);
  return null;
}
