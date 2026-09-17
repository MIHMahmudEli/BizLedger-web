"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  X,
  Globe,
  MapPin,
  Tag,
} from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Badge } from "@/components/ui/badge";
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

const CATEGORY_COLORS: Record<string, string> = {
  Technology: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Finance: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  Agro: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Healthcare: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Education: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "Real Estate": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Manufacturing: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Retail: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  Hospitality: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  Construction: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Transport: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  Energy: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200",
  Telecom: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  Other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

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

  const [filterCategory, setFilterCategory] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const [filterArea, setFilterArea] = useState("");
  const [areaSearch, setAreaSearch] = useState("");
  const [areaDropdownOpen, setAreaDropdownOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);

  const uniqueAreas = [...new Set(companies.map((c) => c.addressArea).filter(Boolean))] as string[];

  const fetchCompanies = useCallback(async (page = 1, searchQuery = searchDebounced, limitVal = limit, category = filterCategory, area = filterArea) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: limitVal };
      if (searchQuery) params.search = searchQuery;
      if (category) params.category = category;
      if (area) params.area = area;
      const { data } = await api.get<PaginatedResponse<Company>>("/companies", { params });
      setCompanies(data.data);
      setMeta(data.meta);
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, limit, filterCategory, filterArea]);

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchCompanies(1);
  }, [searchDebounced, limit, filterCategory, filterArea, fetchCompanies]);

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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground">
            Manage your business contacts and company records
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Company
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
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
          <div className="relative">
            <Input
              value={filterCategory || categorySearch}
              onChange={(e) => {
                setCategorySearch(e.target.value);
                setCategoryDropdownOpen(true);
                if (filterCategory) setFilterCategory("");
              }}
              onFocus={() => setCategoryDropdownOpen(true)}
              onBlur={() => setTimeout(() => setCategoryDropdownOpen(false), 200)}
              placeholder="Category..."
              className="w-40"
            />
            {categoryDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                {!categorySearch && !filterCategory && (
                  <div
                    className="px-3 py-2 cursor-pointer hover:bg-accent text-muted-foreground text-sm"
                    onMouseDown={() => { setFilterCategory(""); setCategorySearch(""); setCategoryDropdownOpen(false); }}
                  >
                    All Categories
                  </div>
                )}
                {CATEGORIES.filter((cat) => cat.toLowerCase().includes(categorySearch.toLowerCase())).map((cat) => (
                  <div
                    key={cat}
                    className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${filterCategory === cat ? "bg-accent font-medium" : ""}`}
                    onMouseDown={() => { setFilterCategory(cat); setCategorySearch(""); setCategoryDropdownOpen(false); }}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <Input
              value={filterArea || areaSearch}
              onChange={(e) => {
                setAreaSearch(e.target.value);
                setAreaDropdownOpen(true);
                if (filterArea) setFilterArea("");
              }}
              onFocus={() => setAreaDropdownOpen(true)}
              onBlur={() => setTimeout(() => setAreaDropdownOpen(false), 200)}
              placeholder="Area..."
              className="w-40"
            />
            {areaDropdownOpen && uniqueAreas.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                {!areaSearch && !filterArea && (
                  <div
                    className="px-3 py-2 cursor-pointer hover:bg-accent text-muted-foreground text-sm"
                    onMouseDown={() => { setFilterArea(""); setAreaSearch(""); setAreaDropdownOpen(false); }}
                  >
                    All Areas
                  </div>
                )}
                {uniqueAreas.filter((a) => a.toLowerCase().includes(areaSearch.toLowerCase())).map((a) => (
                  <div
                    key={a}
                    className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${filterArea === a ? "bg-accent font-medium" : ""}`}
                    onMouseDown={() => { setFilterArea(a); setAreaSearch(""); setAreaDropdownOpen(false); }}
                  >
                    {a}
                  </div>
                ))}
              </div>
            )}
          </div>
          {(filterCategory || filterArea || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterCategory(""); setFilterArea(""); setSearch(""); setCategorySearch(""); setAreaSearch(""); }}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select value={String(limit)} onValueChange={(value) => { setLimit(Number(value)); }}>
              <SelectTrigger className="w-16 h-9">
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

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{meta.total}</span> companies found
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Company</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Area</TableHead>
                    <TableHead className="font-semibold">Website</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
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
                      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Building2 className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">No companies found</p>
              <p className="text-sm mt-1">
                {search || filterCategory || filterArea ? "Try adjusting your filters" : "Create your first company to get started"}
              </p>
              {!search && !filterCategory && !filterArea && (
                <Button onClick={openCreateDialog} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Company
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Company</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Area</TableHead>
                  <TableHead className="font-semibold">Website</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="w-[100px] font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id} className="group">
                    <TableCell>
                      <Link
                        href={`/companies/${company.id}`}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium leading-tight group-hover:text-primary transition-colors">
                            {company.companyName}
                          </p>
                          {company.addressArea && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {company.addressArea}
                            </p>
                          )}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {company.category ? (
                        <Badge variant="secondary" className={`${CATEGORY_COLORS[company.category] || ""} font-normal`}>
                          {company.category}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{company.addressArea ?? "-"}</span>
                    </TableCell>
                    <TableCell>
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          {new URL(company.website).hostname}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{formatDate(company.createdAt)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <Link href={`/companies/${company.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(company)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(company)}
                        >
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1} to{" "}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => handlePageChange(meta.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
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
                      className="h-9 w-9 p-0"
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
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
                    if (form.category) setForm({ ...form, category: "" });
                  }}
                  onFocus={() => setCategoryDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setCategoryDropdownOpen(false), 200)}
                  placeholder="Select a category"
                />
                {categoryDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {!categorySearch && !form.category && (
                      <div
                        className="px-3 py-2 cursor-pointer hover:bg-accent text-muted-foreground text-sm"
                        onMouseDown={() => { setForm({ ...form, category: "" }); setCategorySearch(""); setCategoryDropdownOpen(false); }}
                      >
                        Select a category
                      </div>
                    )}
                    {CATEGORIES.filter((cat) => cat.toLowerCase().includes(categorySearch.toLowerCase())).map((cat) => (
                      <div
                        key={cat}
                        className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${form.category === cat ? "bg-accent font-medium" : ""}`}
                        onMouseDown={() => { setForm({ ...form, category: cat }); setCategorySearch(""); setCategoryDropdownOpen(false); }}
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
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
