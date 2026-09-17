"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Shield, ArrowUpCircle, ArrowDownCircle, Crown, X } from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
  isActive: boolean;
  createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  MANAGER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  STAFF: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  ADMIN: <Crown className="h-3.5 w-3.5" />,
  MANAGER: <Shield className="h-3.5 w-3.5" />,
  STAFF: <Users className="h-3.5 w-3.5" />,
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [newRole, setNewRole] = useState<"MANAGER" | "STAFF">("STAFF");
  const [updating, setUpdating] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ data: UserItem[] }>("/users");
      setUsers(data.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openRoleDialog = (user: UserItem, role: "MANAGER" | "STAFF") => {
    setSelectedUser(user);
    setNewRole(role);
    setDialogOpen(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    setUpdating(true);
    try {
      await api.patch(`/users/${selectedUser.id}/role`, { role: newRole });
      setDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setUpdating(false);
    }
  };

  const roleCounts = {
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
    MANAGER: users.filter((u) => u.role === "MANAGER").length,
    STAFF: users.filter((u) => u.role === "STAFF").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">{users.length} users</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { role: "ADMIN", label: "Admins", color: "bg-red-500/10 text-red-600 dark:text-red-400", count: roleCounts.ADMIN },
          { role: "MANAGER", label: "Managers", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", count: roleCounts.MANAGER },
          { role: "STAFF", label: "Staff", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400", count: roleCounts.STAFF },
        ].map(({ role, label, color, count }) => (
          <Card key={role}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                    {ROLE_ICONS[role]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Joined</TableHead>
                  <TableHead className="w-[180px] font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                          <span className="text-sm font-medium text-primary">
                            {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium leading-tight">{user.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${ROLE_COLORS[user.role]} font-normal gap-1`}>
                        {ROLE_ICONS[user.role]}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "success" : "destructive"} className="font-normal">
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {user.role === "ADMIN" ? (
                          <span className="text-xs text-muted-foreground">Super Admin</span>
                        ) : (
                          <>
                            {user.role !== "MANAGER" && (
                              <Button variant="ghost" size="sm" className="gap-1.5 text-blue-600 dark:text-blue-400"
                                onClick={() => openRoleDialog(user, "MANAGER")}>
                                <ArrowUpCircle className="h-4 w-4" />
                                Promote
                              </Button>
                            )}
                            {user.role !== "STAFF" && (
                              <Button variant="ghost" size="sm" className="gap-1.5 text-orange-600 dark:text-orange-400"
                                onClick={() => openRoleDialog(user, "STAFF")}>
                                <ArrowDownCircle className="h-4 w-4" />
                                Demote
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{newRole === "MANAGER" ? "Promote" : "Demote"} User</DialogTitle>
            <DialogDescription>
              Are you sure you want to <strong>{newRole === "MANAGER" ? "promote" : "demote"} {selectedUser?.name}</strong> to {newRole}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRoleChange} disabled={updating}>
              {updating ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
