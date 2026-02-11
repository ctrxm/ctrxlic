import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Key,
  Shield,
  Calendar,
  User,
  Globe,
  Zap,
} from "lucide-react";

interface PortalLicense {
  licenseKey: string;
  productName: string;
  type: string;
  status: string;
  customerName: string | null;
  maxActivations: number;
  currentActivations: number;
  allowedDomains: string[] | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function CustomerPortalPage() {
  const [email, setEmail] = useState("");
  const [licensesList, setLicensesList] = useState<PortalLicense[] | null>(null);
  const { toast } = useToast();

  const lookupMutation = useMutation({
    mutationFn: async (emailInput: string) => {
      const res = await apiRequest("POST", "/api/portal/licenses", { email: emailInput });
      return res.json();
    },
    onSuccess: (data: PortalLicense[]) => {
      setLicensesList(data);
      if (data.length === 0) {
        toast({ title: "No licenses found for this email" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const statusColor = (s: string) => {
    if (s === "active") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    if (s === "expired") return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    return "bg-red-500/10 text-red-600 dark:text-red-400";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Customer Portal</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Look up your licenses by email address
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                type="email"
                className="pl-9"
                onKeyDown={(e) => { if (e.key === "Enter" && email) lookupMutation.mutate(email); }}
                data-testid="input-portal-email"
              />
            </div>
            <Button
              onClick={() => lookupMutation.mutate(email)}
              disabled={!email || lookupMutation.isPending}
              data-testid="button-lookup-licenses"
            >
              {lookupMutation.isPending ? "Searching..." : "Look Up Licenses"}
            </Button>
          </div>
        </Card>

        {licensesList !== null && (
          licensesList.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center">
              <Key className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-1">No licenses found</h3>
              <p className="text-muted-foreground text-sm">
                No licenses are associated with this email address
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {licensesList.length} license{licensesList.length !== 1 ? "s" : ""} found
              </h2>
              {licensesList.map((license) => (
                <Card key={license.licenseKey} className="p-4 sm:p-5" data-testid={`card-portal-license-${license.licenseKey}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="font-semibold text-sm sm:text-base">{license.productName}</p>
                      <code className="text-xs font-mono text-muted-foreground">{license.licenseKey}</code>
                    </div>
                    <Badge className={statusColor(license.status)}>
                      {license.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Type: <span className="text-foreground capitalize">{license.type}</span></span>
                    </div>
                    {license.customerName && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{license.customerName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Zap className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Activations: <span className="text-foreground">{license.currentActivations}/{license.maxActivations}</span></span>
                    </div>
                    {license.expiresAt && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>Expires: <span className="text-foreground">{new Date(license.expiresAt).toLocaleDateString()}</span></span>
                      </div>
                    )}
                    {license.allowedDomains && license.allowedDomains.length > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                        <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>Domains: <span className="text-foreground">{license.allowedDomains.join(", ")}</span></span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
