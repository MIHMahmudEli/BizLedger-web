"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  Phone,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";

const DESIGNATIONS = [
  "Owner", "Manager", "Director", "CEO", "CTO", "CFO",
  "Accountant", "HR Manager", "Sales Manager", "Marketing Manager",
  "Project Manager", "Developer", "Designer", "Consultant", "Assistant", "Other",
];

const DESIGNATION_COLORS: Record<string, string> = {
  Owner: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Manager: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Director: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  CEO: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  CTO: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  CFO: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  Accountant: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "HR Manager": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  "Sales Manager": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  "Marketing Manager": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  "Project Manager": "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  Developer: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  Designer: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200",
  Consultant: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  Assistant: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200",
  Other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

interface ContactWithCompany {
  id: string;
  companyId: string;
  name: string;
  designation?: string;
  mobile?: string;
  email?: string;
  companyName?: string;
  createdAt: string;
}

interface PaginatedResponse {
  data: ContactWithCompany[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactWithCompany[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);

  const [filterDesignation, setFilterDesignation] = useState("");
  const [designationSearch, setDesignationSearch] = useState("");
  const [designationDropdownOpen, setDesignationDropdownOpen] = useState(false);

  const [filterCompanyId, setFilterCompanyId] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);

  const uniqueDesignations = [...new Set(contacts.map((c) => c.designation).filter(Boolean))] as string[];

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit, search: debouncedSearch };
      if (filterDesignation) params.designation = filterDesignation;
      if (filterCompanyId) params.companyId = filterCompanyId;
      const response = await api.get<PaginatedResponse>("/contacts", { params });
      setContacts(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filterDesignation, filterCompanyId]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const fetchCompanies = async () => {
    try {
      const response = await api.get("/companies", { params: { limit: 100 } });
      setCompanies(response.data.data);
    } catch {}
  };

  const filteredCompanies = companies.filter((c) => c.companyName.toLowerCase().includes(companySearch.toLowerCase()));
  const selectedCompany = companies.find((c) => c.id === filterCompanyId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground">Manage your business contacts and team members</p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">{meta.total} contacts</Badge>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="relative">
            <Input
              value={filterDesignation || designationSearch}
              onChange={(e) => { setDesignationSearch(e.target.value); setDesignationDropdownOpen(true); if (filterDesignation) setFilterDesignation(""); }}
              onFocus={() => setDesignationDropdownOpen(true)}
              onBlur={() => setTimeout(() => setDesignationDropdownOpen(false), 200)}
              placeholder="Designation..."
              className="w-40"
            />
            {designationDropdownOpen && uniqueDesignations.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                {!designationSearch && !filterDesignation && (
                  <div className="px-3 py-2 cursor-pointer hover:bg-accent text-muted-foreground text-sm"
                    onMouseDown={() => { setFilterDesignation(""); setDesignationSearch(""); setDesignationDropdownOpen(false); }}>
                    All Designations
                  </div>
                )}
                {uniqueDesignations.filter((d) => d.toLowerCase().includes(designationSearch.toLowerCase())).map((d) => (
                  <div key={d} className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${filterDesignation === d ? "bg-accent font-medium" : ""}`}
                    onMouseDown={() => { setFilterDesignation(d); setDesignationSearch(""); setDesignationDropdownOpen(false); }}>
                    {d}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <Input
              value={companySearch || selectedCompany?.companyName || ""}
              onChange={(e) => { setCompanySearch(e.target.value); setCompanyDropdownOpen(true); if (filterCompanyId) setFilterCompanyId(""); }}
              onFocus={() => { setCompanyDropdownOpen(true); fetchCompanies(); }}
              onBlur={() => setTimeout(() => setCompanyDropdownOpen(false), 200)}
              placeholder="Company..."
              className="w-48"
            />
            {companyDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                {!companySearch && !filterCompanyId && (
                  <div className="px-3 py-2 cursor-pointer hover:bg-accent text-muted-foreground text-sm"
                    onMouseDown={() => { setFilterCompanyId(""); setCompanySearch(""); setCompanyDropdownOpen(false); }}>
                    All Companies
                  </div>
                )}
                {filteredCompanies.map((c) => (
                  <div key={c.id} className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${filterCompanyId === c.id ? "bg-accent font-medium" : ""}`}
                    onMouseDown={() => { setFilterCompanyId(c.id); setCompanySearch(""); setCompanyDropdownOpen(false); }}>
                    {c.companyName}
                  </div>
                ))}
              </div>
            )}
          </div>
          {(filterDesignation || filterCompanyId || search) && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterDesignation(""); setFilterCompanyId(""); setSearch(""); setDesignationSearch(""); setCompanySearch(""); }}
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
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">No contacts found</p>
              <p className="text-sm mt-1">Contacts will appear here once added to companies</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold">Designation</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Company</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                          <span className="text-sm font-medium text-primary">
                            {contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium">{contact.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.designation ? (
                        <Badge variant="secondary" className={`${DESIGNATION_COLORS[contact.designation] || ""} font-normal`}>
                          {contact.designation}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.mobile ? (
                        <span className="flex items-center gap-1.5 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {contact.mobile}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.email ? (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          {contact.email}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.companyName ? (
                        <span className="flex items-center gap-1.5 text-sm">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                          {contact.companyName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{formatDate(contact.createdAt)}</span>
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
            Showing {(meta.page - 1) * meta.limit + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </p>
          <div className="flex items-center gap-2">
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
    </div>
  );
}
