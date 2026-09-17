"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
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

const NOTIFICATION_LABELS: Record<string, string> = {
  PAYMENT_RECEIVED: "Payment",
  PROJECT_CREATED: "Project",
  PROJECT_STATUS_CHANGED: "Project Status",
  USER_CREATED: "User",
  USER_ROLE_CHANGED: "Role Changed",
  DEADLINE_APPROACHING: "Deadline",
};

const NOTIFICATION_COLORS: Record<string, string> = {
  PAYMENT_RECEIVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  PROJECT_CREATED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PROJECT_STATUS_CHANGED: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  USER_CREATED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  USER_ROLE_CHANGED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  DEADLINE_APPROACHING: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export default function NotificationsPage() {
  const {
    notifications,
    meta,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    bulkMarkAsRead,
    deleteNotification,
    bulkDelete,
    unreadCount,
  } = useNotifications();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState("all");
  const [filterRead, setFilterRead] = useState("all");

  const filteredNotifications = notifications.filter((n) => {
    if (filterType !== "all" && n.type !== filterType) return false;
    if (filterRead === "read" && !n.isRead) return false;
    if (filterRead === "unread" && n.isRead) return false;
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map((n) => n.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkMarkAsRead = async () => {
    await bulkMarkAsRead(selectedIds);
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    await bulkDelete(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleBulkMarkAsRead} className="gap-1.5">
                <Check className="h-4 w-4" />
                Mark read ({selectedIds.length})
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-1.5">
                <Trash2 className="h-4 w-4" />
                Delete ({selectedIds.length})
              </Button>
            </>
          )}
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-1.5">
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-3 mb-6">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(NOTIFICATION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Status</label>
              <Select value={filterRead} onValueChange={setFilterRead}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Inbox className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm mt-1">You're all caught up!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-input"
                    />
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Message</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="w-20 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((notification) => (
                  <TableRow
                    key={notification.id}
                    className={`group ${!notification.isRead ? "bg-muted/30" : ""}`}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(notification.id)}
                        onChange={() => toggleSelect(notification.id)}
                        className="rounded border-input"
                      />
                    </TableCell>
                    <TableCell className="text-lg">
                      {NOTIFICATION_ICONS[notification.type] || "🔔"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${NOTIFICATION_COLORS[notification.type] || ""} font-normal`}>
                        {NOTIFICATION_LABELS[notification.type] || notification.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{formatDate(notification.createdAt)}</span>
                    </TableCell>
                    <TableCell>
                      {!notification.isRead ? (
                        <Badge variant="default" className="text-xs font-normal">Unread</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs font-normal">Read</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.isRead && (
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => markAsRead(notification.id)}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => deleteNotification(notification.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => fetchNotifications(meta.page - 1)} disabled={meta.page === 1}>
                  <ChevronLeft className="h-4 w-4 mr-1" />Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => fetchNotifications(meta.page + 1)} disabled={meta.page === meta.totalPages}>
                  Next<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
