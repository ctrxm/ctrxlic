import { useState } from "react";
import ctrxlLogo from "@/assets/images/ctrxl-logo.png";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Shield,
  Key,
  BarChart3,
  Code2,
  Zap,
  Globe,
  ArrowRight,
  CheckCircle2,
  Lock,
  RefreshCw,
  Menu,
  X,
  Send,
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(1deg); }
          66% { transform: translateY(10px) rotate(-1deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-15px) translateX(10px); }
          50% { transform: translateY(5px) translateX(-5px); }
          75% { transform: translateY(-10px) translateX(-10px); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(25px) scale(1.05); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes gradient-text-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .hero-gradient-bg {
          background: linear-gradient(
            135deg,
            hsl(250 80% 20%) 0%,
            hsl(260 70% 15%) 25%,
            hsl(240 60% 18%) 50%,
            hsl(270 65% 22%) 75%,
            hsl(230 70% 16%) 100%
          );
          background-size: 300% 300%;
          animation: gradient-shift 12s ease infinite;
        }
        .dark .hero-gradient-bg {
          background: linear-gradient(
            135deg,
            hsl(250 80% 10%) 0%,
            hsl(260 70% 8%) 25%,
            hsl(240 60% 10%) 50%,
            hsl(270 65% 12%) 75%,
            hsl(230 70% 8%) 100%
          );
          background-size: 300% 300%;
          animation: gradient-shift 12s ease infinite;
        }
        .orb {
          border-radius: 50%;
          filter: blur(80px);
          position: absolute;
          pointer-events: none;
        }
        .gradient-text {
          background: linear-gradient(135deg, #a78bfa 0%, #818cf8 30%, #c084fc 60%, #f0abfc 100%);
          background-size: 200% 200%;
          animation: gradient-text-shift 6s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .popular-card-wrapper {
          position: relative;
          border-radius: 0.5rem;
          padding: 2px;
          background: linear-gradient(135deg, #a78bfa, #818cf8, #c084fc, #a78bfa);
          background-size: 300% 300%;
          animation: gradient-shift 4s ease infinite;
        }
        .popular-card-inner {
          border-radius: calc(0.5rem - 2px);
        }
        .code-header-gradient {
          background: linear-gradient(135deg, hsl(250 60% 30%), hsl(270 50% 35%));
        }
        .dark .code-header-gradient {
          background: linear-gradient(135deg, hsl(250 60% 20%), hsl(270 50% 25%));
        }
      `}</style>

      <div className="min-h-screen bg-background">
        <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 h-16">
              <div className="flex items-center gap-2">
                <img src={ctrxlLogo} alt="CTRXL" className="h-8 w-8 rounded-md object-cover" />
                <span className="font-semibold text-lg tracking-tight" data-testid="text-brand-name">
                  CTRXL LICENSE
                </span>
              </div>
              <div className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="link-nav-features">
                  Features
                </a>
                <a href="#integration" className="text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="link-nav-integration">
                  Integration
                </a>
                <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="link-nav-pricing">
                  Pricing
                </a>
                <a href="/sample" className="text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="link-nav-sample">
                  Sample
                </a>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <div className="hidden sm:flex items-center gap-2">
                  <a href="/auth">
                    <Button variant="ghost" data-testid="button-login">
                      Sign In
                    </Button>
                  </a>
                  <a href="/auth">
                    <Button data-testid="button-get-started">
                      Get Started
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </a>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="md:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  data-testid="button-mobile-menu"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-background px-4 py-4 space-y-3">
              <a
                href="#features"
                className="block text-sm text-muted-foreground hover:text-foreground py-1"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="link-mobile-features"
              >
                Features
              </a>
              <a
                href="#integration"
                className="block text-sm text-muted-foreground hover:text-foreground py-1"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="link-mobile-integration"
              >
                Integration
              </a>
              <a
                href="#pricing"
                className="block text-sm text-muted-foreground hover:text-foreground py-1"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="link-mobile-pricing"
              >
                Pricing
              </a>
              <a
                href="/sample"
                className="block text-sm text-muted-foreground hover:text-foreground py-1"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="link-mobile-sample"
              >
                Sample
              </a>
              <div className="flex flex-col gap-2 pt-2 border-t">
                <a href="/auth">
                  <Button variant="ghost" className="w-full justify-start" data-testid="button-mobile-login">
                    Sign In
                  </Button>
                </a>
                <a href="/auth">
                  <Button className="w-full" data-testid="button-mobile-signup">
                    Get Started
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          )}
        </nav>

        <section className="hero-gradient-bg relative pt-28 sm:pt-36 pb-20 sm:pb-28 px-4 overflow-hidden">
          <div className="orb w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-purple-500/20 top-[-80px] left-[-100px] sm:left-[-150px]" style={{ animation: "float-slow 8s ease-in-out infinite" }} />
          <div className="orb w-[200px] h-[200px] sm:w-[350px] sm:h-[350px] bg-indigo-400/15 top-[20%] right-[-50px] sm:right-[-80px]" style={{ animation: "float-medium 10s ease-in-out infinite" }} />
          <div className="orb w-[150px] h-[150px] sm:w-[250px] sm:h-[250px] bg-fuchsia-500/10 bottom-[-40px] left-[30%]" style={{ animation: "float-reverse 7s ease-in-out infinite" }} />
          <div className="orb w-[100px] h-[100px] sm:w-[180px] sm:h-[180px] bg-violet-400/15 top-[60%] left-[10%]" style={{ animation: "float-medium 9s ease-in-out infinite 2s" }} />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center max-w-3xl mx-auto space-y-6 sm:space-y-8">
              <div className="animate-fade-in">
                <Badge variant="secondary" className="mb-6 bg-white/10 text-white/90 border-white/20">
                  <Zap className="h-3 w-3 mr-1" />
                  Enterprise License Management
                </Badge>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] font-serif text-white animate-fade-in stagger-1">
                Manage Your
                <br />
                <span className="gradient-text">Software Licenses</span>
                <br />
                With Confidence
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed animate-fade-in stagger-2">
                A powerful license management platform with domain binding for software developers. Generate, validate, and track licenses with a simple REST API.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 animate-fade-in stagger-3">
                <a href="/auth" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-gray-900 border-white/80" data-testid="button-hero-cta">
                    Start Free
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </a>
                <a href="#integration" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white/30 bg-white/5 backdrop-blur-sm" data-testid="button-view-docs">
                    <Code2 className="mr-1 h-4 w-4" />
                    View Docs
                  </Button>
                </a>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-5 text-sm text-white/60 animate-fade-in stagger-4">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Free forever plan
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Domain binding included
                </span>
              </div>
            </div>

            <div className="mt-12 sm:mt-16 max-w-2xl mx-auto animate-fade-in stagger-5">
              <Card className="overflow-visible bg-background/95 dark:bg-card/95 backdrop-blur-xl border-white/10">
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-mono text-muted-foreground">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">POST</span>
                    <span>/api/v1/licenses/validate</span>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3 sm:p-4 font-mono text-xs sm:text-sm overflow-x-auto">
                    <pre className="text-muted-foreground">
{`{
  "license_key": "CL-X7K-M3P-R9N-Q2L",
  "product_id": "prod_abc123",
  "domain": "myapp.com"
}`}
                    </pre>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm font-mono text-muted-foreground">
                    <Badge variant="secondary" className="font-mono text-xs">200</Badge>
                    <span>Response</span>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3 sm:p-4 font-mono text-xs sm:text-sm overflow-x-auto">
                    <pre className="text-muted-foreground">
{`{
  "valid": true,
  "license": {
    "type": "professional",
    "status": "active",
    "expires_at": "2027-01-15",
    "activations": 1,
    "max_activations": 5
  }
}`}
                    </pre>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 sm:py-28 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14 sm:mb-20">
              <Badge variant="secondary" className="mb-4">
                <RefreshCw className="h-3 w-3 mr-1" />
                Features
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif tracking-tight" data-testid="text-features-heading">
                Everything You Need
              </h2>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
                Full-featured license management with developer-friendly tools
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                {
                  icon: Key,
                  title: "License Generation",
                  description:
                    "Generate unique license keys with customizable formats. Support for standard, trial, and enterprise license types.",
                  color: "from-violet-500 to-purple-600",
                },
                {
                  icon: Shield,
                  title: "Activation Control",
                  description:
                    "Set max activations per license. Track machine IDs and manage device limits with ease.",
                  color: "from-blue-500 to-indigo-600",
                },
                {
                  icon: Globe,
                  title: "Domain Binding",
                  description:
                    "Bind licenses to specific domains. Prevent unauthorized usage by restricting which domains can use a license.",
                  color: "from-cyan-500 to-teal-600",
                },
                {
                  icon: BarChart3,
                  title: "Analytics Dashboard",
                  description:
                    "Real-time statistics on license usage, activation trends, and revenue metrics at a glance.",
                  color: "from-orange-500 to-amber-600",
                },
                {
                  icon: Code2,
                  title: "REST API",
                  description:
                    "Full-featured REST API with documentation for PHP, Next.js, Python, and more frameworks.",
                  color: "from-emerald-500 to-green-600",
                },
                {
                  icon: Lock,
                  title: "Secure by Default",
                  description:
                    "API key authentication, rate limiting, and audit logs for all license operations.",
                  color: "from-rose-500 to-pink-600",
                },
              ].map((feature, index) => (
                <Card key={feature.title} className={`p-5 sm:p-6 hover-elevate animate-fade-in stagger-${index + 1}`} data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className={`h-10 w-10 rounded-md bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="integration" className="py-20 sm:py-28 px-4 bg-card/40">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14 sm:mb-20">
              <Badge variant="secondary" className="mb-4">
                <Code2 className="h-3 w-3 mr-1" />
                Integration
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif tracking-tight" data-testid="text-integration-heading">
                Easy Integration
              </h2>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
                Add license validation to your app in minutes with our SDK
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              <Card className="overflow-visible" data-testid="card-integration-php">
                <div className="code-header-gradient rounded-t-md px-4 sm:px-5 py-3 flex flex-wrap items-center gap-2">
                  <span className="text-white font-semibold text-sm">PHP</span>
                  <span className="text-white/60 text-xs">Laravel / WordPress / Custom</span>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="bg-muted/50 rounded-md p-3 sm:p-4 font-mono text-xs sm:text-sm overflow-x-auto">
                    <pre className="text-muted-foreground">
{`<?php
$response = CTRXLLicense::validate([
    'license_key' => $key,
    'product_id'  => 'your_product',
    'domain'      => $_SERVER['HTTP_HOST']
]);

if ($response->valid) {
    // License is active
    echo "Licensed to: " 
         . $response->license->customer;
}`}
                    </pre>
                  </div>
                </div>
              </Card>
              <Card className="overflow-visible" data-testid="card-integration-nextjs">
                <div className="code-header-gradient rounded-t-md px-4 sm:px-5 py-3 flex flex-wrap items-center gap-2">
                  <span className="text-white font-semibold text-sm">Next.js</span>
                  <span className="text-white/60 text-xs">React / Node.js / TypeScript</span>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="bg-muted/50 rounded-md p-3 sm:p-4 font-mono text-xs sm:text-sm overflow-x-auto">
                    <pre className="text-muted-foreground">
{`import { CTRXLLicense } from 'ctrxl';

const client = new CTRXLLicense({
  apiKey: process.env.CL_API_KEY
});

const result = await client.validate({
  licenseKey: key,
  productId: 'your_product',
  domain: request.headers.host
});

if (result.valid) {
  console.log('Licensed!');
}`}
                    </pre>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20 sm:py-28 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14 sm:mb-20">
              <Badge variant="secondary" className="mb-4">
                <Zap className="h-3 w-3 mr-1" />
                Pricing
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif tracking-tight" data-testid="text-pricing-heading">
                Simple Pricing
              </h2>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
                Start free, upgrade when you need more
              </p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto items-start">
              {[
                {
                  name: "Free",
                  price: "$0",
                  description: "For side projects",
                  features: ["1 Product", "100 Licenses", "1,000 API calls/mo", "Domain binding", "Community support"],
                },
                {
                  name: "Pro",
                  price: "$29",
                  description: "For growing teams",
                  features: ["10 Products", "10,000 Licenses", "100,000 API calls/mo", "Domain binding", "Priority support", "Webhooks"],
                  popular: true,
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  description: "For large orgs",
                  features: ["Unlimited Products", "Unlimited Licenses", "Unlimited API calls", "Domain binding", "Dedicated support", "SLA"],
                },
              ].map((plan) => {
                const cardContent = (
                  <div className={`p-5 sm:p-6 flex flex-col h-full ${plan.popular ? "popular-card-inner bg-background dark:bg-card" : ""}`}>
                    {plan.popular && (
                      <Badge className="self-start mb-4" data-testid="badge-popular">Most Popular</Badge>
                    )}
                    <h3 className="font-semibold text-xl" data-testid={`text-plan-name-${plan.name.toLowerCase()}`}>{plan.name}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>
                    <div className="mt-4 mb-6">
                      <span className="text-3xl sm:text-4xl font-bold">{plan.price}</span>
                      {plan.price !== "Custom" && (
                        <span className="text-muted-foreground">/mo</span>
                      )}
                    </div>
                    <ul className="space-y-2.5 mb-8 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-chart-2 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {plan.name === "Free" ? (
                      <a href="/auth">
                        <Button
                          className="w-full"
                          variant="outline"
                          data-testid={`button-plan-${plan.name.toLowerCase()}`}
                        >
                          Get Started
                        </Button>
                      </a>
                    ) : (
                      <a href="https://t.me/lutaubos" target="_blank" rel="noopener noreferrer">
                        <Button
                          className="w-full"
                          variant={plan.popular ? "default" : "outline"}
                          data-testid={`button-plan-${plan.name.toLowerCase()}`}
                        >
                          <Send className="h-4 w-4 mr-1.5" />
                          Contact via Telegram
                        </Button>
                      </a>
                    )}
                  </div>
                );

                if (plan.popular) {
                  return (
                    <div key={plan.name} className="popular-card-wrapper" data-testid={`card-plan-${plan.name.toLowerCase()}`}>
                      {cardContent}
                    </div>
                  );
                }

                return (
                  <Card key={plan.name} className="p-0 flex flex-col" data-testid={`card-plan-${plan.name.toLowerCase()}`}>
                    {cardContent}
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="py-10 sm:py-14 px-4 border-t">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={ctrxlLogo} alt="CTRXL" className="h-6 w-6 rounded-md object-cover" />
              <span className="font-semibold text-sm" data-testid="text-footer-brand">CTRXL LICENSE</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors" data-testid="link-footer-features">Features</a>
              <a href="#integration" className="hover:text-foreground transition-colors" data-testid="link-footer-integration">Integration</a>
              <a href="#pricing" className="hover:text-foreground transition-colors" data-testid="link-footer-pricing">Pricing</a>
              <a href="/sample" className="hover:text-foreground transition-colors" data-testid="link-footer-sample">Sample</a>
            </div>
            <p className="text-sm text-muted-foreground" data-testid="text-copyright">
              &copy; {new Date().getFullYear()} CTRXL LICENSE. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
