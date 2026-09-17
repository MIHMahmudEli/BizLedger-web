"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Shield, ArrowUpCircle, ArrowDownCircle, Crown, Plus, Trash2, UserCheck, UserX, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
}

const emptyUserForm: UserForm = {
  name: "",
  email: "",
  password: "",
  role: "STAFF",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [newRole, setNewRole] = useState<"MANAGER" | "STAFF">("STAFF");
  const [updating, setUpdating] = useState(false);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyUserForm);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const openCreateDialog = () => {
    setForm(emptyUserForm);
    setError("");
    setCreateDialogOpen(true);
  };

  const handleCreateUser = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) return;
    setCreating(true);
    setError("");
    try {
      await api.post("/users", form);
      setCreateDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const openDeleteDialog = (user: UserItem) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deletingUser.id}`);
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error("Failed to delete user:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (user: UserItem) => {
    try {
      await api.patch(`/users/${user.id}/status`);
      fetchUsers();
    } catch (err: any) {
      console.error("Failed to toggle status:", err);
    }
  };

  const roleCounts = {
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
    MANAGER: users.filter((u) => u.role === "MANAGER").length,
    STAFF: users.filter((u) => u.role === "STAFF").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <Badge variant="secondary" className="text-sm px-3 py-1">{users.length} users</Badge>
          <Button onClick={openCreateDialog} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>
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
            <div className="p-4">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">User</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                    <TableHead className="w-[140px] font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                          <div>
                            <Skeleton className="h-4 w-28 mb-1" />
                            <Skeleton className="h-3 w-36" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                      <button
                        onClick={() => user.role !== "ADMIN" && handleToggleStatus(user)}
                        disabled={user.role === "ADMIN"}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-normal transition-colors ${
                          user.isActive
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800"
                        } ${user.role === "ADMIN" ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                      >
                        {user.isActive ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                        {user.isActive ? "Active" : "Inactive"}
                      </button>
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
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => openDeleteDialog(user)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They will receive their credentials via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="user-name">Full Name *</Label>
              <Input
                id="user-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email *</Label>
              <Input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@bizledger.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">Password *</Label>
              <Input
                id="user-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 6 characters"
              />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value as UserForm["role"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateUser}
              disabled={creating || !form.name.trim() || !form.email.trim() || !form.password.trim()}
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
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

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingUser?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
