import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Key, ArrowLeft, Shield, Zap, Globe } from "lucide-react";
import ctrxlLogo from "@/assets/images/ctrxl-logo.png";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body: any = { email, password };
      if (mode === "signup") {
        body.firstName = firstName;
        body.lastName = lastName;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.message, variant: "destructive" });
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.href = "/dashboard";
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Key, title: "License Management", desc: "Issue and manage software licenses with ease" },
    { icon: Shield, title: "Secure & Reliable", desc: "Enterprise-grade security for your products" },
    { icon: Zap, title: "Instant Activation", desc: "Real-time license validation and activation" },
    { icon: Globe, title: "Global Reach", desc: "Distribute licenses to customers worldwide" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b bg-background/80 backdrop-blur-md lg:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 h-14">
            <a href="/" className="flex items-center gap-2" data-testid="link-brand-mobile">
              <img src={ctrxlLogo} alt="CTRXL" className="h-7 w-7 rounded-md object-cover" />
              <span className="font-semibold text-base tracking-tight">CTRXL LICENSE</span>
            </a>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(250 80% 58%), hsl(270 70% 50%), hsl(290 60% 45%))" }}>
          <div className="absolute top-6 left-6 z-10">
            <a href="/" className="flex items-center gap-2" data-testid="link-brand-desktop">
              <img src={ctrxlLogo} alt="CTRXL" className="h-8 w-8 rounded-md object-cover" />
              <span className="font-semibold text-lg tracking-tight text-white">CTRXL LICENSE</span>
            </a>
          </div>

          <div className="absolute top-6 right-6 z-10">
            <ThemeToggle />
          </div>

          <div className="absolute top-20 left-16 w-32 h-32 rounded-full bg-white/10 blur-xl" />
          <div className="absolute top-48 right-12 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute bottom-32 left-24 w-24 h-24 rounded-full bg-white/10 blur-lg" />
          <div className="absolute bottom-12 right-32 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute top-1/3 left-1/2 w-16 h-16 rounded-md bg-white/10 rotate-45 blur-sm" />
          <div className="absolute bottom-1/4 left-1/3 w-12 h-12 rounded-md bg-white/15 rotate-12 blur-sm" />

          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 py-16 w-full">
            <div className="animate-fade-in">
              <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
                Software Licensing,<br />Simplified.
              </h2>
              <p className="text-white/80 text-base xl:text-lg mb-12 max-w-md">
                The complete platform for managing, distributing, and validating software licenses at any scale.
              </p>
            </div>

            <div className="space-y-5">
              {features.map((feature, i) => (
                <div
                  key={feature.title}
                  className={`flex items-start gap-4 animate-fade-in stagger-${i + 1}`}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-md bg-white/15 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">{feature.title}</h3>
                    <p className="text-white/65 text-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
          <div className="w-full max-w-md animate-fade-in">
            <Card className="overflow-visible relative">
              <div className="h-1 w-full rounded-t-md" style={{ background: "linear-gradient(90deg, hsl(250 80% 58%), hsl(270 70% 50%), hsl(290 60% 45%))" }} />
              <div className="p-6 space-y-6">
                <div className="text-center space-y-2">
                  <img src={ctrxlLogo} alt="CTRXL" className="h-12 w-12 rounded-md object-cover mx-auto" />
                  <h1 className="text-2xl font-bold tracking-tight" data-testid="text-auth-title">
                    {mode === "login" ? "Sign In" : "Create Account"}
                  </h1>
                  <p className="text-sm text-muted-foreground" data-testid="text-auth-subtitle">
                    {mode === "login"
                      ? "Enter your credentials to access your dashboard"
                      : "Sign up for a free account to get started"}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "signup" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="John"
                          data-testid="input-auth-firstname"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Doe"
                          data-testid="input-auth-lastname"
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      data-testid="input-auth-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                      data-testid="input-auth-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading} data-testid="button-auth-submit">
                    {loading
                      ? mode === "login"
                        ? "Signing in..."
                        : "Creating account..."
                      : mode === "login"
                        ? "Sign In"
                        : "Create Account"}
                  </Button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                  {mode === "login" ? (
                    <p>
                      Don't have an account?{" "}
                      <button
                        onClick={() => setMode("signup")}
                        className="text-primary underline"
                        data-testid="link-switch-signup"
                      >
                        Sign up
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{" "}
                      <button
                        onClick={() => setMode("login")}
                        className="text-primary underline"
                        data-testid="link-switch-login"
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                </div>

                <div className="text-center">
                  <a href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground" data-testid="link-back-home">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to home
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
