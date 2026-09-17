"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  StopCircle,
  Inbox,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  User,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { Project, ProjectFinancial, ProjectStatus, Payment, PaymentMethod, PaginatedResponse, Company, Contact } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: "Planned", IN_PROGRESS: "In Progress", ON_HOLD: "On Hold",
  COMPLETED: "Completed", CANCELLED: "Cancelled",
};

const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  PLANNED: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ON_HOLD: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const PROJECT_STATUS_ICONS: Record<ProjectStatus, React.ReactNode> = {
  PLANNED: <FileText className="h-3 w-3" />,
  IN_PROGRESS: <Clock className="h-3 w-3" />,
  ON_HOLD: <StopCircle className="h-3 w-3" />,
  COMPLETED: <CheckCircle2 className="h-3 w-3" />,
  CANCELLED: <XCircle className="h-3 w-3" />,
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Unpaid", PARTIALLY_PAID: "Partially Paid", PAID: "Paid", OVERPAID: "Overpaid",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  UNPAID: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  PARTIALLY_PAID: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  OVERPAID: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  CASH: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  BANK_TRANSFER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  CARD: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  MOBILE_BANKING: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  CHEQUE: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash", BANK_TRANSFER: "Bank Transfer", CARD: "Card",
  MOBILE_BANKING: "Mobile Banking", CHEQUE: "Cheque", OTHER: "Other",
};

interface PaymentForm {
  amount: string; paymentDate: string; paymentMethod: PaymentMethod; reference: string; note: string;
}
const initialPaymentForm: PaymentForm = {
  amount: "", paymentDate: new Date().toISOString().split("T")[0], paymentMethod: "CASH", reference: "", note: "",
};

type SectionId = "project-details" | "financial";
type BottomSectionId = "company" | "payments";

