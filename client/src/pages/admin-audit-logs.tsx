import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import type { AuditLog } from "@shared/schema";

function getActionBadgeVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action.includes("deleted") || action.includes("revoked")) return "destructive";
  if (action.includes("created")) return "default";
  if (action.includes("validated")) return "outline";
  return "secondary";
}

function formatAction(action: string): string {
  return action.replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminAuditLogsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && user.role !== "admin") setLocation("/dashboard");
  }, [user, setLocation]);

  if (!user || user.role !== "admin") return null;

  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/admin/audit-logs"],
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-audit-logs-title">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">
          Track all system activities and changes
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-md" />
      ) : !logs || logs.length === 0 ? (
        <Card className="p-12 text-center">
          <ScrollText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-1">No audit logs yet</h3>
          <p className="text-muted-foreground text-sm">
            Activity logs will appear here as users interact with the system
          </p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} data-testid={`row-audit-${log.id}`}>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)} className="text-xs">
                        {formatAction(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="text-muted-foreground">{log.entityType}</span>
                      {log.entityId && (
                        <span className="text-xs text-muted-foreground block font-mono truncate max-w-[120px]">
                          {log.entityId}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground truncate max-w-[120px]">
                      {log.userId || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                      {log.details ? (
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded break-all">
                          {JSON.stringify(log.details)}
                        </code>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.ipAddress || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {log.createdAt
                        ? new Date(log.createdAt).toLocaleString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
