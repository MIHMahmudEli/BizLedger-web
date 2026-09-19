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
  Bell,
  Code2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notification-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER"] },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/companies", label: "Companies", icon: Building2, roles: ["ADMIN", "MANAGER", "STAFF"] },
      // Hidden for now for all user types — restore roles to re-enable
      { href: "/contacts", label: "Contacts", icon: Users, roles: [] },
      { href: "/projects", label: "Projects", icon: FolderKanban, roles: ["ADMIN", "MANAGER", "STAFF"] },
      { href: "/developers", label: "Developers", icon: Code2, roles: ["ADMIN", "MANAGER", "STAFF"] },
      { href: "/payments", label: "Payments", icon: CreditCard, roles: [] },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3, roles: ["ADMIN", "MANAGER"] },
      { href: "/notifications", label: "Notifications", icon: Bell, roles: ["ADMIN", "MANAGER", "STAFF"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/users", label: "Users", icon: Shield, roles: ["ADMIN"] },
    ],
  },
];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-500/10 text-red-600 dark:text-red-400",
  MANAGER: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  STAFF: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

const themeOptions = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps = {}) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { unreadCount } = useNotifications();

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsForm, setSettingsForm] = React.useState({ name: "", email: "", password: "" });
  const [settingsSaving, setSettingsSaving] = React.useState(false);
  const [settingsError, setSettingsError] = React.useState("");

  // Only run when dialog is opened
  React.useEffect(() => {
    if (settingsOpen && user) {
      setSettingsForm((prev) => ({ ...prev, name: user.name, email: user.email, password: "" }));
      setSettingsError("");
    }
  }, [settingsOpen, user]);

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    setSettingsError("");
    try {
      const payload: Record<string, string> = {};
      if (settingsForm.name && settingsForm.name !== user?.name) payload.name = settingsForm.name;
      if (settingsForm.email && settingsForm.email !== user?.email) payload.email = settingsForm.email;
      if (settingsForm.password) payload.password = settingsForm.password;
      
      if (Object.keys(payload).length > 0) {
        await api.patch("/users/me/credentials", payload);
      }
      setSettingsOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setSettingsError(error.response?.data?.message || "Failed to update credentials");
    } finally {
      setSettingsSaving(false);
    }
  };

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => user && item.roles.includes(user.role)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <TooltipProvider>
      <aside className={cn("flex flex-col h-full border-r bg-sidebar", className)}>
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center h-16 px-5 border-b">
            <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <span className="text-primary-foreground font-bold text-sm tracking-tight">BL</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base leading-tight tracking-tight">BizLedger</span>
                <span className="text-[10px] text-muted-foreground leading-tight">Business Suite</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-hidden">
            {visibleGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                              "relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            {isActive && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-primary" />
                            )}
                            <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                            {item.label}
                            {item.href === "/notifications" && unreadCount > 0 && (
                              <Badge
                                variant="destructive"
                                className="ml-auto h-5 min-w-5 flex items-center justify-center p-0 text-[10px] font-bold"
                              >
                                {unreadCount > 99 ? "99+" : unreadCount}
                              </Badge>
                            )}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom Section */}
          <div className="border-t">
            {/* Theme Toggle */}
            <div className="px-3 pt-3 pb-2">
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                {themeOptions.map(({ value, icon: Icon, label }) => (
                  <Tooltip key={value}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 flex-1 p-0 rounded-md transition-all duration-200 cursor-pointer",
                          theme === value
                            ? "bg-background shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setTheme(value)}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{label}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* User Profile */}
            {user && (
              <div className="px-3 pb-2">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold leading-tight truncate">{user.name}</p>
                      <Badge
                        variant="secondary"
                        className={cn("text-[9px] px-1.5 py-0 font-bold leading-none", ROLE_COLORS[user.role])}
                      >
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Settings & Logout */}
            <div className="px-3 pb-3 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </div>
          </div>
        </div>

        {/* Settings Dialog */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Account Settings</DialogTitle>
              <DialogDescription>
                Update your account credentials here.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {settingsError && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {settingsError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="settings-name">Full Name</Label>
                <Input
                  id="settings-name"
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-email">Email</Label>
                <Input
                  id="settings-email"
                  type="email"
                  value={settingsForm.email}
                  onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-password">New Password</Label>
                <Input
                  id="settings-password"
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={settingsForm.password}
                  onChange={(e) => setSettingsForm({ ...settingsForm, password: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveSettings} disabled={settingsSaving}>
                {settingsSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </aside>
    </TooltipProvider>
  );
}