function SortableCard({
  id,
  title,
  icon,
  badge,
  action,
  children,
}: {
  id: SectionId | BottomSectionId;
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 250ms cubic-bezier(0.25, 1, 0.5, 1)",
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : ("auto" as const),
  };
  return (
    <Card ref={setNodeRef} style={style} className="relative group/section">
      <CardHeader className="flex flex-row items-center gap-3 pb-4 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        {icon && <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">{icon}</div>}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold leading-none">{title}</h3>
          {badge && <div className="mt-1.5">{badge}</div>}
        </div>
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {action}
          <div className="opacity-0 group-hover/section:opacity-60 transition-opacity ml-1">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<(Project & { financial?: ProjectFinancial }) | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMeta, setPaymentMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(initialPaymentForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(["project-details", "financial"]);
  const [bottomSectionOrder, setBottomSectionOrder] = useState<BottomSectionId[]>(["company", "payments"]);

  useEffect(() => { fetchProject(); fetchPayments(); }, [projectId]);

  useEffect(() => {
    const saved = localStorage.getItem(`project-section-order-${projectId}`);
    if (saved) { try { setSectionOrder(JSON.parse(saved)); } catch {} }
    const savedBottom = localStorage.getItem(`project-bottom-section-order-${projectId}`);
    if (savedBottom) { try { setBottomSectionOrder(JSON.parse(savedBottom)); } catch {} }
  }, [projectId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSectionOrder((items) => {
        const oldIndex = items.indexOf(active.id as SectionId);
        const newIndex = items.indexOf(over.id as SectionId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(items, oldIndex, newIndex);
          localStorage.setItem(`project-section-order-${projectId}`, JSON.stringify(newOrder));
          return newOrder;
        }
        return items;
      });
      setBottomSectionOrder((items) => {
        const oldIndex = items.indexOf(active.id as BottomSectionId);
        const newIndex = items.indexOf(over.id as BottomSectionId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(items, oldIndex, newIndex);
          localStorage.setItem(`project-bottom-section-order-${projectId}`, JSON.stringify(newOrder));
          return newOrder;
        }
        return items;
      });
    }
  };

  const fetchProject = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ data: Project & { financial?: ProjectFinancial } }>(`/projects/${projectId}`);
      setProject(response.data.data);
      if (response.data.data.companyId) fetchCompany(response.data.data.companyId);
    } catch (error) { console.error("Failed to fetch project:", error); } finally { setLoading(false); }
  };

  const fetchCompany = async (companyId: string) => {
    try {
      const response = await api.get<{ data: Company }>(`/companies/${companyId}`);
      setCompany(response.data.data);
      fetchContacts(companyId);
    } catch (error) { console.error("Failed to fetch company:", error); }
  };

  const fetchContacts = async (companyId: string) => {
    try {
      const response = await api.get<PaginatedResponse<Contact>>(`/companies/${companyId}/contacts`, { params: { limit: 10 } });
      setContacts(response.data.data);
    } catch (error) { console.error("Failed to fetch contacts:", error); }
  };

  const fetchPayments = async (paymentPage = 1) => {
    setPaymentsLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Payment>>(`/projects/${projectId}/payments`, { params: { page: paymentPage, limit: 10 } });
      setPayments(response.data.data); setPaymentMeta(response.data.meta);
    } catch (error) { console.error("Failed to fetch payments:", error); } finally { setPaymentsLoading(false); }
  };

  const openAddPaymentDialog = () => { setEditingPaymentId(null); setPaymentForm(initialPaymentForm); setPaymentDialogOpen(true); };
  const openEditPaymentDialog = (payment: Payment) => {
    setEditingPaymentId(payment.id);
    setPaymentForm({ amount: payment.amount, paymentDate: payment.paymentDate.split("T")[0], paymentMethod: payment.paymentMethod, reference: payment.reference || "", note: payment.note || "" });
    setPaymentDialogOpen(true);
  };
  const openDeleteDialog = (paymentId: string) => { setDeletingPaymentId(paymentId); setDeleteOpen(true); };
  const handlePaymentFormChange = (field: keyof PaymentForm, value: string) => { setPaymentForm((prev) => ({ ...prev, [field]: value })); };

  const handlePaymentSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = { ...paymentForm, amount: parseFloat(paymentForm.amount) || 0, reference: paymentForm.reference || undefined, note: paymentForm.note || undefined };
      if (editingPaymentId) { await api.patch(`/payments/${editingPaymentId}`, payload); } else { await api.post(`/projects/${projectId}/payments`, payload); }
      setPaymentDialogOpen(false); setEditingPaymentId(null); setPaymentForm(initialPaymentForm); fetchProject(); fetchPayments();
    } catch (error) { console.error("Failed to save payment:", error); } finally { setSubmitting(false); }
  };

  const handleDeletePayment = async () => {
    if (!deletingPaymentId) return; setDeleting(true);
    try { await api.delete(`/payments/${deletingPaymentId}`); setDeleteOpen(false); setDeletingPaymentId(null); fetchProject(); fetchPayments(); }
    catch (error) { console.error("Failed to delete payment:", error); } finally { setDeleting(false); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-4 w-32" /></div>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="pt-5 pb-5 px-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="flex-1"><Skeleton className="h-3 w-16 mb-2" /><Skeleton className="h-5 w-24" /></div>
              </div>
            </CardContent></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}><CardContent className="pt-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="space-y-3">{[1, 2, 3, 4].map((j) => (<div key={j} className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-28" /></div>))}</div>
            </CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <FileText className="h-12 w-12 mb-4 opacity-40" />
        <p className="text-lg font-medium">Project not found</p>
      </div>
    );
  }

  const financial = project.financial;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{project.projectName}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                {project.projectType && <span>{project.projectType}</span>}
                <Badge variant="secondary" className={`${PROJECT_STATUS_COLORS[project.status]} font-normal gap-1`}>
                  {PROJECT_STATUS_ICONS[project.status]}
                  {PROJECT_STATUS_LABELS[project.status]}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-5 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Total Value</p>
                <p className="text-sm lg:text-base font-bold break-words">{formatCurrency(project.totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Total Paid</p>
                <p className="text-sm lg:text-base font-bold text-emerald-600 dark:text-emerald-400 break-words">{formatCurrency(financial?.totalPaid ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 shrink-0">
                <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Due</p>
                <p className="text-sm lg:text-base font-bold text-red-600 dark:text-red-400 break-words">{formatCurrency(financial?.due ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Payments</p>
                <p className="text-sm lg:text-base font-bold">{financial?.paymentCount ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Details + Financial - Draggable */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sortable-grid">
            {sectionOrder.map((sectionId) => {
              if (sectionId === "project-details") {
                return (
                  <SortableCard key={sectionId} id={sectionId} title="Project Details" icon={<FileText className="h-4 w-4 text-primary" />}>
                    <div className="space-y-0">
                      {[
                        { label: "Name", value: project.projectName },
                        { label: "Type", value: project.projectType },
                        { label: "Value", value: formatCurrency(project.totalValue) },
                        { label: "Start Date", value: project.startDate ? formatDate(project.startDate) : null },
                        { label: "Deadline", value: project.deadline ? formatDate(project.deadline) : null },
                      ].filter((item) => item.value).map((item) => (
                        <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <span className="text-sm font-medium">{item.value}</span>
                        </div>
                      ))}
                      {project.description && (
                        <div className="pt-3">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Description</p>
                          <p className="text-sm leading-relaxed">{project.description}</p>
                        </div>
                      )}
                    </div>
                  </SortableCard>
                );
              }
              if (sectionId === "financial") {
                return (
                  <SortableCard key={sectionId} id={sectionId} title="Financial Summary" icon={<DollarSign className="h-4 w-4 text-primary" />}>
                    <div className="space-y-0">
                      <div className="flex items-center justify-between py-2.5 border-b border-border/40">
                        <span className="text-sm text-muted-foreground">Total Value</span>
                        <span className="text-sm font-semibold">{formatCurrency(project.totalValue)}</span>
                      </div>
                      <div className="flex items-center justify-between py-2.5 border-b border-border/40">
                        <span className="text-sm text-muted-foreground">Total Paid</span>
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(financial?.totalPaid ?? 0)}</span>
                      </div>
                      <div className="flex items-center justify-between py-2.5 border-b border-border/40">
                        <span className="text-sm text-muted-foreground">Due</span>
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(financial?.due ?? 0)}</span>
                      </div>
                      <div className="flex items-center justify-between py-2.5 border-b border-border/40">
                        <span className="text-sm text-muted-foreground">Payment Count</span>
                        <span className="text-sm font-medium">{financial?.paymentCount ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge variant="secondary" className={`${PAYMENT_STATUS_COLORS[financial?.paymentStatus || "UNPAID"]} font-normal`}>
                          {financial?.paymentStatus ? PAYMENT_STATUS_LABELS[financial.paymentStatus] : "N/A"}
                        </Badge>
                      </div>
                    </div>
                  </SortableCard>
                );
              }
              return null;
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Company + Payments - Draggable */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={bottomSectionOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {bottomSectionOrder.map((sectionId) => {
              if (sectionId === "company" && company) {
                return (
                  <SortableCard
                    key={sectionId}
                    id={sectionId}
                    title={company.companyName}
                    icon={<Building2 className="h-4 w-4 text-primary" />}
                    badge={company.category ? <Badge variant="secondary" className="font-normal text-xs">{company.category}</Badge> : undefined}
                    action={<Button variant="outline" size="sm" asChild className="gap-1.5 h-8"><a href={`/companies/${company.id}`}>View Details<ArrowLeft className="h-3 w-3 rotate-180" /></a></Button>}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                      <div className="pr-6 pb-4 md:pb-0 space-y-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Information</h4>
                        <div className="space-y-3">
                          {company.address && (
                            <div className="flex items-start gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0"><MapPin className="h-4 w-4 text-muted-foreground" /></div>
                              <div>
                                <p className="text-xs text-muted-foreground">Address</p>
                                <p className="text-sm">{company.address}</p>
                                {company.addressArea && <p className="text-sm text-muted-foreground">{company.addressArea}</p>}
                              </div>
                            </div>
                          )}
                          {company.website && (
                            <div className="flex items-start gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0"><Globe className="h-4 w-4 text-muted-foreground" /></div>
                              <div>
                                <p className="text-xs text-muted-foreground">Website</p>
                                <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">{company.website}</a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="pl-0 md:pl-6 pt-4 md:pt-0 space-y-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Contacts</h4>
                        {contacts.length === 0 ? <p className="text-sm text-muted-foreground">No contacts found</p> : (
                          <div className="space-y-2.5">
                            {contacts.slice(0, 3).map((contact) => (
                              <div key={contact.id} className="flex items-start gap-3 p-3 rounded-xl border border-border/50 hover:border-border hover:bg-muted/30 transition-all">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0"><User className="h-3.5 w-3.5 text-primary" /></div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{contact.name}</p>
                                    {contact.designation && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">{contact.designation}</Badge>}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1">
                                    {contact.mobile && (
                                      <a href={`tel:${contact.mobile}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                                        <div className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500/10"><Phone className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" /></div>{contact.mobile}
                                      </a>
                                    )}
                                    {contact.email && (
                                      <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                                        <div className="flex h-4 w-4 items-center justify-center rounded bg-blue-500/10"><Mail className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" /></div>
                                        <span className="truncate max-w-[120px]">{contact.email}</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </SortableCard>
                );
              }

              if (sectionId === "payments") {
                return (
                  <SortableCard
                    key={sectionId}
                    id={sectionId}
                    title="Payments"
                    icon={<CreditCard className="h-4 w-4 text-primary" />}
                    badge={<span className="text-xs text-muted-foreground">{paymentMeta.total} transactions</span>}
                    action={<Button size="sm" onClick={openAddPaymentDialog} className="gap-1.5 h-8"><Plus className="h-3.5 w-3.5" />Add Payment</Button>}
                  >
                    {paymentsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-20 ml-auto" />
                          </div>
                        ))}
                      </div>
                    ) : payments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed rounded-xl">
                        <Inbox className="h-10 w-10 mb-3 opacity-40" />
                        <p className="font-medium">No payments recorded</p>
                        <p className="text-sm mt-1">Record your first payment to get started</p>
                      </div>
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="font-semibold">Date</TableHead>
                              <TableHead className="font-semibold">Amount</TableHead>
                              <TableHead className="font-semibold">Method</TableHead>
                              <TableHead className="font-semibold">Reference</TableHead>
                              <TableHead className="font-semibold">Note</TableHead>
                              <TableHead className="w-[80px] font-semibold text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {payments.map((payment) => (
                              <TableRow key={payment.id} className="group">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0"><CreditCard className="h-3.5 w-3.5 text-primary" /></div>
                                    <span className="text-sm">{formatDate(payment.paymentDate)}</span>
                                  </div>
                                </TableCell>
                                <TableCell><span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(payment.amount)}</span></TableCell>
                                <TableCell><Badge variant="secondary" className={`${PAYMENT_METHOD_COLORS[payment.paymentMethod]} font-normal`}>{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</Badge></TableCell>
                                <TableCell><span className="text-sm text-muted-foreground">{payment.reference || "-"}</span></TableCell>
                                <TableCell><span className="text-sm text-muted-foreground max-w-[150px] truncate block">{payment.note || "-"}</span></TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditPaymentDialog(payment)}><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDeleteDialog(payment.id)}><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {paymentMeta.totalPages > 1 && (
                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">Showing {(paymentMeta.page - 1) * paymentMeta.limit + 1} to {Math.min(paymentMeta.page * paymentMeta.limit, paymentMeta.total)} of {paymentMeta.total}</p>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => fetchPayments(paymentMeta.page - 1)} disabled={paymentMeta.page === 1}>Previous</Button>
                              <Button variant="outline" size="sm" onClick={() => fetchPayments(paymentMeta.page + 1)} disabled={paymentMeta.page === paymentMeta.totalPages}>Next</Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </SortableCard>
                );
              }
              return null;
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add/Edit Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPaymentId ? "Edit Payment" : "Add Payment"}</DialogTitle>
            <DialogDescription>{editingPaymentId ? "Update the payment details below." : "Fill in the details to record a new payment."}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" value={paymentForm.amount} onChange={(e) => handlePaymentFormChange("amount", e.target.value)} placeholder="0.00" min="0" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input id="paymentDate" type="date" value={paymentForm.paymentDate} onChange={(e) => handlePaymentFormChange("paymentDate", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentForm.paymentMethod} onValueChange={(value) => handlePaymentFormChange("paymentMethod", value as PaymentMethod)}>
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="reference">Reference</Label>
              <Input id="reference" value={paymentForm.reference} onChange={(e) => handlePaymentFormChange("reference", e.target.value)} placeholder="Transaction reference" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="note">Note</Label>
              <textarea id="note" value={paymentForm.note} onChange={(e) => handlePaymentFormChange("note", e.target.value)} placeholder="Payment note" rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handlePaymentSubmit} disabled={submitting}>
              {submitting ? "Saving..." : editingPaymentId ? "Update" : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment</DialogTitle>
            <DialogDescription>Are you sure you want to delete this payment? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePayment} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
