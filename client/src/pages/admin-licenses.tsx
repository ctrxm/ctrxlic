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
import { Key } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import type { License } from "@shared/schema";

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "active") return "default";
  if (status === "revoked") return "destructive";
  if (status === "expired") return "secondary";
  return "outline";
}

export default function AdminLicensesPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && user.role !== "admin") setLocation("/dashboard");
  }, [user, setLocation]);

  if (!user || user.role !== "admin") return null;

  const { data: licenses, isLoading } = useQuery<(License & { productName?: string })[]>({
    queryKey: ["/api/admin/licenses"],
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-admin-licenses-title">All Licenses</h1>
        <p className="text-muted-foreground mt-1">
          View all licenses across all users
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-md" />
      ) : !licenses || licenses.length === 0 ? (
        <Card className="p-12 text-center">
          <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-1">No licenses yet</h3>
          <p className="text-muted-foreground text-sm">
            Licenses will appear here once users create them
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
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Activations</TableHead>
                  <TableHead>Domains</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((license) => (
                  <TableRow key={license.id} data-testid={`row-license-${license.id}`}>
                    <TableCell className="font-mono text-sm">
                      {license.licenseKey}
                    </TableCell>
                    <TableCell className="text-sm">
                      {license.productName || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>
                        <span>{license.customerName || "-"}</span>
                        {license.customerEmail && (
                          <span className="block text-xs text-muted-foreground">{license.customerEmail}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{license.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(license.status)} className="text-xs capitalize">
                        {license.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {license.currentActivations}/{license.maxActivations}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {license.allowedDomains && license.allowedDomains.length > 0
                        ? license.allowedDomains.join(", ")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {license.createdAt
                        ? new Date(license.createdAt).toLocaleDateString()
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
