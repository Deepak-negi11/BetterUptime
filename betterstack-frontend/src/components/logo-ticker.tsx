'use client';

// Using Simple Icons CDN: https://cdn.simpleicons.org/[icon-name]/[color]
const logos = [
    { name: 'Accenture', src: 'https://cdn.simpleicons.org/accenture/ffffff' },
    { name: 'Raspberry Pi', src: 'https://cdn.simpleicons.org/raspberrypi/ffffff' },
    { name: 'Brave', src: 'https://cdn.simpleicons.org/brave/ffffff' },
    { name: 'Vercel', src: 'https://cdn.simpleicons.org/vercel/ffffff' },
    { name: 'GitHub', src: 'https://cdn.simpleicons.org/github/ffffff' },
    { name: 'Stripe', src: 'https://cdn.simpleicons.org/stripe/ffffff' },
    { name: 'Slack', src: 'https://cdn.simpleicons.org/slack/ffffff' },
    { name: 'Netflix', src: 'https://cdn.simpleicons.org/netflix/ffffff' },
    { name: 'Spotify', src: 'https://cdn.simpleicons.org/spotify/ffffff' },
    { name: 'Redis', src: 'https://cdn.simpleicons.org/redis/ffffff' },
    { name: 'Docker', src: 'https://cdn.simpleicons.org/docker/ffffff' },
    { name: 'Cloudflare', src: 'https://cdn.simpleicons.org/cloudflare/ffffff' },
];

export function LogoTicker() {
    return (
        <section className="w-full py-12 bg-background overflow-hidden">
            <div className="text-center mb-8">
                <p className="text-sm text-muted-foreground tracking-wide">
                    Relied on by the world's best engineering teams
                </p>
            </div>

            {/* Marquee container with gradient masks */}
            <div className="relative">
                {/* Left fade gradient */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />

                {/* Right fade gradient */}
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                {/* Scrolling content */}
                <div className="flex animate-scroll-left">
                    {/* First set of logos */}
                    <div className="flex items-center gap-16 px-8 shrink-0">
                        {logos.map((logo, index) => (
                            <img
                                key={`logo-1-${index}`}
                                src={logo.src}
                                alt={logo.name}
                                className="h-6 sm:h-8 w-auto opacity-60 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0"
                            />
                        ))}
                    </div>

                    {/* Duplicate set for seamless loop */}
                    <div className="flex items-center gap-16 px-8 shrink-0">
                        {logos.map((logo, index) => (
                            <img
                                key={`logo-2-${index}`}
                                src={logo.src}
                                alt={logo.name}
                                className="h-6 sm:h-8 w-auto opacity-60 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
