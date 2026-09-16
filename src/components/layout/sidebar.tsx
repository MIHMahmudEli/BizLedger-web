"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Building2,
  Users,
  FolderKanban,
  CreditCard,
  BarChart3,
  Shield,
  LogOut,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER"] },
  { href: "/companies", label: "Companies", icon: Building2, roles: ["ADMIN", "MANAGER", "STAFF"] },
  { href: "/contacts", label: "Contacts", icon: Users, roles: ["ADMIN", "MANAGER", "STAFF"] },
  { href: "/projects", label: "Projects", icon: FolderKanban, roles: ["ADMIN", "MANAGER", "STAFF"] },
  { href: "/payments", label: "Payments", icon: CreditCard, roles: ["ADMIN", "MANAGER", "STAFF"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["ADMIN", "MANAGER"] },
  { href: "/users", label: "Users", icon: Shield, roles: ["ADMIN"] },
];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  MANAGER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  STAFF: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const themeOptions = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();

  const visibleItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <TooltipProvider>
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-sidebar">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center h-16 px-6 border-b">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">BL</span>
              </div>
              <span className="font-semibold text-lg">BizLedger</span>
            </Link>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {visibleItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          <Separator />

          <div className="p-3 space-y-2">
            <div className="flex items-center justify-center gap-1 p-1 bg-muted rounded-lg">
              {themeOptions.map(({ value, icon: Icon, label }) => (
                <Tooltip key={value}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={theme === value ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0",
                        theme === value && "shadow-sm"
                      )}
                      onClick={() => setTheme(value)}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{label}</TooltipContent>
                </Tooltip>
              ))}
            </div>

            {user && (
              <div className="px-3 py-2 text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground truncate">{user.name}</p>
                  <Badge
                    variant="secondary"
                    className={cn("text-[10px] px-1.5 py-0", ROLE_COLORS[user.role])}
                  >
                    {user.role}
                  </Badge>
                </div>
                <p className="truncate">{user.email}</p>
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
