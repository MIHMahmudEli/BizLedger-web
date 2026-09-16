"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import type { Company, PaginatedResponse } from "@/types";

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

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactWithCompany[]>([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
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
  const [companies, setCompanies] = useState<Company[]>([]);

  const uniqueDesignations = [...new Set(contacts.map((c) => c.designation).filter(Boolean))] as string[];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit, search: debouncedSearch };
      if (filterDesignation) params.designation = filterDesignation;
      if (filterCompanyId) params.companyId = filterCompanyId;
      const response = await api.get("/contacts", { params });
      setContacts(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filterDesignation, filterCompanyId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const fetchCompanies = async () => {
    try {
      const response = await api.get<PaginatedResponse<Company>>("/companies", { params: { limit: 100 } });
      setCompanies(response.data.data);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  };

  const filteredCompanies = companies.filter((c) =>
    c.companyName.toLowerCase().includes(companySearch.toLowerCase())
  );

  const selectedCompany = companies.find((c) => c.id === filterCompanyId);

  const filteredDesignations = uniqueDesignations.filter((d) =>
    d.toLowerCase().includes(designationSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Contacts</h1>
        </div>
        <Badge variant="secondary">{meta.total} total</Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">Show</Label>
                <Select
                  value={String(limit)}
                  onValueChange={(value) => {
                    setLimit(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
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
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Input
                  value={filterDesignation || designationSearch}
                  onChange={(e) => {
                    setDesignationSearch(e.target.value);
                    setDesignationDropdownOpen(true);
                    if (filterDesignation) {
                      setFilterDesignation("");
                      setPage(1);
                    }
                  }}
                  onFocus={() => {
                    setDesignationDropdownOpen(true);
                    fetchContacts();
                  }}
                  onBlur={() => setTimeout(() => setDesignationDropdownOpen(false), 200)}
                  placeholder="Filter by designation..."
                  className="w-48"
                />
                {designationDropdownOpen && filteredDesignations.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {!designationSearch && !filterDesignation && (
                      <div
                        className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                        onMouseDown={() => {
                          setFilterDesignation("");
                          setDesignationSearch("");
                          setDesignationDropdownOpen(false);
                          setPage(1);
                        }}
                      >
                        All Designations
                      </div>
                    )}
                    {filteredDesignations.map((d) => (
                      <div
                        key={d}
                        className={`px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground ${
                          filterDesignation === d ? "bg-accent" : ""
                        }`}
                        onMouseDown={() => {
                          setFilterDesignation(d);
                          setDesignationSearch("");
                          setDesignationDropdownOpen(false);
                          setPage(1);
                        }}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <Input
                  value={companySearch || selectedCompany?.companyName || ""}
                  onChange={(e) => {
                    setCompanySearch(e.target.value);
                    setCompanyDropdownOpen(true);
                    if (filterCompanyId) {
                      setFilterCompanyId("");
                      setPage(1);
                    }
                  }}
                  onFocus={() => {
                    setCompanyDropdownOpen(true);
                    fetchCompanies();
                  }}
                  onBlur={() => setTimeout(() => setCompanyDropdownOpen(false), 200)}
                  placeholder="Filter by company..."
                  className="w-56"
                />
                {companyDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {!companySearch && !filterCompanyId && (
                      <div
                        className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                        onMouseDown={() => {
                          setFilterCompanyId("");
                          setCompanySearch("");
                          setCompanyDropdownOpen(false);
                          setPage(1);
                        }}
                      >
                        All Companies
                      </div>
                    )}
                    {filteredCompanies.map((c) => (
                      <div
                        key={c.id}
                        className={`px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground ${
                          filterCompanyId === c.id ? "bg-accent" : ""
                        }`}
                        onMouseDown={() => {
                          setFilterCompanyId(c.id);
                          setCompanySearch("");
                          setCompanyDropdownOpen(false);
                          setPage(1);
                        }}
                      >
                        {c.companyName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {(filterDesignation || filterCompanyId) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterDesignation("");
                    setFilterCompanyId("");
                    setDesignationSearch("");
                    setCompanySearch("");
                    setPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No contacts found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.name}
                    </TableCell>
                    <TableCell>{contact.designation ?? "-"}</TableCell>
                    <TableCell>{contact.mobile ?? "-"}</TableCell>
                    <TableCell>{contact.email ?? "-"}</TableCell>
                    <TableCell>{contact.companyName ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(contact.createdAt)}
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
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
