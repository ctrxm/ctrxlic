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
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Webhook,
  Plus,
  Trash2,
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Webhook as WebhookType } from "@shared/schema";

interface WebhookDelivery {
  id: string;
  event: string;
  statusCode: number | null;
  success: boolean;
  createdAt: string;
}

const WEBHOOK_EVENTS = [
  { value: "license.created", label: "License Created" },
  { value: "license.activated", label: "License Activated" },
  { value: "license.revoked", label: "License Revoked" },
  { value: "license.expired", label: "License Expired" },
  { value: "license.transferred", label: "License Transferred" },
];

const createWebhookSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  events: z.array(z.string()).min(1, "Select at least one event"),
  secret: z.string().optional(),
});

type CreateWebhookForm = z.infer<typeof createWebhookSchema>;

export default function WebhooksPage() {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: webhooksList, isLoading } = useQuery<WebhookType[]>({
    queryKey: ["/api/webhooks"],
  });

  const form = useForm<CreateWebhookForm>({
    resolver: zodResolver(createWebhookSchema),
    defaultValues: { url: "", events: [], secret: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateWebhookForm) => {
      const res = await apiRequest("POST", "/api/webhooks", {
        ...data,
        isActive: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      toast({ title: "Webhook created" });
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/webhooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      toast({ title: "Webhook deleted" });
    },
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Receive real-time notifications when license events occur
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-webhook">
              <Plus className="h-4 w-4 mr-1" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((d) => createMutation.mutate(d))}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endpoint URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com/webhook" data-testid="input-webhook-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="events"
                  render={() => (
                    <FormItem>
                      <FormLabel>Events</FormLabel>
                      <div className="space-y-2">
                        {WEBHOOK_EVENTS.map((event) => (
                          <FormField
                            key={event.value}
                            control={form.control}
                            name="events"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(event.value)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, event.value]);
                                      } else {
                                        field.onChange(current.filter((v: string) => v !== event.value));
                                      }
                                    }}
                                    data-testid={`checkbox-event-${event.value}`}
                                  />
                                </FormControl>
                                <span className="text-sm">{event.label}</span>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Signing Secret (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="whsec_..." data-testid="input-webhook-secret" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                  data-testid="button-submit-webhook"
                >
                  {createMutation.isPending ? "Creating..." : "Create Webhook"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-md" />
          ))}
        </div>
      ) : !webhooksList || webhooksList.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center">
          <Globe className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-1">No webhooks</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Add a webhook to receive notifications when license events occur
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {webhooksList.map((webhook) => (
            <WebhookCard
              key={webhook.id}
              webhook={webhook}
              expanded={expandedId === webhook.id}
              onToggle={() => setExpandedId(expandedId === webhook.id ? null : webhook.id)}
              onDelete={() => deleteMutation.mutate(webhook.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WebhookCard({
  webhook,
  expanded,
  onToggle,
  onDelete,
}: {
  webhook: WebhookType;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { data: deliveries } = useQuery<WebhookDelivery[]>({
    queryKey: ["/api/webhooks", webhook.id, "deliveries"],
    queryFn: async () => {
      const res = await fetch(`/api/webhooks/${webhook.id}/deliveries`);
      return res.json();
    },
    enabled: expanded,
  });

  return (
    <Card className="p-4" data-testid={`card-webhook-${webhook.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Webhook className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-xs sm:text-sm font-mono truncate">{webhook.url}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {webhook.events.map((e) => (
                <Badge key={e} variant="secondary" className="text-[10px]">{e}</Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={onToggle} data-testid={`button-toggle-webhook-${webhook.id}`}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete} data-testid={`button-delete-webhook-${webhook.id}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Recent Deliveries</h4>
          {!deliveries || deliveries.length === 0 ? (
            <p className="text-xs text-muted-foreground">No deliveries yet</p>
          ) : (
            <div className="space-y-2">
              {deliveries.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2 text-xs p-2 rounded-md bg-background">
                  <div className="flex items-center gap-2">
                    {d.success ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span className="font-medium">{d.event}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={d.success ? "secondary" : "destructive"} className="text-[10px]">
                      {d.statusCode || "Failed"}
                    </Badge>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(d.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
