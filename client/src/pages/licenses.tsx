import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Key,
  Plus,
  Search,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Trash2,
  ArrowRightLeft,
  RotateCcw,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { License, Product } from "@shared/schema";

const generateLicenseSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  type: z.string().min(1, "Type is required"),
  customerName: z.string().optional(),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  maxActivations: z.coerce.number().min(1).default(1),
  expiresAt: z.string().optional(),
  allowedDomains: z.string().optional(),
});

type GenerateLicenseForm = z.infer<typeof generateLicenseSchema>;

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  active: { label: "Active", icon: CheckCircle2, className: "text-chart-2" },
  expired: { label: "Expired", icon: Clock, className: "text-chart-4" },
  revoked: { label: "Revoked", icon: XCircle, className: "text-destructive" },
  suspended: { label: "Suspended", icon: AlertCircle, className: "text-chart-4" },
};

export default function LicensesPage() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [transferId, setTransferId] = useState<string | null>(null);
  const [transferName, setTransferName] = useState("");
  const [transferEmail, setTransferEmail] = useState("");
  const [renewId, setRenewId] = useState<string | null>(null);
  const [renewDate, setRenewDate] = useState("");
  const { toast } = useToast();
  const { t } = useI18n();

  const { data: licenses, isLoading } = useQuery<(License & { productName?: string })[]>({
    queryKey: ["/api/licenses"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const form = useForm<GenerateLicenseForm>({
    resolver: zodResolver(generateLicenseSchema),
    defaultValues: { productId: "", type: "standard", customerName: "", customerEmail: "", maxActivations: 1, expiresAt: "", allowedDomains: "" },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: GenerateLicenseForm) => {
      const domains = data.allowedDomains
        ? data.allowedDomains.split(",").map((d) => d.trim()).filter(Boolean)
        : undefined;
      const payload = {
        ...data,
        expiresAt: data.expiresAt || undefined,
        customerEmail: data.customerEmail || undefined,
        allowedDomains: domains && domains.length > 0 ? domains : undefined,
      };
      const res = await apiRequest("POST", "/api/licenses", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "License generated successfully" });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/licenses/${id}/revoke`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "License revoked" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/licenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "License deleted" });
    },
  });

  const transferMutation = useMutation({
    mutationFn: async ({ id, toName, toEmail }: { id: string; toName: string; toEmail: string }) => {
      await apiRequest("POST", `/api/licenses/${id}/transfer`, { toName, toEmail });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses"] });
      toast({ title: "License transferred successfully" });
      setTransferId(null);
      setTransferName("");
      setTransferEmail("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const renewMutation = useMutation({
    mutationFn: async ({ id, expiresAt }: { id: string; expiresAt: string }) => {
      await apiRequest("POST", `/api/licenses/${id}/renew`, { expiresAt });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({ title: t("licenses.renewSuccess") });
      setRenewId(null);
      setRenewDate("");
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "License key copied" });
  };

  const filtered = licenses?.filter((l) => {
    const matchesSearch =
      l.licenseKey.toLowerCase().includes(search.toLowerCase()) ||
      (l.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.customerEmail || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Licenses</h1>
          <p className="text-muted-foreground mt-1">
            Generate and manage software licenses
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-generate-license">
              <Plus className="h-4 w-4 mr-1" />
              Generate License
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Generate New License</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((d) => generateMutation.mutate(d))}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-license-product">
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products?.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-license-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="John Doe" data-testid="input-customer-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Email</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="john@example.com" data-testid="input-customer-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maxActivations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Activations</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} data-testid="input-max-activations" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expiresAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expires At</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-expires-at" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="allowedDomains"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Allowed Domains</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="example.com, app.example.com"
                            {...field}
                            data-testid="input-allowed-domains"
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Comma-separated list of domains. Leave empty for no restriction.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={generateMutation.isPending}
                  data-testid="button-submit-license"
                >
                  {generateMutation.isPending ? "Generating..." : "Generate License"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search licenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-licenses"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-md" />
      ) : !filtered || filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-1">No licenses found</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {search || statusFilter !== "all" ? "Try adjusting your filters" : "Generate your first license to get started"}
          </p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License Key</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Activations</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((license) => {
                  const config = statusConfig[license.status] || statusConfig.active;
                  const StatusIcon = config.icon;
                  return (
                    <TableRow key={license.id} data-testid={`row-license-${license.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                            {license.licenseKey}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyKey(license.licenseKey, license.id)}
                            data-testid={`button-copy-license-${license.id}`}
                          >
                            {copiedId === license.id ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{license.productName || license.productId}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs capitalize">{license.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {license.customerName || "-"}
                          {license.customerEmail && (
                            <p className="text-xs text-muted-foreground">{license.customerEmail}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <StatusIcon className={`h-3.5 w-3.5 ${config.className}`} />
                          <span className="text-sm capitalize">{license.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {license.currentActivations}/{license.maxActivations}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {license.expiresAt
                          ? new Date(license.expiresAt).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {(license.status === "active" || license.status === "expired") && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setRenewId(license.id);
                                const defaultDate = new Date();
                                defaultDate.setFullYear(defaultDate.getFullYear() + 1);
                                setRenewDate(defaultDate.toISOString().split("T")[0]);
                              }}
                              data-testid={`button-renew-${license.id}`}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {license.status === "active" && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setTransferId(license.id);
                                  setTransferName(license.customerName || "");
                                  setTransferEmail(license.customerEmail || "");
                                }}
                                data-testid={`button-transfer-${license.id}`}
                              >
                                <ArrowRightLeft className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => revokeMutation.mutate(license.id)}
                                data-testid={`button-revoke-${license.id}`}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(license.id)}
                            data-testid={`button-delete-license-${license.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={!!renewId} onOpenChange={(v) => { if (!v) { setRenewId(null); setRenewDate(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("licenses.renewTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("licenses.renewDesc")}</p>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("licenses.newExpiryDate")}</label>
              <Input
                type="date"
                value={renewDate}
                onChange={(e) => setRenewDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                data-testid="input-renew-date"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (renewId && renewDate) {
                  renewMutation.mutate({ id: renewId, expiresAt: renewDate });
                }
              }}
              disabled={!renewDate || renewMutation.isPending}
              data-testid="button-submit-renew"
            >
              {renewMutation.isPending ? t("licenses.renewing") : t("licenses.renew")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!transferId} onOpenChange={(v) => { if (!v) setTransferId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer License</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">New Owner Name</label>
              <Input
                value={transferName}
                onChange={(e) => setTransferName(e.target.value)}
                placeholder="Customer name"
                data-testid="input-transfer-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">New Owner Email</label>
              <Input
                type="email"
                value={transferEmail}
                onChange={(e) => setTransferEmail(e.target.value)}
                placeholder="customer@example.com"
                data-testid="input-transfer-email"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (transferId && transferName && transferEmail) {
                  transferMutation.mutate({ id: transferId, toName: transferName, toEmail: transferEmail });
                }
              }}
              disabled={!transferName || !transferEmail || transferMutation.isPending}
              data-testid="button-submit-transfer"
            >
              {transferMutation.isPending ? "Transferring..." : "Transfer License"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
