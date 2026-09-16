"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Payment,
  PaymentMethod,
  PaginatedResponse,
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

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card",
  MOBILE_BANKING: "Mobile Banking",
  CHEQUE: "Cheque",
  OTHER: "Other",
};

interface PaymentForm {
  amount: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  reference: string;
  note: string;
}

const initialPaymentForm: PaymentForm = {
  amount: "",
  paymentDate: new Date().toISOString().split("T")[0],
  paymentMethod: "CASH",
  reference: "",
  note: "",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project & { financial?: ProjectFinancial } | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMeta, setPaymentMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(initialPaymentForm);
  const [submitting, setSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchPayments();
  }, [projectId]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ data: Project & { financial?: ProjectFinancial } }>(
        `/projects/${projectId}`
      );
      setProject(response.data.data);
    } catch (error) {
      console.error("Failed to fetch project:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async (paymentPage = 1) => {
    setPaymentsLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Payment>>(
        `/projects/${projectId}/payments`,
        { params: { page: paymentPage, limit: 10 } }
      );
      setPayments(response.data.data);
      setPaymentMeta(response.data.meta);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const openAddPaymentDialog = () => {
    setEditingPaymentId(null);
    setPaymentForm(initialPaymentForm);
    setPaymentDialogOpen(true);
  };

  const openEditPaymentDialog = (payment: Payment) => {
    setEditingPaymentId(payment.id);
    setPaymentForm({
      amount: payment.amount,
      paymentDate: payment.paymentDate.split("T")[0],
      paymentMethod: payment.paymentMethod,
      reference: payment.reference || "",
      note: payment.note || "",
    });
    setPaymentDialogOpen(true);
  };

  const openDeleteDialog = (paymentId: string) => {
    setDeletingPaymentId(paymentId);
    setDeleteOpen(true);
  };

  const handlePaymentFormChange = (
    field: keyof PaymentForm,
    value: string
  ) => {
    setPaymentForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePaymentSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...paymentForm,
        amount: parseFloat(paymentForm.amount) || 0,
        reference: paymentForm.reference || undefined,
        note: paymentForm.note || undefined,
      };

      if (editingPaymentId) {
        await api.patch(`/payments/${editingPaymentId}`, payload);
      } else {
        await api.post(`/projects/${projectId}/payments`, payload);
      }

      setPaymentDialogOpen(false);
      setEditingPaymentId(null);
      setPaymentForm(initialPaymentForm);
      fetchProject();
      fetchPayments();
    } catch (error) {
      console.error("Failed to save payment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!deletingPaymentId) return;
    setDeleting(true);
    try {
      await api.delete(`/payments/${deletingPaymentId}`);
      setDeleteOpen(false);
      setDeletingPaymentId(null);
      fetchProject();
      fetchPayments();
    } catch (error) {
      console.error("Failed to delete payment:", error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">Loading...</div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Project not found
      </div>
    );
  }

  const financial = project.financial;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project.projectName}</h1>
          <p className="text-muted-foreground">{project.projectType}</p>
        </div>
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
      </div>

      {/* Project Info + Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Project Name</span>
              <span className="font-medium">{project.projectName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{project.projectType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Value</span>
              <span className="font-medium">
                {formatCurrency(project.totalValue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
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
            </div>
            {project.startDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Start Date
                </span>
                <span className="font-medium">
                  {formatDate(project.startDate)}
                </span>
              </div>
            )}
            {project.deadline && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Deadline
                </span>
                <span className="font-medium">
                  {formatDate(project.deadline)}
                </span>
              </div>
            )}
            {project.description && (
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Description
                </span>
                <p className="text-sm">{project.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Value</span>
              <span className="font-medium text-lg">
                {formatCurrency(project.totalValue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Paid</span>
              <span className="font-medium text-lg text-emerald-600">
                {formatCurrency(financial?.totalPaid ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due</span>
              <span className="font-medium text-lg text-amber-600">
                {formatCurrency(financial?.due ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payments</span>
              <span className="font-medium">{financial?.paymentCount ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Payment Status</span>
              <Badge
                variant={
                  financial?.paymentStatus
                    ? (PAYMENT_STATUS_VARIANT[financial.paymentStatus] as
                        | "secondary"
                        | "info"
                        | "warning"
                        | "success"
                        | "destructive")
                    : "secondary"
                }
              >
                {financial?.paymentStatus
                  ? PAYMENT_STATUS_LABELS[financial.paymentStatus]
                  : "N/A"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payments
            </CardTitle>
            <Button size="sm" onClick={openAddPaymentDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading payments...
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payments recorded yet
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.reference || "—"}</TableCell>
                      <TableCell>{payment.note || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditPaymentDialog(payment)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(payment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {paymentMeta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {paymentMeta.page} of {paymentMeta.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchPayments(paymentMeta.page - 1)}
                      disabled={paymentMeta.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchPayments(paymentMeta.page + 1)}
                      disabled={paymentMeta.page === paymentMeta.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPaymentId ? "Edit Payment" : "Add Payment"}
            </DialogTitle>
            <DialogDescription>
              {editingPaymentId
                ? "Update the payment details below."
                : "Fill in the details to record a new payment."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={paymentForm.amount}
                onChange={(e) =>
                  handlePaymentFormChange("amount", e.target.value)
                }
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) =>
                  handlePaymentFormChange("paymentDate", e.target.value)
                }
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={paymentForm.paymentMethod}
                onValueChange={(value) =>
                  handlePaymentFormChange("paymentMethod", value as PaymentMethod)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(PAYMENT_METHOD_LABELS) as [
                      PaymentMethod,
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
            <div className="col-span-2 space-y-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                value={paymentForm.reference}
                onChange={(e) =>
                  handlePaymentFormChange("reference", e.target.value)
                }
                placeholder="Transaction reference"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="note">Note</Label>
              <textarea
                id="note"
                value={paymentForm.note}
                onChange={(e) =>
                  handlePaymentFormChange("note", e.target.value)
                }
                placeholder="Payment note"
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handlePaymentSubmit} disabled={submitting}>
              {submitting
                ? "Saving..."
                : editingPaymentId
                  ? "Update"
                  : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment? This action cannot be
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
              onClick={handleDeletePayment}
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
