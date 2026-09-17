"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bell, Check, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sidebar } from "./sidebar";
import { useNotifications } from "@/lib/notification-context";
import { formatDate } from "@/lib/utils";

const NOTIFICATION_ICONS: Record<string, string> = {
  PAYMENT_RECEIVED: "💰",
  PROJECT_CREATED: "📁",
  PROJECT_STATUS_CHANGED: "📋",
  USER_CREATED: "👤",
  USER_ROLE_CHANGED: "🔐",
  DEADLINE_APPROACHING: "⏰",
};

export function Header() {
  const [open, setOpen] = React.useState(false);
  const { unreadCount, notifications, markAsRead, markAllAsRead, meta, fetchNotifications } = useNotifications();

  const recentNotifications = notifications.slice(0, 5);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 border-r">
          <Sidebar className="w-full border-r-0" onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => markAllAsRead()}
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />
          {recentNotifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <>
              {recentNotifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex items-start gap-3 px-3 py-2 cursor-pointer ${
                    !notification.isRead ? "bg-muted/50" : ""
                  }`}
                  onClick={() => {
                    if (!notification.isRead) markAsRead(notification.id);
                    if (notification.link) window.location.href = notification.link;
                  }}
                >
                  <span className="text-lg mt-0.5">
                    {NOTIFICATION_ICONS[notification.type] || "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="justify-center cursor-pointer">
                <Link href="/notifications">
                  <Eye className="h-4 w-4 mr-2" />
                  View all notifications
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
