"use client"

import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { UptimeFeatures } from "@/components/uptime-features";
import { Footer } from "@/components/footers";

export default function Home() {
  return (
    <div>
      <Header/>
      <Hero />
      <UptimeFeatures />
      <Footer />
    </div>

  )
}
