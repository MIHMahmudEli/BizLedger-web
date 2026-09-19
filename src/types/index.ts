export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Company {
  id: string;
  companyName: string;
  category?: string;
  address?: string;
  addressArea?: string;
  contactName?: string;
  designation?: string;
  phone?: string;
  primaryContact?: Contact;
  website?: string;
  createdAt: string;
  updatedAt: string;
  contacts?: Contact[];
  projects?: Project[];
}

export interface Contact {
  id: string;
  companyId: string;
  name: string;
  designation?: string;
  mobile?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus =
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERPAID";

export interface Project {
  id: string;
  companyId: string;
  company?: { id: string; companyName: string; addressArea?: string } | null;
  projectName: string;
  projectType: string;
  totalValue: string;
  status: ProjectStatus;
  startDate?: string;
  deadline?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  financial?: ProjectFinancial;
  developers?: Developer[];
}

export type DeveloperStatus = "ACTIVE" | "INACTIVE";

export interface Developer {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  status: DeveloperStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  projectCount?: number;
  projects?: {
    id: string;
    projectName: string;
    projectType: string;
    status: ProjectStatus;
    totalValue: string;
    companyName: string | null;
  }[];
}

export interface ProjectFinancial {
  totalPaid: string;
  due: string;
  paymentCount: number;
  paymentStatus: PaymentStatus;
}

export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "CARD"
  | "MOBILE_BANKING"
  | "CHEQUE"
  | "OTHER";

export interface Payment {
  id: string;
  projectId: string;
  amount: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  projectName?: string;
  companyName?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardReport {
  totalCompanies: number;
  totalProjects: number;
  totalProjectValue: string;
  totalPaid: string;
  totalDue: string;
  unpaidProjects: number;
  partiallyPaidProjects: number;
  paidProjects: number;
  overpaidProjects: number;
  activeProjects: number;
  completedProjects: number;
}

export interface OutstandingProject {
  id: string;
  projectName: string;
  projectType: string;
  totalValue: string;
  totalPaid: string;
  due: string;
  paymentStatus: string;
  companyName: string;
}

export type NotificationType =
  | "PAYMENT_RECEIVED"
  | "PROJECT_CREATED"
  | "PROJECT_STATUS_CHANGED"
  | "USER_CREATED"
  | "USER_ROLE_CHANGED"
  | "DEADLINE_APPROACHING";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}
