'use client';

import { Globe, Clock, Shield, Calendar, Server, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UptimeFeatures() {
    return (
        <section className="w-full py-24 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                        Best-in-className uptime monitoring.
                        <br />
                        <span className="text-foreground">No false positives.</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                        Get a screenshot of the error and a second-by-second
                        <br />
                        timeline with our fastest 30-second checks.
                    </p>
                    <Button
                        variant="outline"
                        className="bg-[#191A28] border text-white/70 px-6 py-3 rounded-full hover:bg-[#191A28] hover:text-white transition-all duration-300"
                    >
                        Explore website monitoring →
                    </Button>
                </div>
                <div className="mt-12 mx-auto relative flex flex-col md:flex-row max-w-[900px] cz-color-12098963">
                    <div className="flex-1 mt-10 md:mt-0 sm:w-[470px] cz-color-12098963">

                        <div className="md:h-[490px] cz-color-12098963 b">
                            <img width="760" height="1000" alt="MTR Terminal" className="relative w-[760px] max-w-none" src="/image.png" />
                        </div>
                        <div className="-mt-20 md:mt-20 ml-5 md:ml-0 cz-color-12098963">
                            <h3 className="text-white font-bold text-[18px] md:text-[28px] leading-[117%] cz-color-16777215">
                                Traceroute &amp; MTR for timeouts
                            </h3>
                            <p className="mt-3 text-base md:text-md max-w-[342px] cz-color-12098963">
                                Understand connection timeouts and request timeouts with edge-based traceroute and MTR outputs.
                            </p>
                        </div>
                    </div>
                    <div className="flex-1 mt-20 sm:w-[470px] cz-color-12098963">
                        <div className="relative mt-4 rounded-xl border bg-uptime-v3-screenshots border-[#939DB8]/10 bg-[#0F101A] cz-color-12098963 cz-color-1708047">
                            <div className="hidden md:block absolute -top-28 flex justify-center md:w-[450px] cz-color-12098963">
                                <img width="472" height="746" alt="" className="relative -right-7 lazyloaded cz-color-12098963" data-src="https://betterstackcdn.com/assets/v2/uptime-v3/incident-screenshot-85499935.png" src="https://betterstackcdn.com/assets/v2/uptime-v3/incident-screenshot-85499935.png" />
                            </div>
                            <img width="344" height="350" alt="" className="md:hidden w-full cz-color-12098963 lazyloaded" data-src="https://betterstackcdn.com/assets/v2/uptime-v3/incident-screenshot-sm-a4d9a888.png" src="https://betterstackcdn.com/assets/v2/uptime-v3/incident-screenshot-sm-a4d9a888.png" />
                            <div className="relative z-10 pl-9 pr-5 py-6 -mt-[30%] md:mt-[40%] cz-color-12098963">
                                <h4 className="text-white font-medium cz-color-16777215">
                                    Screenshots &amp; error logs
                                </h4>
                                <p className="mt-2 cz-color-12098963">
                                    We record your API's error message and take a screenshot of your website being down so that
                                    you know exactly what happened.
                                </p>
                            </div>
                        </div>
                        <div className="relative mt-6 px-9 py-6 rounded-xl border overflow-hidden border-[#939DB8]/10 bg-[#0F101A] cz-color-12098963 cz-color-1708047">
                            <div className="absolute inset-0 sm:w-[700px] xl:w-[750px] cz-color-12098963">
                                <img width="470" height="351" alt="" data-src="screenshot.png" className="lazyloaded cz-color-12098963" src="https://betterstackcdn.com/assets/v2/uptime-v3/playwright-79f69869.jpg" />
                            </div>
                            <div className="relative z-10 mt-[55%] cz-color-12098963">
                                <h4 className="text-white font-medium cz-color-16777215">
                                    Playwright transaction monitoring
                                </h4>
                                <p className="mt-2 cz-color-12098963">
                                    We test all vital interactions by running a real Chrome browser instance, with a full-fledged JavaScript runtime.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature Cards */}
                <div className="mt-29 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* SSL to Domain Expiration */}
                    <div className="text-left">
                        <div className="w-10 h-10 mb-4 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white/60" />
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-3">
                            From SSL to domain expiration
                        </h3>
                        <p className="text-white/50 text-sm leading-relaxed">
                            Monitor everything. Whether it's your web page, API, ping, SSL, domain expiration, POP3, IMAP, SMTP, DNS, or generic network monitoring. We've got you covered.
                        </p>
                    </div>

                    {/* 30s Checks */}
                    <div className="text-left">
                        <div className="w-10 h-10 mb-4 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-white/60" />
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-3">
                            30s checks from around the world
                        </h3>
                        <p className="text-white/50 text-sm leading-relaxed">
                            Get a screenshot of the error and a second-by-second timeline with our fastest 30-second checks.
                        </p>
                    </div>

                    {/* Cron Monitoring */}
                    <div className="text-left">
                        <div className="w-10 h-10 mb-4 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white/60" />
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-3">
                            Cron monitoring
                        </h3>
                        <p className="text-white/50 text-sm leading-relaxed">
                            Never lose a database backup again. Track your CRON jobs and serverless workers and get alerted if they don't run correctly.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
