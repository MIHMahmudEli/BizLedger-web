"use client";

import { useState, useEffect, useCallback } from "react";
import { CreditCard, Search, Calendar, X, Banknote } from "lucide-react";
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
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { Payment, PaginatedResponse, PaymentMethod } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

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
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card",
  MOBILE_BANKING: "Mobile Banking",
  CHEQUE: "Cheque",
  OTHER: "Other",
};

export default function PaymentsPage() {
  // Hidden for now for all user types — remove this guard to re-enable
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
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
      const response = await api.get<PaginatedResponse<Payment>>("/payments", { params });
      setPayments(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  }, [page, paymentMethod, dateFrom, dateTo]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const hasFilters = paymentMethod !== "ALL" || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground">View and track all payment transactions</p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1 w-fit">{meta.total} payments</Badge>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="grid gap-3 md:grid-cols-3 flex-1">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">From</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">To</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Method</label>
              <Select value={paymentMethod} onValueChange={(value) => { setPaymentMethod(value as PaymentMethod | "ALL"); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="All Methods" /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => { setPaymentMethod("ALL"); setDateFrom(""); setDateTo(""); }}
              className="text-muted-foreground mt-4">
              <X className="h-4 w-4 mr-1" />Clear
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
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
                    <TableHead className="font-semibold">Note</TableHead>
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
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Banknote className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">No payments found</p>
              <p className="text-sm mt-1">Payments will appear here once recorded</p>
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
                  <TableHead className="font-semibold">Note</TableHead>
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
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(payment.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${METHOD_COLORS[payment.paymentMethod]} font-normal`}>
                        {METHOD_LABELS[payment.paymentMethod]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{payment.reference || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{payment.projectName || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{payment.companyName || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground max-w-[200px] truncate block">{payment.note || "-"}</span>
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
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
