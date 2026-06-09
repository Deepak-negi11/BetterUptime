import { Separator } from '@/components/ui/separator';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const categories = [
    { title: 'Product', links: ['Features', 'Pricing', 'Security', 'Status'] },
    { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
    { title: 'Resources', links: ['Documentation', 'API Docs', 'Support', 'Community'] },
    { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Compliance'] },
  ];

  return (
    <footer className="w-full bg-gradient-to-t from-card/80 to-background border-t border-border/40 backdrop-blur-lg relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-soft"></div>
        <div className="absolute -bottom-40 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {categories.map((category, i) => (
            <div key={category.title} className="animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
              <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
                {category.title}
              </h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {category.links.map((link, li) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block relative group"
                    >
                      {link}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-300"></span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator />

        <div className="py-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-2 mb-4 md:mb-0 group cursor-pointer hover:scale-105 transition-transform duration-300">
            <div className="w-6 h-6 bg-gradient-to-br from-primary via-accent to-primary rounded flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow duration-300">
              <span className="text-primary-foreground font-bold text-xs">⚡</span>
            </div>
            <span className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
              Better Stack
            </span>
          </div>

          <p className="hover:text-foreground transition-colors duration-300">
            © {currentYear} Better Stack. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
