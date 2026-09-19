"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import {
  Code2,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Mail,
  Phone,
  FolderKanban,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { Developer, DeveloperStatus, PaginatedResponse } from "@/types";

interface DeveloperForm {
  name: string;
  role: string;
  email: string;
  phone: string;
  status: DeveloperStatus;
  notes: string;
}

const DEVELOPER_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Mobile Developer",
  "UI/UX Designer",
  "QA Engineer",
  "DevOps Engineer",
  "Data Engineer",
  "Project Manager",
  "Other",
];

const STATUS_COLORS: Record<DeveloperStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  INACTIVE: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const emptyForm: DeveloperForm = {
  name: "",
  role: "",
  email: "",
  phone: "",
  status: "ACTIVE",
  notes: "",
};

function DevelopersContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [searchDebounced, setSearchDebounced] = useState(searchParams.get("search") || "");
  const [filterStatus, setFilterStatus] = useState<DeveloperStatus | "ALL">("ALL");

  const [roleSearch, setRoleSearch] = useState("");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingDeveloper, setEditingDeveloper] = useState<Developer | null>(null);
  const [form, setForm] = useState<DeveloperForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingDeveloper, setDeletingDeveloper] = useState<Developer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDevelopers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: meta.limit };
      if (searchDebounced) params.search = searchDebounced;
      if (filterStatus !== "ALL") params.status = filterStatus;
      const { data } = await api.get<PaginatedResponse<Developer>>("/developers", { params });
      setDevelopers(data.data);
      setMeta(data.meta);
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDebounced, filterStatus, meta.limit]);

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchDevelopers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDebounced, filterStatus]);

  const openCreateDialog = () => {
    setEditingDeveloper(null);
    setForm(emptyForm);
    setRoleSearch("");
    setFormOpen(true);
  };

  const openEditDialog = (developer: Developer) => {
    setEditingDeveloper(developer);
    setForm({
      name: developer.name,
      role: developer.role ?? "",
      email: developer.email ?? "",
      phone: developer.phone ?? "",
      status: developer.status,
      notes: developer.notes ?? "",
    });
    setRoleSearch("");
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        role: form.role.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        status: form.status,
        notes: form.notes.trim() || undefined,
      };
      if (editingDeveloper) {
        await api.patch(`/developers/${editingDeveloper.id}`, body);
      } else {
        await api.post("/developers", body);
      }
      setFormOpen(false);
      fetchDevelopers(meta.page);
    } catch {
      // error handled silently
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (developer: Developer) => {
    setDeletingDeveloper(developer);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingDeveloper) return;
    setDeleting(true);
    try {
      await api.delete(`/developers/${deletingDeveloper.id}`);
      setDeleteOpen(false);
      fetchDevelopers(meta.page);
    } catch {
      // error handled silently
    } finally {
      setDeleting(false);
    }
  };

  const filteredRoles = DEVELOPER_ROLES.filter((r) => r.toLowerCase().includes(roleSearch.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Developers</h1>
          <p className="text-sm text-muted-foreground">
            Manage developer profiles and see which projects they&apos;re assigned to
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreateDialog} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add Developer
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px] sm:min-w-[280px] max-w-md w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search developers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9 w-full"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as DeveloperStatus | "ALL")}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
          {(search || filterStatus !== "ALL") && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterStatus("ALL"); }} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{meta.total}</span> developers found
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Developer</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Phone</TableHead>
                    <TableHead className="font-semibold">Projects</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="w-[100px] font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-lg shrink-0" /><Skeleton className="h-4 w-28" /></div></TableCell>
                      <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : developers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Code2 className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">No developers found</p>
              <p className="text-sm mt-1">{isAdmin ? "Add your first developer to get started" : "No developer profiles match your filters"}</p>
            </div>
          ) : (
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Developer</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Projects</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="w-[100px] font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {developers.map((developer) => (
                  <TableRow key={developer.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {developer.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <p className="font-medium leading-tight">{developer.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {developer.role ? (
                        <Badge variant="secondary" className="font-normal">{developer.role}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {developer.email ? (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />{developer.email}
                        </span>
                      ) : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {developer.phone ? (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />{developer.phone}
                        </span>
                      ) : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                        {developer.projectCount ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${STATUS_COLORS[developer.status]} font-normal`}>
                        {developer.status === "ACTIVE" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {isAdmin ? (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(developer)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDeleteDialog(developer)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">View only</span>
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

      {meta.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            Showing {(meta.page - 1) * meta.limit + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => fetchDevelopers(meta.page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => fetchDevelopers(meta.page + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDeveloper ? "Edit Developer" : "Add Developer"}</DialogTitle>
            <DialogDescription>
              {editingDeveloper ? "Update this developer's profile below." : "Create a developer profile so you can assign them to projects."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Enter developer name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <div className="relative">
                <Input
                  id="role"
                  value={form.role || roleSearch}
                  onChange={(e) => { setRoleSearch(e.target.value); setRoleDropdownOpen(true); if (form.role) setForm((f) => ({ ...f, role: "" })); }}
                  onFocus={() => setRoleDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setRoleDropdownOpen(false), 200)}
                  placeholder="Select role"
                />
                {roleDropdownOpen && filteredRoles.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredRoles.map((r) => (
                      <div key={r} className="px-3 py-2 cursor-pointer hover:bg-accent"
                        onMouseDown={() => { setForm((f) => ({ ...f, role: r })); setRoleSearch(""); setRoleDropdownOpen(false); }}>
                        {r}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="developer@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+8801XXXXXXXXX" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm((f) => ({ ...f, status: value as DeveloperStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea id="notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Skills, specialization, or other notes" rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? "Saving..." : editingDeveloper ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Developer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingDeveloper?.name}</strong>? They will be unassigned from any projects. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DevelopersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <DevelopersContent />
    </Suspense>
  );
}
