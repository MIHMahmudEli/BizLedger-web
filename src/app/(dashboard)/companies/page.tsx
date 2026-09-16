"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit,
  ExternalLink,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Company, PaginatedResponse } from "@/types";

interface CompanyForm {
  companyName: string;
  category: string;
  address: string;
  addressArea: string;
  website: string;
}

const CATEGORIES = [
  "Technology",
  "Finance",
  "Agro",
  "Healthcare",
  "Education",
  "Real Estate",
  "Manufacturing",
  "Retail",
  "Hospitality",
  "Construction",
  "Transport",
  "Energy",
  "Telecom",
  "Other",
];

const emptyForm: CompanyForm = {
  companyName: "",
  category: "",
  address: "",
  addressArea: "",
  website: "",
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [limit, setLimit] = useState(20);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [categorySearch, setCategorySearch] = useState("");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const fetchCompanies = useCallback(async (page = 1, searchQuery = searchDebounced, limitVal = limit) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: limitVal };
      if (searchQuery) params.search = searchQuery;
      const { data } = await api.get<PaginatedResponse<Company>>("/companies", { params });
      setCompanies(data.data);
      setMeta(data.meta);
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, limit]);

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchCompanies(1);
  }, [searchDebounced, limit, fetchCompanies]);

  const handlePageChange = (page: number) => fetchCompanies(page);

  const openCreateDialog = () => {
    setEditingCompany(null);
    setForm(emptyForm);
    setCategorySearch("");
    setFormOpen(true);
  };

  const openEditDialog = (company: Company) => {
    setEditingCompany(company);
    setForm({
      companyName: company.companyName,
      category: company.category ?? "",
      address: company.address ?? "",
      addressArea: company.addressArea ?? "",
      website: company.website ?? "",
    });
    setCategorySearch("");
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.companyName.trim()) return;
    setSaving(true);
    try {
      const body = {
        companyName: form.companyName.trim(),
        category: form.category.trim() || undefined,
        address: form.address.trim() || undefined,
        addressArea: form.addressArea.trim() || undefined,
        website: form.website.trim() || undefined,
      };

      if (editingCompany) {
        await api.patch(`/companies/${editingCompany.id}`, body);
      } else {
        await api.post("/companies", body);
      }
      setFormOpen(false);
      fetchCompanies(meta.page);
    } catch {
      // error handled silently
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (company: Company) => {
    setDeletingCompany(company);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCompany) return;
    setDeleting(true);
    try {
      await api.delete(`/companies/${deletingCompany.id}`);
      setDeleteOpen(false);
      fetchCompanies(meta.page);
    } catch {
      // error handled silently
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
            <p className="text-sm text-muted-foreground">
              Manage your company records
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Add Company
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, category, area, website..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select
                value={String(limit)}
                onValueChange={(value) => {
                  setLimit(Number(value));
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Building2 className="h-10 w-10 mb-3" />
              <p>No companies found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/companies/${company.id}`}
                          className="text-primary hover:underline"
                        >
                          {company.companyName}
                        </Link>
                      </TableCell>
                      <TableCell>{company.category ?? "-"}</TableCell>
                      <TableCell>{company.addressArea ?? "-"}</TableCell>
                      <TableCell>
                        {company.website ? (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            {new URL(company.website).hostname}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(company.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link href={`/companies/${company.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(company)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(company)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {meta.totalPages > 1 && (
                <>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {(meta.page - 1) * meta.limit + 1} to{" "}
                      {Math.min(meta.page * meta.limit, meta.total)} of{" "}
                      {meta.total} companies
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={meta.page <= 1}
                        onClick={() => handlePageChange(meta.page - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                          .filter(
                            (p) =>
                              p === 1 ||
                              p === meta.totalPages ||
                              Math.abs(p - meta.page) <= 1
                          )
                          .reduce<(number | "...")[]>((acc, p, i, arr) => {
                            if (i > 0 && p - (arr[i - 1] as number) > 1) {
                              acc.push("...");
                            }
                            acc.push(p);
                            return acc;
                          }, [])
                          .map((p, i) =>
                            p === "..." ? (
                              <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground">
                                ...
                              </span>
                            ) : (
                              <Button
                                key={p}
                                variant={meta.page === p ? "default" : "outline"}
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handlePageChange(p as number)}
                              >
                                {p}
                              </Button>
                            )
                          )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={meta.page >= meta.totalPages}
                        onClick={() => handlePageChange(meta.page + 1)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? "Edit Company" : "Add Company"}
            </DialogTitle>
            <DialogDescription>
              {editingCompany
                ? "Update the company details below."
                : "Fill in the details to create a new company."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <div className="relative">
                <Input
                  id="category"
                  value={form.category || categorySearch}
                  onChange={(e) => {
                    setCategorySearch(e.target.value);
                    setCategoryDropdownOpen(true);
                    if (form.category) {
                      setForm({ ...form, category: "" });
                    }
                  }}
                  onFocus={() => setCategoryDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setCategoryDropdownOpen(false), 200)}
                  placeholder="Select a category"
                />
                {categoryDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {!categorySearch && !form.category && (
                      <div
                        className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                        onMouseDown={() => {
                          setForm({ ...form, category: "" });
                          setCategorySearch("");
                          setCategoryDropdownOpen(false);
                        }}
                      >
                        Select a category
                      </div>
                    )}
                    {CATEGORIES.filter((cat) =>
                      cat.toLowerCase().includes(categorySearch.toLowerCase())
                    ).map((cat) => (
                      <div
                        key={cat}
                        className={`px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground ${
                          form.category === cat ? "bg-accent" : ""
                        }`}
                        onMouseDown={() => {
                          setForm({ ...form, category: cat });
                          setCategorySearch("");
                          setCategoryDropdownOpen(false);
                        }}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressArea">Area</Label>
              <Input
                id="addressArea"
                value={form.addressArea}
                onChange={(e) => setForm({ ...form, addressArea: e.target.value })}
                placeholder="Gulshan, Banani, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Full address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.companyName.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingCompany ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deletingCompany?.companyName}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
