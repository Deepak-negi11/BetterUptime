'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Mail } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';


interface HeroProps {
  onGetStarted: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  const [email, setEmail] = useState('');

  return (
    <section className="w-full py-24 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-soft"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-8 mb-16">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight text-balance mb-4">
              The most reliable<br />uptime monitoring
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Get 10 monitors, 10 heartbeats and a status page<br />with 3-minute checks totally free.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex-1 w-full sm:w-auto">
              <input
                type="email"
                placeholder="Your work e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-2 bg-muted/50 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/80 transition-all duration-300"
              />
            </div>
            <Button
              onClick={onGetStarted}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/40 px-6 py-4 whitespace-nowrap"
            >
              Get started in 30 seconds
            </Button>
          </div>

          <p className="mt-5 pb-2 text-neutral-300 text-13 sm:text-base-landing text-center cz-color-8875620">
            Looking for an enterprise solution? 
            <a className="text-neutral-200 underline underline-offset-4 transition decoration-[#C9D3EE]/20 hover:decoration-[#C9D3EE] cz-color-12098963" href="https://betterstack.com/book-a-demo" rel="nofollow noopener" target="_blank">
              Book a demo
            </a>

          </p>
          <div className="mt-10 mx-auto flex justify-center max-w-[1700px] sm:-mb-10 cz-color-12098963">
            <img width={393} height={596} className="w-full sm:hidden -mt-14 -mb-24 cz-color-12098963"
              alt="" src="https://betterstackcdn.com/assets/v2/uptime-v3/hero-sm-a9daaad2.jpg" />
            <img width={1730} height={662} className="hidden sm:block max-w-[800px] md:max-w-[1200px] lg:max-w-none cz-color-12098963" alt="" src="https://betterstackcdn.com/assets/v2/uptime-v3/hero-9dc9f8c8.jpg" />
          </div>


        </div>
      </div>
    </section>
  );
}
