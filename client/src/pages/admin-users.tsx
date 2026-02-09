import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, Shield, ShieldOff, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/models/auth";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") setLocation("/dashboard");
  }, [currentUser, setLocation]);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const toggleRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      await apiRequest("PATCH", `/api/admin/users/${id}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Role updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update role", description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "User deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete user", description: error.message, variant: "destructive" });
    },
  });

  if (!currentUser || currentUser.role !== "admin") return null;

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-admin-users-title">All Users</h1>
        <p className="text-muted-foreground mt-1">
          Manage users and their roles
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-md" />
      ) : !users || users.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-1">No users yet</h3>
          <p className="text-muted-foreground text-sm">
            Users will appear here once they sign in
          </p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const initials = `${(u.firstName || "")[0] || ""}${(u.lastName || "")[0] || ""}`.toUpperCase() || "U";
                  const isSelf = u.id === currentUser?.id;
                  const isUserAdmin = u.role === "admin";
                  return (
                    <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={u.profileImageUrl || undefined} />
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {u.firstName} {u.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.email || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isUserAdmin ? "default" : "secondary"}
                          className="text-xs capitalize"
                        >
                          {u.role || "user"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isSelf || toggleRoleMutation.isPending}
                            onClick={() =>
                              toggleRoleMutation.mutate({
                                id: u.id,
                                role: isUserAdmin ? "user" : "admin",
                              })
                            }
                            data-testid={`button-toggle-role-${u.id}`}
                          >
                            {isUserAdmin ? (
                              <ShieldOff className="h-4 w-4 mr-1" />
                            ) : (
                              <Shield className="h-4 w-4 mr-1" />
                            )}
                            {isUserAdmin ? "Demote" : "Promote"}
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={isSelf}
                                data-testid={`button-delete-user-${u.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete {u.firstName} {u.lastName} ({u.email}) and all their data including products, licenses, and API keys. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUserMutation.mutate(u.id)}
                                  className="bg-destructive text-destructive-foreground"
                                  data-testid={`button-confirm-delete-${u.id}`}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
    </div>
  );
}
