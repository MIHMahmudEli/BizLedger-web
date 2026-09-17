"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, Calendar, CreditCard, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
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
import type { PaginatedResponse, OutstandingProject, Payment, PaymentMethod } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

type Tab = "outstanding" | "payments";

const PAYMENT_METHODS: { value: PaymentMethod | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Methods" },
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CARD", label: "Card" },
  { value: "MOBILE_BANKING", label: "Mobile Banking" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

const PROJECT_TYPES = [
  "Web Development", "Mobile App", "Desktop Application", "E-Commerce",
  "ERP System", "CRM System", "UI/UX Design", "API Development",
  "Cloud Migration", "DevOps", "Data Analytics", "AI/ML",
  "Consulting", "Maintenance", "Other",
];

const METHOD_COLORS: Record<PaymentMethod, string> = {
  CASH: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  BANK_TRANSFER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  CARD: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  MOBILE_BANKING: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  CHEQUE: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash", BANK_TRANSFER: "Bank Transfer", CARD: "Card",
  MOBILE_BANKING: "Mobile Banking", CHEQUE: "Cheque", OTHER: "Other",
};

const STATUS_COLORS: Record<string, string> = {
  UNPAID: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  PARTIALLY_PAID: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  OVERPAID: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

const STATUS_LABELS: Record<string, string> = {
  UNPAID: "Unpaid", PARTIALLY_PAID: "Partial", PAID: "Paid", OVERPAID: "Overpaid",
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("outstanding");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Outstanding balances and payment analytics</p>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        <button
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "outstanding"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("outstanding")}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Outstanding Report
          </div>
        </button>
        <button
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "payments"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("payments")}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Payment Report
          </div>
        </button>
      </div>

      {activeTab === "outstanding" && <OutstandingSection />}
      {activeTab === "payments" && <PaymentReportSection />}
    </div>
  );
}

