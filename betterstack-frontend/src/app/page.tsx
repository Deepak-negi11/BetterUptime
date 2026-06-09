"use client"

import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { LogoTicker } from "@/components/logo-ticker";
import { UptimeFeatures } from "@/components/uptime-features";
import { Footer } from "@/components/footers";
import { getValidStoredToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (getValidStoredToken()) {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <div>
      <Header/>
      <Hero onGetStarted={() => console.log('Get started clicked')} />
      <LogoTicker />
      <UptimeFeatures />
      <Footer />
    </div>

  )
}
