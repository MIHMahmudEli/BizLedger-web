"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import type {
  PaginatedResponse,
  OutstandingProject,
  Payment,
  PaymentMethod,
} from "@/types";
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

const METHOD_COLORS: Record<PaymentMethod, string> = {
  CASH: "bg-emerald-100 text-emerald-800",
  BANK_TRANSFER: "bg-blue-100 text-blue-800",
  CARD: "bg-purple-100 text-purple-800",
  MOBILE_BANKING: "bg-amber-100 text-amber-800",
  CHEQUE: "bg-cyan-100 text-cyan-800",
  OTHER: "bg-gray-100 text-gray-800",
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card",
  MOBILE_BANKING: "Mobile Banking",
  CHEQUE: "Cheque",
  OTHER: "Other",
};

const STATUS_COLORS: Record<string, string> = {
  UNPAID: "bg-red-100 text-red-800",
  PARTIALLY_PAID: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  OVERPAID: "bg-blue-100 text-blue-800",
};

const STATUS_LABELS: Record<string, string> = {
  UNPAID: "Unpaid",
  PARTIALLY_PAID: "Partial",
  PAID: "Paid",
  OVERPAID: "Overpaid",
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("outstanding");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Reports</h1>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [projectType, setProjectType] = useState("");
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

      const response = await api.get<PaginatedResponse<OutstandingProject>>(
        "/reports/outstanding",
        { params }
      );
      setProjects(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      console.error("Failed to fetch outstanding report:", error);
    } finally {
      setLoading(false);
    }
  }, [page, projectType, minDue, maxDue, dateFrom, dateTo]);

  useEffect(() => {
    fetchOutstanding();
  }, [fetchOutstanding]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Outstanding Projects</CardTitle>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Project Type</Label>
            <Input
              placeholder="e.g. Web Development"
              value={projectType}
              onChange={(e) => {
                setProjectType(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minDue">Min Due</Label>
            <Input
              id="minDue"
              type="number"
              placeholder="0"
              value={minDue}
              onChange={(e) => {
                setMinDue(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxDue">Max Due</Label>
            <Input
              id="maxDue"
              type="number"
              placeholder="No limit"
              value={maxDue}
              onChange={(e) => {
                setMaxDue(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="outstandingDateFrom">Date From</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="outstandingDateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No outstanding projects found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    {project.projectName}
                  </TableCell>
                  <TableCell>{project.companyName}</TableCell>
                  <TableCell>{project.projectType}</TableCell>
                  <TableCell>{formatCurrency(project.totalValue)}</TableCell>
                  <TableCell>{formatCurrency(project.totalPaid)}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(project.due)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={STATUS_COLORS[project.paymentStatus] || ""}
                    >
                      {STATUS_LABELS[project.paymentStatus] || project.paymentStatus}
                    </Badge>
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
                onClick={() =>
                  setPage((p) => Math.min(meta.totalPages, p + 1))
                }
                disabled={page === meta.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentReportSection() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
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

      const response = await api.get<PaginatedResponse<Payment>>(
        "/reports/payments",
        { params }
      );
      setPayments(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      console.error("Failed to fetch payment report:", error);
    } finally {
      setLoading(false);
    }
  }, [page, paymentMethod, dateFrom, dateTo]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payment History</CardTitle>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="payDateFrom">Date From</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="payDateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payDateTo">Date To</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="payDateTo"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => {
                setPaymentMethod(value as PaymentMethod | "ALL");
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No payments found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Company</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={METHOD_COLORS[payment.paymentMethod]}
                    >
                      {METHOD_LABELS[payment.paymentMethod]}
                    </Badge>
                  </TableCell>
                  <TableCell>{payment.reference || "N/A"}</TableCell>
                  <TableCell>{payment.projectName || "N/A"}</TableCell>
                  <TableCell>{payment.companyName || "N/A"}</TableCell>
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
                onClick={() =>
                  setPage((p) => Math.min(meta.totalPages, p + 1))
                }
                disabled={page === meta.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
