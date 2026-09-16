"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Shield, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ADMIN: "bg-red-100 text-red-800",
  MANAGER: "bg-blue-100 text-blue-800",
  STAFF: "bg-gray-100 text-gray-800",
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

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Users</h1>
            <p className="text-sm text-muted-foreground">
              Manage user roles and permissions
            </p>
          </div>
        </div>
        <Badge variant="secondary">{users.length} users</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mb-3" />
              <p>No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={ROLE_COLORS[user.role]}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "success" : "destructive"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      {user.role === "ADMIN" ? (
                        <span className="text-xs text-muted-foreground">
                          Super Admin
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          {user.role !== "MANAGER" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-blue-600"
                              onClick={() => openRoleDialog(user, "MANAGER")}
                            >
                              <ArrowUpCircle className="h-4 w-4" />
                              Promote
                            </Button>
                          )}
                          {user.role !== "STAFF" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-orange-600"
                              onClick={() => openRoleDialog(user, "STAFF")}
                            >
                              <ArrowDownCircle className="h-4 w-4" />
                              Demote
                            </Button>
                          )}
                        </div>
                      )}
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
            <DialogTitle>
              {newRole === "MANAGER" ? "Promote" : "Demote"} User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to{" "}
              <strong>
                {newRole === "MANAGER" ? "promote" : "demote"}{" "}
                {selectedUser?.name}
              </strong>{" "}
              to <Badge variant="secondary" className={ROLE_COLORS[newRole]}>{newRole}</Badge>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={updating}>
              {updating ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
