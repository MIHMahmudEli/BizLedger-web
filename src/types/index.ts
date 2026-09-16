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