function OutstandingSection() {
  const [projects, setProjects] = useState<OutstandingProject[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [projectType, setProjectType] = useState("");
  const [projectTypeSearch, setProjectTypeSearch] = useState("");
  const [projectTypeDropdownOpen, setProjectTypeDropdownOpen] = useState(false);
  const [minDue, setMinDue] = useState("");
  const [maxDue, setMaxDue] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchOutstanding = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (projectType) params.projectType = projectType;
      if (minDue) params.minDue = minDue;
      if (maxDue) params.maxDue = maxDue;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const response = await api.get<PaginatedResponse<OutstandingProject>>("/reports/outstanding", { params });
      setProjects(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      console.error("Failed to fetch outstanding report:", error);
    } finally {
      setLoading(false);
    }
  }, [page, projectType, minDue, maxDue, dateFrom, dateTo]);

  useEffect(() => { fetchOutstanding(); }, [fetchOutstanding]);

  const hasFilters = projectType || minDue || maxDue || dateFrom || dateTo;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-end gap-3 mb-6">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Type</label>
            <div className="relative">
              <Input
                value={projectType || projectTypeSearch}
                onChange={(e) => { setProjectTypeSearch(e.target.value); setProjectTypeDropdownOpen(true); if (projectType) { setProjectType(""); setPage(1); } }}
                onFocus={() => setProjectTypeDropdownOpen(true)}
                onBlur={() => setTimeout(() => setProjectTypeDropdownOpen(false), 200)}
                placeholder="All Types"
                className="w-44"
              />
              {projectTypeDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                  {!projectTypeSearch && (
                    <div className="px-3 py-2 cursor-pointer hover:bg-accent text-muted-foreground"
                      onMouseDown={() => { setProjectType(""); setProjectTypeSearch(""); setProjectTypeDropdownOpen(false); setPage(1); }}>
                      All Types
                    </div>
                  )}
                  {PROJECT_TYPES.filter((type) => type.toLowerCase().includes(projectTypeSearch.toLowerCase())).map((type) => (
                    <div key={type} className={`px-3 py-2 cursor-pointer hover:bg-accent ${projectType === type ? "bg-accent" : ""}`}
                      onMouseDown={() => { setProjectType(type); setProjectTypeSearch(""); setProjectTypeDropdownOpen(false); setPage(1); }}>
                      {type}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Min Due</label>
            <Input type="number" placeholder="0" value={minDue} onChange={(e) => { setMinDue(e.target.value); setPage(1); }} className="w-28" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Max Due</label>
            <Input type="number" placeholder="No limit" value={maxDue} onChange={(e) => { setMaxDue(e.target.value); setPage(1); }} className="w-28" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Date From</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="pl-9" />
            </div>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => { setProjectType(""); setMinDue(""); setMaxDue(""); setDateFrom(""); setDateTo(""); setProjectTypeSearch(""); }}
              className="text-muted-foreground h-9">
              Clear
            </Button>
          )}
        </div>

        {loading ? (
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Project</TableHead>
                  <TableHead className="font-semibold">Company</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold text-right">Total</TableHead>
                  <TableHead className="font-semibold text-right">Paid</TableHead>
                  <TableHead className="font-semibold text-right">Due</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mb-4 opacity-40" />
            <p className="text-lg font-medium">No outstanding projects</p>
            <p className="text-sm mt-1">All projects are fully paid</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Project</TableHead>
                <TableHead className="font-semibold">Company</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold text-right">Total</TableHead>
                <TableHead className="font-semibold text-right">Paid</TableHead>
                <TableHead className="font-semibold text-right">Due</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{project.projectName}</span>
                    </div>
                  </TableCell>
                  <TableCell><span className="text-sm text-muted-foreground">{project.companyName}</span></TableCell>
                  <TableCell><span className="text-sm">{project.projectType}</span></TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(project.totalValue)}</TableCell>
                  <TableCell className="text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(project.totalPaid)}</TableCell>
                  <TableCell className="text-right font-semibold text-red-600 dark:text-red-400">{formatCurrency(project.due)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${STATUS_COLORS[project.paymentStatus] || ""} font-normal`}>
                      {STATUS_LABELS[project.paymentStatus] || project.paymentStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>Next</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentReportSection() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "ALL">("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (paymentMethod !== "ALL") params.paymentMethod = paymentMethod;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const response = await api.get<PaginatedResponse<Payment>>("/reports/payments", { params });
      setPayments(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      console.error("Failed to fetch payment report:", error);
    } finally {
      setLoading(false);
    }
  }, [page, paymentMethod, dateFrom, dateTo]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const hasFilters = paymentMethod !== "ALL" || dateFrom || dateTo;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-end gap-3 mb-6">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">From</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="pl-9" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">To</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="pl-9" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Method</label>
            <Select value={paymentMethod} onValueChange={(value) => { setPaymentMethod(value as PaymentMethod | "ALL"); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Methods" /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => { setPaymentMethod("ALL"); setDateFrom(""); setDateTo(""); }}
              className="text-muted-foreground h-9">
              Clear
            </Button>
          )}
        </div>

        {loading ? (
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Method</TableHead>
                  <TableHead className="font-semibold">Reference</TableHead>
                  <TableHead className="font-semibold">Project</TableHead>
                  <TableHead className="font-semibold">Company</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CreditCard className="h-12 w-12 mb-4 opacity-40" />
            <p className="text-lg font-medium">No payments found</p>
            <p className="text-sm mt-1">No payment records match your filters</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Method</TableHead>
                <TableHead className="font-semibold">Reference</TableHead>
                <TableHead className="font-semibold">Project</TableHead>
                <TableHead className="font-semibold">Company</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <CreditCard className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-sm">{formatDate(payment.paymentDate)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(payment.amount)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${METHOD_COLORS[payment.paymentMethod]} font-normal`}>
                      {METHOD_LABELS[payment.paymentMethod]}
                    </Badge>
                  </TableCell>
                  <TableCell><span className="text-sm text-muted-foreground">{payment.reference || "-"}</span></TableCell>
                  <TableCell><span className="text-sm font-medium">{payment.projectName || "-"}</span></TableCell>
                  <TableCell><span className="text-sm text-muted-foreground">{payment.companyName || "-"}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>Next</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
