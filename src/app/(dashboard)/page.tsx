"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  FolderKanban,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { DashboardReport } from "@/types";

const COLORS = {
  UNPAID: "#ef4444",
  PARTIALLY_PAID: "#f59e0b",
  PAID: "#22c55e",
  OVERPAID: "#3b82f6",
};

const STATUS_CONFIG = [
  { key: "UNPAID", label: "Unpaid", color: "bg-red-500", textColor: "text-red-600 dark:text-red-400", bgColor: "bg-red-500/10" },
  { key: "PARTIALLY_PAID", label: "Partial", color: "bg-amber-500", textColor: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-500/10" },
  { key: "PAID", label: "Paid", color: "bg-emerald-500", textColor: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-500/10" },
  { key: "OVERPAID", label: "Overpaid", color: "bg-blue-500", textColor: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-500/10" },
];

export default function DashboardPage() {
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: DashboardReport }>("/reports/dashboard")
      .then((res) => setReport(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load dashboard data
      </div>
    );
  }

  const paymentStatusData = [
    { name: "Unpaid", value: report.unpaidProjects, color: COLORS.UNPAID },
    { name: "Partial", value: report.partiallyPaidProjects, color: COLORS.PARTIALLY_PAID },
    { name: "Paid", value: report.paidProjects, color: COLORS.PAID },
    { name: "Overpaid", value: report.overpaidProjects, color: COLORS.OVERPAID },
  ];

  const projectStatusData = [
    { name: "Active", value: report.activeProjects, fill: "#8b5cf6" },
    { name: "Completed", value: report.completedProjects, fill: "#22c55e" },
  ];

  const collectionRate = report.totalProjectValue > 0
    ? ((report.totalPaid / report.totalProjectValue) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your business metrics</p>
      </div>

      {/* Primary Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-5 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 shrink-0">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Companies</p>
                <p className="text-2xl font-bold">{report.totalCompanies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-5 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 shrink-0">
                <FolderKanban className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Projects</p>
                <p className="text-2xl font-bold">{report.totalProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-5 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 shrink-0">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Total Value</p>
                <p className="text-base lg:text-lg font-bold break-words">{formatCurrency(report.totalProjectValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-5 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Total Due</p>
                <p className="text-base lg:text-lg font-bold text-red-600 dark:text-red-400 break-words">{formatCurrency(report.totalDue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-5 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 shrink-0">
                <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Total Paid</p>
                <p className="text-base lg:text-lg font-bold text-emerald-600 dark:text-emerald-400 break-words">{formatCurrency(report.totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-5 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 shrink-0">
                <Clock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{report.activeProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-5 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 shrink-0">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{report.completedProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-5 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 shrink-0">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Collection Rate</p>
                <p className="text-2xl font-bold">{collectionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {STATUS_CONFIG.map(({ key, label, color, textColor, bgColor }) => {
          const count = key === "UNPAID" ? report.unpaidProjects
            : key === "PARTIALLY_PAID" ? report.partiallyPaidProjects
            : key === "PAID" ? report.paidProjects
            : report.overpaidProjects;
          return (
            <Card key={key} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-5 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={`text-2xl font-bold ${textColor}`}>{count}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgColor}`}>
                    <div className={`h-3 w-3 rounded-full ${color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Payment Distribution</h3>
            {report.totalProjects > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                No data yet
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {paymentStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Project Status</h3>
            {report.totalProjects > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={projectStatusData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                No data yet
              </div>
            )}
            <div className="flex justify-center gap-6 mt-4">
              {projectStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
