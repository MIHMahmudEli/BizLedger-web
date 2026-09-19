"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, CreditCard, FileText, DollarSign, Wallet, AlertTriangle, Printer, Loader2 } from "lucide-react";
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
import type { Company, PaginatedResponse, Payment, PaymentMethod, Project, ProjectFinancial } from "@/types";
import { formatCurrency, formatCurrencyCompact, formatDate } from "@/lib/utils";
import { openPrintWindow, writePrintReport } from "@/lib/print";

const REPORT_TABS = [
  { value: "payments", label: "Payment Report" },
  { value: "details", label: "Details Report" },
] as const;

type ReportTab = (typeof REPORT_TABS)[number]["value"];

const PAYMENT_METHODS: { value: PaymentMethod | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Methods" },
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CARD", label: "Card" },
  { value: "MOBILE_BANKING", label: "Mobile Banking" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
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

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>("payments");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Payment analytics</p>
        </div>
      </div>

      <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
        {REPORT_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === t.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "payments" ? <PaymentReportSection /> : <DetailsReportSection />}
    </div>
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filterCompanyId, setFilterCompanyId] = useState("");
  const [companyFilterSearch, setCompanyFilterSearch] = useState("");
  const [companyFilterDropdownOpen, setCompanyFilterDropdownOpen] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await api.get<PaginatedResponse<Company>>("/companies", { params: { limit: 100 } });
        setCompanies(response.data.data);
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      }
    })();
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (paymentMethod !== "ALL") params.paymentMethod = paymentMethod;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (filterCompanyId) params.companyId = filterCompanyId;
      const response = await api.get<PaginatedResponse<Payment>>("/reports/payments", { params });
      setPayments(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      console.error("Failed to fetch payment report:", error);
    } finally {
      setLoading(false);
    }
  }, [page, paymentMethod, dateFrom, dateTo, filterCompanyId]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const hasFilters = paymentMethod !== "ALL" || dateFrom || dateTo || filterCompanyId;

  const handlePrint = async () => {
    const win = openPrintWindow();
    if (!win) {
      alert("Please allow pop-ups for this site to print.");
      return;
    }
    setPrinting(true);
    try {
      const all: Payment[] = [];
      let pageNum = 1;
      let totalPages = 1;
      do {
        const params: Record<string, string | number> = { page: pageNum, limit: 100 };
        if (paymentMethod !== "ALL") params.paymentMethod = paymentMethod;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;
        if (filterCompanyId) params.companyId = filterCompanyId;
        const response = await api.get<PaginatedResponse<Payment>>("/reports/payments", { params });
        all.push(...response.data.data);
        totalPages = response.data.meta.totalPages;
        pageNum += 1;
      } while (pageNum <= totalPages);

      const totalAmount = all.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      const filters: string[] = [];
      if (dateFrom) filters.push(`From: ${dateFrom}`);
      if (dateTo) filters.push(`To: ${dateTo}`);
      if (paymentMethod !== "ALL") filters.push(`Method: ${METHOD_LABELS[paymentMethod]}`);
      if (filterCompanyId) filters.push(`Company: ${companies.find((c) => c.id === filterCompanyId)?.companyName ?? filterCompanyId}`);

      writePrintReport(win, {
        title: "Payment Report",
        filters,
        summary: [
          { label: "Total Payments", value: String(all.length) },
          { label: "Total Amount", value: formatCurrency(totalAmount) },
        ],
        columns: [
          { header: "Date", accessor: (p) => formatDate(p.paymentDate) },
          { header: "Amount", accessor: (p) => formatCurrency(p.amount), align: "right" },
          { header: "Method", accessor: (p) => METHOD_LABELS[p.paymentMethod] },
          { header: "Reference", accessor: (p) => p.reference || "-" },
          { header: "Project", accessor: (p) => p.projectName || "-" },
          { header: "Company", accessor: (p) => p.companyName || "-" },
        ],
        rows: all,
        totals: { label: "Total", values: { Amount: formatCurrency(totalAmount) } },
        emptyMessage: "No payments match the current filters.",
      });
    } catch {
      win.close();
      alert("Failed to prepare the print report. Please try again.");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-end gap-3 mb-6 flex-wrap">
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
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Company</label>
            <div className="relative">
              <Input
                value={companies.find((c) => c.id === filterCompanyId)?.companyName || companyFilterSearch}
                onChange={(e) => {
                  setCompanyFilterSearch(e.target.value);
                  setCompanyFilterDropdownOpen(true);
                  if (filterCompanyId) { setFilterCompanyId(""); setPage(1); }
                }}
                onFocus={() => setCompanyFilterDropdownOpen(true)}
                onBlur={() => setTimeout(() => setCompanyFilterDropdownOpen(false), 200)}
                placeholder="All Companies"
                className="w-48"
              />
              {companyFilterDropdownOpen && (
                <div className="absolute z-50 w-48 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                  {!companyFilterSearch && !filterCompanyId && (
                    <div
                      className="px-3 py-2 cursor-pointer hover:bg-accent text-muted-foreground text-sm"
                      onMouseDown={() => { setFilterCompanyId(""); setCompanyFilterSearch(""); setCompanyFilterDropdownOpen(false); setPage(1); }}
                    >
                      All Companies
                    </div>
                  )}
                  {companies
                    .filter((c) => c.companyName.toLowerCase().includes(companyFilterSearch.toLowerCase()))
                    .map((c) => (
                      <div
                        key={c.id}
                        className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${filterCompanyId === c.id ? "bg-accent font-medium" : ""}`}
                        onMouseDown={() => { setFilterCompanyId(c.id); setCompanyFilterSearch(""); setCompanyFilterDropdownOpen(false); setPage(1); }}
                      >
                        {c.companyName}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => { setPaymentMethod("ALL"); setDateFrom(""); setDateTo(""); setFilterCompanyId(""); setCompanyFilterSearch(""); }}
              className="text-muted-foreground h-9">
              Clear
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={printing} className="gap-1.5 h-9 ml-auto">
            {printing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            Print
          </Button>
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

interface DetailsRow extends Project {
  financial?: ProjectFinancial;
}

function DetailsReportSection() {
  const [rows, setRows] = useState<DetailsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filterCompanyId, setFilterCompanyId] = useState("");
  const [companyFilterSearch, setCompanyFilterSearch] = useState("");
  const [companyFilterDropdownOpen, setCompanyFilterDropdownOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await api.get<PaginatedResponse<Company>>("/companies", { params: { limit: 100 } });
        setCompanies(response.data.data);
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      }
    })();
  }, []);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: 1, limit: 100 };
      if (filterCompanyId) params.companyId = filterCompanyId;

      const first = await api.get<PaginatedResponse<DetailsRow>>("/projects", { params });
      let all = first.data.data;
      const { totalPages } = first.data.meta;

      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            api.get<PaginatedResponse<DetailsRow>>("/projects", { params: { ...params, page: i + 2 } })
          )
        );
        all = all.concat(...rest.map((r) => r.data.data));
      }

      setRows(all);
    } catch (error) {
      console.error("Failed to fetch details report:", error);
    } finally {
      setLoading(false);
    }
  }, [filterCompanyId]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  const totals = rows.reduce(
    (acc, row) => {
      acc.value += parseFloat(row.totalValue) || 0;
      acc.paid += parseFloat(row.financial?.totalPaid ?? "0") || 0;
      acc.due += parseFloat(row.financial?.due ?? "0") || 0;
      return acc;
    },
    { value: 0, paid: 0, due: 0 }
  );

  const handlePrint = () => {
    const win = openPrintWindow();
    if (!win) {
      alert("Please allow pop-ups for this site to print.");
      return;
    }

    const filters: string[] = [];
    if (filterCompanyId) filters.push(`Company: ${companies.find((c) => c.id === filterCompanyId)?.companyName ?? filterCompanyId}`);

    writePrintReport(win, {
      title: "Details Report",
      filters,
      summary: [
        { label: "Total Projects", value: String(rows.length) },
        { label: "Total Value", value: formatCurrency(totals.value) },
        { label: "Total Paid", value: formatCurrency(totals.paid) },
        { label: "Total Due", value: formatCurrency(totals.due) },
      ],
      columns: [
        { header: "Project", accessor: (r) => r.projectName },
        { header: "Company", accessor: (r) => r.company?.companyName ?? "-" },
        { header: "Type", accessor: (r) => r.projectType || "-" },
        { header: "Value", accessor: (r) => formatCurrency(r.totalValue), align: "right" },
        { header: "Paid", accessor: (r) => formatCurrency(r.financial?.totalPaid ?? 0), align: "right" },
        { header: "Due", accessor: (r) => formatCurrency(r.financial?.due ?? 0), align: "right" },
      ],
      rows,
      totals: {
        label: "Total",
        values: {
          Value: formatCurrency(totals.value),
          Paid: formatCurrency(totals.paid),
          Due: formatCurrency(totals.due),
        },
      },
      emptyMessage: "No projects match the current filters.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5 pb-5 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold truncate" title={formatCurrency(totals.value)}>
                  {formatCurrencyCompact(totals.value)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 shrink-0">
                <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 truncate" title={formatCurrency(totals.paid)}>
                  {formatCurrencyCompact(totals.paid)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Total Due</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 truncate" title={formatCurrency(totals.due)}>
                  {formatCurrencyCompact(totals.due)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-3 mb-6 flex-wrap">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Company</label>
              <div className="relative">
                <Input
                  value={companies.find((c) => c.id === filterCompanyId)?.companyName || companyFilterSearch}
                  onChange={(e) => {
                    setCompanyFilterSearch(e.target.value);
                    setCompanyFilterDropdownOpen(true);
                    if (filterCompanyId) setFilterCompanyId("");
                  }}
                  onFocus={() => setCompanyFilterDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setCompanyFilterDropdownOpen(false), 200)}
                  placeholder="All Companies"
                  className="w-56"
                />
                {companyFilterDropdownOpen && (
                  <div className="absolute z-50 w-56 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {!companyFilterSearch && !filterCompanyId && (
                      <div
                        className="px-3 py-2 cursor-pointer hover:bg-accent text-muted-foreground text-sm"
                        onMouseDown={() => { setFilterCompanyId(""); setCompanyFilterSearch(""); setCompanyFilterDropdownOpen(false); }}
                      >
                        All Companies
                      </div>
                    )}
                    {companies
                      .filter((c) => c.companyName.toLowerCase().includes(companyFilterSearch.toLowerCase()))
                      .map((c) => (
                        <div
                          key={c.id}
                          className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${filterCompanyId === c.id ? "bg-accent font-medium" : ""}`}
                          onMouseDown={() => { setFilterCompanyId(c.id); setCompanyFilterSearch(""); setCompanyFilterDropdownOpen(false); }}
                        >
                          {c.companyName}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            {filterCompanyId && (
              <Button variant="ghost" size="sm" onClick={() => { setFilterCompanyId(""); setCompanyFilterSearch(""); }}
                className="text-muted-foreground h-9">
                Clear
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 h-9 ml-auto">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>

          {loading ? (
            <div className="p-4">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Project</TableHead>
                    <TableHead className="font-semibold">Company</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold text-right">Value</TableHead>
                    <TableHead className="font-semibold text-right">Paid</TableHead>
                    <TableHead className="font-semibold text-right">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">No projects found</p>
              <p className="text-sm mt-1">No projects match your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Project</TableHead>
                  <TableHead className="font-semibold">Company</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold text-right">Value</TableHead>
                  <TableHead className="font-semibold text-right">Paid</TableHead>
                  <TableHead className="font-semibold text-right">Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell><span className="text-sm font-medium">{row.projectName}</span></TableCell>
                    <TableCell><span className="text-sm text-muted-foreground">{row.company?.companyName ?? "-"}</span></TableCell>
                    <TableCell>
                      {row.projectType ? (
                        <Badge variant="secondary" className="font-normal">{row.projectType}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(row.totalValue)}</TableCell>
                    <TableCell className="text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(row.financial?.totalPaid ?? 0)}</TableCell>
                    <TableCell className="text-right text-red-600 dark:text-red-400">{formatCurrency(row.financial?.due ?? 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <tfoot>
                <TableRow className="hover:bg-transparent border-t-2 font-semibold">
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.value)}</TableCell>
                  <TableCell className="text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(totals.paid)}</TableCell>
                  <TableCell className="text-right text-red-600 dark:text-red-400">{formatCurrency(totals.due)}</TableCell>
                </TableRow>
              </tfoot>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
