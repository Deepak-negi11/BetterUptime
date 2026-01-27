"use client"

import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { LogoTicker } from "@/components/logo-ticker";
import { UptimeFeatures } from "@/components/uptime-features";
import { Footer } from "@/components/footers";

export default function Home() {
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