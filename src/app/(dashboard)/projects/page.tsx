"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import api from "@/lib/api";
import {
  Project,
  ProjectFinancial,
  ProjectStatus,
  PaginatedResponse,
  Company,
} from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const PROJECT_STATUS_VARIANT: Record<ProjectStatus, string> = {
  PLANNED: "secondary",
  IN_PROGRESS: "info",
  ON_HOLD: "warning",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Unpaid",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  OVERPAID: "Overpaid",
};

const PAYMENT_STATUS_VARIANT: Record<string, string> = {
  UNPAID: "destructive",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  OVERPAID: "info",
};

interface ProjectRow extends Project {
  financial?: ProjectFinancial;
}

interface ProjectForm {
  companyId: string;
  projectName: string;
  projectType: string;
  totalValue: string;
  status: ProjectStatus;
  startDate: string;
  deadline: string;
  description: string;
}

const initialForm: ProjectForm = {
  companyId: "",
  projectName: "",
  projectType: "",
  totalValue: "",
  status: "PLANNED",
  startDate: "",
  deadline: "",
  description: "",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [page, search]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse<ProjectRow>>(
        "/projects",
        {
          params: { page, limit: 10, search },
        }
      );
      setProjects(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const openAddDialog = () => {
    setEditingId(null);
    setForm(initialForm);
    setCompanySearch("");
    fetchCompanies();
    setFormOpen(true);
  };

  const openEditDialog = (project: ProjectRow) => {
    setEditingId(project.id);
    setForm({
      companyId: project.companyId,
      projectName: project.projectName,
      projectType: project.projectType,
      totalValue: project.totalValue,
      status: project.status,
      startDate: project.startDate ? project.startDate.split("T")[0] : "",
      deadline: project.deadline ? project.deadline.split("T")[0] : "",
      description: project.description || "",
    });
    setCompanySearch("");
    fetchCompanies();
    setFormOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
  };

  const handleFormChange = (
    field: keyof ProjectForm,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get<PaginatedResponse<Company>>("/companies", {
        params: { limit: 100 },
      });
      setCompanies(response.data.data);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  };

  const filteredCompanies = companies.filter(
    (c) =>
      c.companyName.toLowerCase().includes(companySearch.toLowerCase()) ||
      c.category?.toLowerCase().includes(companySearch.toLowerCase())
  );

  const selectedCompany = companies.find((c) => c.id === form.companyId);

  const handleSubmit = async () => {
    if (!editingId && !form.companyId) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        totalValue: parseFloat(form.totalValue) || 0,
        startDate: form.startDate || undefined,
        deadline: form.deadline || undefined,
        description: form.description || undefined,
      };

      if (editingId) {
        const { companyId, ...updatePayload } = payload;
        await api.patch(`/projects/${editingId}`, updatePayload);
      } else {
        await api.post(`/companies/${form.companyId}/projects`, payload);
      }

      setFormOpen(false);
      setEditingId(null);
      setForm(initialForm);
      fetchProjects();
    } catch (error) {
      console.error("Failed to save project:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await api.delete(`/projects/${deletingId}`);
      setDeleteOpen(false);
      setDeletingId(null);
      fetchProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Projects</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{meta.total} total</Badge>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={search}
                onChange={handleSearch}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No projects found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {project.projectName}
                      </Link>
                    </TableCell>
                    <TableCell>{project.projectType}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(project.totalValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(project.financial?.totalPaid ?? 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(project.financial?.due ?? 0)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          PROJECT_STATUS_VARIANT[project.status] as
                            | "secondary"
                            | "info"
                            | "warning"
                            | "success"
                            | "destructive"
                        }
                      >
                        {PROJECT_STATUS_LABELS[project.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          project.financial?.paymentStatus
                            ? (PAYMENT_STATUS_VARIANT[
                                project.financial.paymentStatus
                              ] as
                                | "secondary"
                                | "info"
                                | "warning"
                                | "success"
                                | "destructive")
                            : "secondary"
                        }
                      >
                        {project.financial?.paymentStatus
                          ? PAYMENT_STATUS_LABELS[project.financial.paymentStatus]
                          : "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(project)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(project.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(meta.totalPages, p + 1))
                  }
                  disabled={page === meta.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Project" : "Add Project"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the project details below."
                : "Fill in the details to create a new project."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {!editingId && (
              <div className="space-y-2">
                <Label>Company *</Label>
                <div className="relative">
                  <Input
                    value={companySearch || selectedCompany?.companyName || ""}
                    onChange={(e) => {
                      setCompanySearch(e.target.value);
                      setCompanyDropdownOpen(true);
                      if (form.companyId) {
                        handleFormChange("companyId", "");
                      }
                    }}
                    onFocus={() => setCompanyDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setCompanyDropdownOpen(false), 200)}
                    placeholder="Search company name..."
                  />
                  {companyDropdownOpen && filteredCompanies.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredCompanies.map((company) => (
                        <div
                          key={company.id}
                          className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                          onMouseDown={() => {
                            handleFormChange("companyId", company.id);
                            setCompanySearch("");
                            setCompanyDropdownOpen(false);
                          }}
                        >
                          <div className="font-medium">{company.companyName}</div>
                          {company.category && (
                            <div className="text-xs text-muted-foreground">{company.category}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={form.projectName}
                onChange={(e) =>
                  handleFormChange("projectName", e.target.value)
                }
                placeholder="Enter project name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectType">Project Type</Label>
              <Select
                value={form.projectType}
                onValueChange={(value) => handleFormChange("projectType", value)}
              >
                <SelectTrigger id="projectType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Web Development">Web Development</SelectItem>
                  <SelectItem value="Mobile App">Mobile App</SelectItem>
                  <SelectItem value="Desktop Application">Desktop Application</SelectItem>
                  <SelectItem value="E-Commerce">E-Commerce</SelectItem>
                  <SelectItem value="ERP System">ERP System</SelectItem>
                  <SelectItem value="CRM System">CRM System</SelectItem>
                  <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
                  <SelectItem value="API Development">API Development</SelectItem>
                  <SelectItem value="Cloud Migration">Cloud Migration</SelectItem>
                  <SelectItem value="DevOps">DevOps</SelectItem>
                  <SelectItem value="Data Analytics">Data Analytics</SelectItem>
                  <SelectItem value="AI/ML">AI/ML</SelectItem>
                  <SelectItem value="Consulting">Consulting</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalValue">Total Value</Label>
              <Input
                id="totalValue"
                type="number"
                value={form.totalValue}
                onChange={(e) =>
                  handleFormChange("totalValue", e.target.value)
                }
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  handleFormChange("status", value as ProjectStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(PROJECT_STATUS_LABELS) as [
                      ProjectStatus,
                      string
                    ][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  handleFormChange("startDate", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => handleFormChange("deadline", e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  handleFormChange("description", e.target.value)
                }
                placeholder="Enter project description"
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
