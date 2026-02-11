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
              <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Features
              </a>
              <a href="#integration" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Integration
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Pricing
              </a>
              <a href="/sample" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
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
            >
              Features
            </a>
            <a
              href="#integration"
              className="block text-sm text-muted-foreground hover:text-foreground py-1"
              onClick={() => setMobileMenuOpen(false)}
            >
              Integration
            </a>
            <a
              href="#pricing"
              className="block text-sm text-muted-foreground hover:text-foreground py-1"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <a
              href="/sample"
              className="block text-sm text-muted-foreground hover:text-foreground py-1"
              onClick={() => setMobileMenuOpen(false)}
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

      <section className="pt-28 sm:pt-32 pb-16 sm:pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8">
              <div>
                <Badge variant="secondary" className="mb-4">
                  <Zap className="h-3 w-3 mr-1" />
                  Enterprise License Management
                </Badge>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight font-serif">
                  Manage Your
                  <br />
                  <span className="text-primary">Software Licenses</span>
                  <br />
                  With Confidence
                </h1>
                <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed">
                  A powerful license management platform with domain binding for software developers. Generate, validate, and track licenses with a simple REST API.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                <a href="/auth" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto" data-testid="button-hero-cta">
                    Start Free
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </a>
                <a href="#integration" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-view-docs">
                    <Code2 className="mr-1 h-4 w-4" />
                    View Docs
                  </Button>
                </a>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-chart-2" />
                  Free forever plan
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-chart-2" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-chart-2" />
                  Domain binding included
                </span>
              </div>
            </div>
            <div className="hidden lg:block">
              <Card className="p-6 bg-card/80 backdrop-blur">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                    <span className="text-chart-2">POST</span>
                    <span>/api/v1/licenses/validate</span>
                  </div>
                  <div className="bg-background rounded-md p-4 font-mono text-sm overflow-x-auto">
                    <pre className="text-muted-foreground">
{`{
  "license_key": "CL-X7K-M3P-R9N-Q2L",
  "product_id": "prod_abc123",
  "domain": "myapp.com"
}`}
                    </pre>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                    <Badge variant="secondary" className="font-mono text-xs">200</Badge>
                    <span>Response</span>
                  </div>
                  <div className="bg-background rounded-md p-4 font-mono text-sm overflow-x-auto">
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
        </div>
      </section>

      <section id="features" className="py-16 sm:py-20 px-4 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif tracking-tight">
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
              },
              {
                icon: Shield,
                title: "Activation Control",
                description:
                  "Set max activations per license. Track machine IDs and manage device limits with ease.",
              },
              {
                icon: Globe,
                title: "Domain Binding",
                description:
                  "Bind licenses to specific domains. Prevent unauthorized usage by restricting which domains can use a license.",
              },
              {
                icon: BarChart3,
                title: "Analytics Dashboard",
                description:
                  "Real-time statistics on license usage, activation trends, and revenue metrics at a glance.",
              },
              {
                icon: Code2,
                title: "REST API",
                description:
                  "Full-featured REST API with documentation for PHP, Next.js, Python, and more frameworks.",
              },
              {
                icon: Lock,
                title: "Secure by Default",
                description:
                  "API key authentication, rate limiting, and audit logs for all license operations.",
              },
            ].map((feature) => (
              <Card key={feature.title} className="p-5 sm:p-6 hover-elevate">
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-primary" />
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

      <section id="integration" className="py-16 sm:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif tracking-tight">
              Easy Integration
            </h2>
            <p className="mt-4 text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Add license validation to your app in minutes with our SDK
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <Card className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="secondary">PHP</Badge>
                <span className="text-sm text-muted-foreground">Laravel / WordPress / Custom</span>
              </div>
              <div className="bg-background rounded-md p-3 sm:p-4 font-mono text-xs sm:text-sm overflow-x-auto">
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
            </Card>
            <Card className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="secondary">Next.js</Badge>
                <span className="text-sm text-muted-foreground">React / Node.js / TypeScript</span>
              </div>
              <div className="bg-background rounded-md p-3 sm:p-4 font-mono text-xs sm:text-sm overflow-x-auto">
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
            </Card>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-16 sm:py-20 px-4 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif tracking-tight">
              Simple Pricing
            </h2>
            <p className="mt-4 text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Start free, upgrade when you need more
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
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
            ].map((plan) => (
              <Card
                key={plan.name}
                className={`p-5 sm:p-6 flex flex-col ${plan.popular ? "border-primary ring-1 ring-primary/20" : ""}`}
              >
                {plan.popular && (
                  <Badge className="self-start mb-4">Most Popular</Badge>
                )}
                <h3 className="font-semibold text-xl">{plan.name}</h3>
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
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 sm:py-12 px-4 border-t">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={ctrxlLogo} alt="CTRXL" className="h-6 w-6 rounded-md object-cover" />
            <span className="font-semibold text-sm">CTRXL LICENSE</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} CTRXL LICENSE. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
