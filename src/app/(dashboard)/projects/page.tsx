"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FolderOpen,
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  MapPin,
  Printer,
  Loader2,
  Users,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Developer,
} from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { openPrintWindow, writePrintReport } from "@/lib/print";

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  PLANNED: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ON_HOLD: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Unpaid",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  OVERPAID: "Overpaid",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  UNPAID: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  PARTIALLY_PAID: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  OVERPAID: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

const PROJECT_TYPES = [
  "Web Development", "Mobile App", "Desktop Application", "E-Commerce",
  "ERP System", "CRM System", "UI/UX Design", "API Development",
  "Cloud Migration", "DevOps", "Data Analytics", "AI/ML",
  "Consulting", "Maintenance", "Other",
];

const PROJECT_TYPE_COLORS: Record<string, string> = {
  "Web Development": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Mobile App": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "Desktop Application": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  "E-Commerce": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  "ERP System": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "CRM System": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  "UI/UX Design": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  "API Development": "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  "Cloud Migration": "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  "DevOps": "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  "Data Analytics": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  "AI/ML": "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200",
  "Consulting": "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200",
  "Maintenance": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  "Other": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
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
  developerIds: string[];
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
  developerIds: [],
};

function ProjectsContent() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);

  const [filterArea, setFilterArea] = useState(searchParams.get("area") || "");
  const [filterCompanyId, setFilterCompanyId] = useState(searchParams.get("companyId") || "");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState(searchParams.get("paymentStatus") || "");
  const [areaSearch, setAreaSearch] = useState("");
  const [areaDropdownOpen, setAreaDropdownOpen] = useState(false);
  const [companyFilterSearch, setCompanyFilterSearch] = useState("");
  const [companyFilterDropdownOpen, setCompanyFilterDropdownOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [printing, setPrinting] = useState(false);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [projectTypeSearch, setProjectTypeSearch] = useState("");
  const [projectTypeDropdownOpen, setProjectTypeDropdownOpen] = useState(false);

  const [allDevelopers, setAllDevelopers] = useState<Developer[]>([]);
  const [developerSearch, setDeveloperSearch] = useState("");
  const [developerDropdownOpen, setDeveloperDropdownOpen] = useState(false);
  const developerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        developerDropdownRef.current &&
        !developerDropdownRef.current.contains(event.target as Node)
      ) {
        setDeveloperDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchProjects();
  }, [page, debouncedSearch, limit, filterArea, filterCompanyId, filterPaymentStatus]);

  useEffect(() => {
    fetchCompanies();
    fetchDevelopers();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit, search: debouncedSearch };
      if (filterArea) params.area = filterArea;
      if (filterCompanyId) params.companyId = filterCompanyId;
      const response = await api.get<PaginatedResponse<ProjectRow>>("/projects", { params });
      let filtered = response.data.data;
      if (filterPaymentStatus) {
        filtered = filtered.filter((p) => p.financial?.paymentStatus === filterPaymentStatus);
      }
      setProjects(filtered);
      setMeta(response.data.meta);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    const win = openPrintWindow();
    if (!win) {
      alert("Please allow pop-ups for this site to print.");
      return;
    }
    setPrinting(true);
    try {
      const all: ProjectRow[] = [];
      let pageNum = 1;
      let totalPages = 1;
      do {
        const params: Record<string, string | number> = { page: pageNum, limit: 100, search: debouncedSearch };
        if (filterArea) params.area = filterArea;
        if (filterCompanyId) params.companyId = filterCompanyId;
        const response = await api.get<PaginatedResponse<ProjectRow>>("/projects", { params });
        all.push(...response.data.data);
        totalPages = response.data.meta.totalPages;
        pageNum += 1;
      } while (pageNum <= totalPages);

      const filteredRows = filterPaymentStatus
        ? all.filter((p) => p.financial?.paymentStatus === filterPaymentStatus)
        : all;

      const totalValue = filteredRows.reduce((sum, p) => sum + (parseFloat(p.totalValue) || 0), 0);
      const totalPaid = filteredRows.reduce((sum, p) => sum + (parseFloat(p.financial?.totalPaid ?? "0") || 0), 0);
      const totalDue = filteredRows.reduce((sum, p) => sum + (parseFloat(p.financial?.due ?? "0") || 0), 0);

      const filters: string[] = [];
      if (debouncedSearch) filters.push(`Search: "${debouncedSearch}"`);
      if (filterArea) filters.push(`Area: ${filterArea}`);
      if (filterCompanyId) filters.push(`Company: ${companies.find((c) => c.id === filterCompanyId)?.companyName ?? filterCompanyId}`);
      if (filterPaymentStatus) filters.push(`Payment: ${PAYMENT_STATUS_LABELS[filterPaymentStatus] ?? filterPaymentStatus}`);

      writePrintReport(win, {
        title: "Projects Report",
        filters,
        summary: [
          { label: "Total Projects", value: String(filteredRows.length) },
          { label: "Total Value", value: formatCurrency(totalValue) },
          { label: "Total Paid", value: formatCurrency(totalPaid) },
          { label: "Total Due", value: formatCurrency(totalDue) },
        ],
        columns: [
          { header: "Project", accessor: (p) => p.projectName },
          { header: "Company", accessor: (p) => p.company?.companyName ?? "-" },
          { header: "Type", accessor: (p) => p.projectType || "-" },
          { header: "Value", accessor: (p) => formatCurrency(p.totalValue), align: "right" },
          { header: "Paid", accessor: (p) => formatCurrency(p.financial?.totalPaid ?? 0), align: "right" },
          { header: "Due", accessor: (p) => formatCurrency(p.financial?.due ?? 0), align: "right" },
          { header: "Status", accessor: (p) => PROJECT_STATUS_LABELS[p.status] ?? p.status },
          { header: "Payment", accessor: (p) => (p.financial?.paymentStatus ? PAYMENT_STATUS_LABELS[p.financial.paymentStatus] : "N/A") },
          { header: "Developers", accessor: (p) => p.developers && p.developers.length > 0 ? p.developers.map((d) => d.name).join(", ") : "Unassigned" },
        ],
        rows: filteredRows,
        totals: {
          label: "Total",
          values: {
            Value: formatCurrency(totalValue),
            Paid: formatCurrency(totalPaid),
            Due: formatCurrency(totalDue),
          },
        },
        emptyMessage: "No projects match the current filters.",
      });
    } catch {
      win.close();
      alert("Failed to prepare the print report. Please try again.");
    } finally {
      setPrinting(false);
    }
  };

  const openAddDialog = () => {
    setEditingId(null);
    setForm(initialForm);
    setCompanySearch("");
    setProjectTypeSearch("");
    setDeveloperSearch("");
    setDeveloperDropdownOpen(false);
    fetchCompanies();
    fetchDevelopers();
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
      developerIds: project.developers ? project.developers.map((d) => d.id) : [],
    });
    setCompanySearch("");
    setProjectTypeSearch("");
    setDeveloperSearch("");
    setDeveloperDropdownOpen(false);
    fetchCompanies();
    fetchDevelopers();
    setFormOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
  };

  const handleFormChange = (field: keyof ProjectForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDeveloper = (id: string) => {
    setForm((prev) => ({
      ...prev,
      developerIds: prev.developerIds.includes(id)
        ? prev.developerIds.filter((d) => d !== id)
        : [...prev.developerIds, id],
    }));
  };

  const fetchDevelopers = async () => {
    try {
      const response = await api.get<PaginatedResponse<Developer>>("/developers", { params: { limit: 100 } });
      setAllDevelopers(response.data.data);
    } catch (error) {
      console.error("Failed to fetch developers:", error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get<PaginatedResponse<Company>>("/companies", { params: { limit: 100 } });
      setCompanies(response.data.data);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  };

  const filteredCompanies = companies.filter(
    (c) => c.companyName.toLowerCase().includes(companySearch.toLowerCase()) || c.category?.toLowerCase().includes(companySearch.toLowerCase())
  );

  const selectedCompany = companies.find((c) => c.id === form.companyId);

  const uniqueAreas = [...new Set(companies.map((c) => c.addressArea).filter(Boolean))] as string[];

  const handleSubmit = async () => {
    if (!editingId && !form.companyId) return;
    setSubmitting(true);
    try {
      const { companyId, ...rest } = form;
      const payload = {
        ...rest,
        totalValue: parseFloat(form.totalValue) || 0,
        startDate: form.startDate || undefined,
        deadline: form.deadline || undefined,
        description: form.description || undefined,
        developerIds: form.developerIds,
      };
      if (editingId) {
        await api.patch(`/projects/${editingId}`, payload);
      } else {
        await api.post(`/companies/${companyId}/projects`, payload);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Track and manage your business projects</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handlePrint} disabled={printing} className="gap-2 flex-1 sm:flex-none">
            {printing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            Print
          </Button>
          <Button onClick={openAddDialog} className="gap-2 flex-1 sm:flex-none">
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px] sm:min-w-[280px] max-w-md w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9 w-full"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="relative">
            <Input
              value={filterArea || areaSearch}
              onChange={(e) => { setAreaSearch(e.target.value); setAreaDropdownOpen(true); if (filterArea) { setFilterArea(""); setPage(1); } }}
              onFocus={() => setAreaDropdownOpen(true)}
              onBlur={() => setTimeout(() => setAreaDropdownOpen(false), 200)}
              placeholder="Area..."
              className="w-40"
            />
            {areaDropdownOpen && uniqueAreas.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                {!areaSearch && !filterArea && (
                  <div className="px-3 py-2 cursor-pointer hover:bg-accent text-muted-foreground text-sm"
                    onMouseDown={() => { setFilterArea(""); setAreaSearch(""); setAreaDropdownOpen(false); setPage(1); }}>
                    All Areas
                  </div>
                )}
                {uniqueAreas.filter((a) => a.toLowerCase().includes(areaSearch.toLowerCase())).map((a) => (
                  <div key={a} className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${filterArea === a ? "bg-accent font-medium" : ""}`}
                    onMouseDown={() => { setFilterArea(a); setAreaSearch(""); setAreaDropdownOpen(false); setPage(1); }}>
                    {a}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <Input
              value={companies.find((c) => c.id === filterCompanyId)?.companyName || companyFilterSearch}
              onChange={(e) => { setCompanyFilterSearch(e.target.value); setCompanyFilterDropdownOpen(true); if (filterCompanyId) { setFilterCompanyId(""); setPage(1); } }}
              onFocus={() => setCompanyFilterDropdownOpen(true)}
              onBlur={() => setTimeout(() => {
                // Only a suggestion may be picked — discard free text
                if (companyFilterSearch) {
                  const match = companies.find(
                    (c) => c.companyName.toLowerCase() === companyFilterSearch.trim().toLowerCase()
                  );
                  if (match) { setFilterCompanyId(match.id); setPage(1); }
                  setCompanyFilterSearch("");
                }
                setCompanyFilterDropdownOpen(false);
              }, 200)}
              placeholder="All Companies"
              className="w-44"
            />
            {companyFilterDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                {!companyFilterSearch && !filterCompanyId && (
                  <div className="px-3 py-2 cursor-pointer hover:bg-accent text-muted-foreground text-sm"
                    onMouseDown={() => { setFilterCompanyId(""); setCompanyFilterSearch(""); setCompanyFilterDropdownOpen(false); setPage(1); }}>
                    All Companies
                  </div>
                )}
                {companies.filter((c) => c.companyName.toLowerCase().includes(companyFilterSearch.toLowerCase())).map((c) => (
                  <div key={c.id} className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${filterCompanyId === c.id ? "bg-accent font-medium" : ""}`}
                    onMouseDown={() => { setFilterCompanyId(c.id); setCompanyFilterSearch(""); setCompanyFilterDropdownOpen(false); setPage(1); }}>
                    <div className="font-medium">{c.companyName}</div>
                    {c.category && <div className="text-xs text-muted-foreground">{c.category}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Select value={filterPaymentStatus || "all"} onValueChange={(value) => { setFilterPaymentStatus(value === "all" ? "" : value); setPage(1); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Payments" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
          {(filterArea || filterCompanyId || filterPaymentStatus || search) && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterArea(""); setAreaSearch(""); setFilterCompanyId(""); setCompanyFilterSearch(""); setFilterPaymentStatus(""); setSearch(""); }}
              className="text-muted-foreground">
              <X className="h-4 w-4 mr-1" />Clear
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select value={String(limit)} onValueChange={(value) => { setLimit(Number(value)); setPage(1); }}>
              <SelectTrigger className="w-16 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{meta.total}</span> projects found
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Project</TableHead>
                    <TableHead className="font-semibold">Company</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold text-right">Value</TableHead>
                    <TableHead className="font-semibold text-right">Paid</TableHead>
                    <TableHead className="font-semibold text-right">Due</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Payment</TableHead>
                    <TableHead className="font-semibold">Developers</TableHead>
                    <TableHead className="w-[100px] font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">No projects found</p>
              <p className="text-sm mt-1">Create your first project to get started</p>
            </div>
          ) : (
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Project</TableHead>
                  <TableHead className="font-semibold">Company</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold text-right">Value</TableHead>
                  <TableHead className="font-semibold text-right">Paid</TableHead>
                  <TableHead className="font-semibold text-right">Due</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Payment</TableHead>
                  <TableHead className="font-semibold">Developers</TableHead>
                  <TableHead className="w-[100px] font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id} className="group">
                    <TableCell>
                      <Link href={`/projects/${project.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <FolderOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium leading-tight group-hover:text-primary transition-colors">
                            {project.projectName}
                          </p>
                          {project.company?.addressArea ? (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {project.company.addressArea}
                            </p>
                          ) : project.deadline ? (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Due {formatDate(project.deadline)}
                            </p>
                          ) : null}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{project.company?.companyName ?? "-"}</span>
                    </TableCell>
                    <TableCell>
                      {project.projectType ? (
                        <Badge variant="secondary" className={`${PROJECT_TYPE_COLORS[project.projectType] || ""} font-normal`}>
                          {project.projectType}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(project.totalValue)}</TableCell>
                    <TableCell className="text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(project.financial?.totalPaid ?? 0)}</TableCell>
                    <TableCell className="text-right text-red-600 dark:text-red-400">{formatCurrency(project.financial?.due ?? 0)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${PROJECT_STATUS_COLORS[project.status]} font-normal`}>
                        {PROJECT_STATUS_LABELS[project.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${PAYMENT_STATUS_COLORS[project.financial?.paymentStatus || "UNPAID"]} font-normal`}>
                        {project.financial?.paymentStatus ? PAYMENT_STATUS_LABELS[project.financial.paymentStatus] : "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {project.developers && project.developers.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {project.developers.map((dev) => (
                            <Link 
                              key={dev.id} 
                              href={`/developers?search=${encodeURIComponent(dev.name)}`}
                              className="text-sm text-primary hover:underline hover:text-primary/80 transition-colors"
                            >
                              {dev.name}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/projects/${project.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(project)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDeleteDialog(project.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
            <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - meta.page) <= 1)
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground">...</span>
                  ) : (
                    <Button key={p} variant={meta.page === p ? "default" : "outline"} size="sm" className="h-9 w-9 p-0"
                      onClick={() => setPage(p as number)}>
                      {p}
                    </Button>
                  )
                )}
            </div>
            <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setPage(meta.page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Project" : "Add Project"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update the project details below." : "Fill in the details to create a new project."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Company *</Label>
              {editingId ? (
                <Input
                  value={selectedCompany?.companyName || "N/A"}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              ) : (
                <div className="relative">
                  <Input
                    value={companySearch || selectedCompany?.companyName || ""}
                    onChange={(e) => { setCompanySearch(e.target.value); setCompanyDropdownOpen(true); if (form.companyId) handleFormChange("companyId", ""); }}
                    onFocus={() => setCompanyDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setCompanyDropdownOpen(false), 200)}
                    placeholder="Search company name..."
                  />
                  {companyDropdownOpen && filteredCompanies.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredCompanies.map((company) => (
                        <div key={company.id} className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                          onMouseDown={() => { handleFormChange("companyId", company.id); setCompanySearch(""); setCompanyDropdownOpen(false); }}>
                          <div className="font-medium">{company.companyName}</div>
                          {company.category && <div className="text-xs text-muted-foreground">{company.category}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input id="projectName" value={form.projectName} onChange={(e) => handleFormChange("projectName", e.target.value)} placeholder="Enter project name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectType">Project Type</Label>
              <div className="relative">
                <Input
                  id="projectType"
                  value={form.projectType || projectTypeSearch}
                  onChange={(e) => { setProjectTypeSearch(e.target.value); setProjectTypeDropdownOpen(true); if (form.projectType) handleFormChange("projectType", ""); }}
                  onFocus={() => setProjectTypeDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setProjectTypeDropdownOpen(false), 200)}
                  placeholder="Select type"
                />
                {projectTypeDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {!projectTypeSearch && !form.projectType && (
                      <div className="px-3 py-2 cursor-pointer hover:bg-accent text-muted-foreground"
                        onMouseDown={() => { handleFormChange("projectType", ""); setProjectTypeSearch(""); setProjectTypeDropdownOpen(false); }}>
                        Select type
                      </div>
                    )}
                    {PROJECT_TYPES.filter((type) => type.toLowerCase().includes(projectTypeSearch.toLowerCase())).map((type) => (
                      <div key={type} className={`px-3 py-2 cursor-pointer hover:bg-accent ${form.projectType === type ? "bg-accent" : ""}`}
                        onMouseDown={() => { handleFormChange("projectType", type); setProjectTypeSearch(""); setProjectTypeDropdownOpen(false); }}>
                        {type}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalValue">Total Value</Label>
              <Input id="totalValue" type="number" value={form.totalValue} onChange={(e) => handleFormChange("totalValue", e.target.value)} placeholder="0.00" min="0" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => handleFormChange("status", value as ProjectStatus)}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(PROJECT_STATUS_LABELS) as [ProjectStatus, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" value={form.startDate} onChange={(e) => handleFormChange("startDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" type="date" value={form.deadline} onChange={(e) => handleFormChange("deadline", e.target.value)} />
            </div>
            <div className="space-y-2" ref={developerDropdownRef}>
              <div className="flex items-center justify-between">
                <Label htmlFor="developer-select">Assign Developers</Label>
                {form.developerIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, developerIds: [] }))}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear ({form.developerIds.length})
                  </button>
                )}
              </div>

              <div className="relative">
                <button
                  id="developer-select"
                  type="button"
                  onClick={() => setDeveloperDropdownOpen((prev) => !prev)}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-left"
                >
                  <span className="flex items-center gap-2 min-w-0 truncate text-muted-foreground">
                    <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {form.developerIds.length === 0 ? (
                      <span className="truncate">Select developers...</span>
                    ) : (
                      <span className="text-foreground font-medium truncate">
                        {form.developerIds.length} selected
                      </span>
                    )}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-1" />
                </button>

                {developerDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg overflow-hidden">
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          value={developerSearch}
                          onChange={(e) => setDeveloperSearch(e.target.value)}
                          placeholder="Search developers..."
                          className="pl-8 h-8 text-xs"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto p-1 space-y-0.5">
                      {allDevelopers.length === 0 ? (
                        <div className="py-6 text-center text-xs text-muted-foreground">
                          No developer profiles found.
                        </div>
                      ) : (
                        (() => {
                          const filtered = allDevelopers.filter(
                            (dev) =>
                              dev.name.toLowerCase().includes(developerSearch.toLowerCase()) ||
                              (dev.role && dev.role.toLowerCase().includes(developerSearch.toLowerCase()))
                          );
                          if (filtered.length === 0) {
                            return (
                              <div className="py-4 text-center text-xs text-muted-foreground">
                                No matching developers
                              </div>
                            );
                          }
                          return filtered.map((dev) => {
                            const isSelected = form.developerIds.includes(dev.id);
                            return (
                              <div
                                key={dev.id}
                                onClick={() => toggleDeveloper(dev.id)}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors ${
                                  isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent text-foreground"
                                }`}
                              >
                                <div
                                  className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                                    isSelected ? "bg-primary border-primary text-primary-foreground" : "border-input"
                                  }`}
                                >
                                  {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                                </div>
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 shrink-0">
                                  <span className="text-[10px] font-bold text-primary">
                                    {dev.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="truncate font-medium">{dev.name}</div>
                                  {dev.role && (
                                    <div className="text-[10px] text-muted-foreground truncate">{dev.role}</div>
                                  )}
                                </div>
                                {dev.status === "INACTIVE" && (
                                  <Badge variant="secondary" className="text-[9px] font-normal py-0 px-1">
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                            );
                          });
                        })()
                      )}
                    </div>
                  </div>
                )}
              </div>

              {form.developerIds.length > 0 && (
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pt-0.5">
                  {form.developerIds.map((id) => {
                    const dev = allDevelopers.find((d) => d.id === id);
                    if (!dev) return null;
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="pl-1.5 pr-1 py-0.5 flex items-center gap-1 text-[11px] font-normal border"
                      >
                        <span className="truncate max-w-[110px]">{dev.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDeveloper(id);
                          }}
                          className="h-3.5 w-3.5 rounded-full hover:bg-muted inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea id="description" value={form.description} onChange={(e) => handleFormChange("description", e.target.value)}
                placeholder="Enter project description" rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>Are you sure you want to delete this project? This action cannot be undone.</DialogDescription>
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

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <ProjectsContent />
    </Suspense>
  );
}
