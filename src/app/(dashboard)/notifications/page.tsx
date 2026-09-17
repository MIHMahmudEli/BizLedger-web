"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { NotificationType } from "@/types";

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
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} unread</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleBulkMarkAsRead}>
                <Check className="h-4 w-4 mr-1" />
                Mark read ({selectedIds.length})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete ({selectedIds.length})
              </Button>
            </>
          )}
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(NOTIFICATION_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No notifications found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === filteredNotifications.length &&
                        filteredNotifications.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-input"
                    />
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((notification) => (
                  <TableRow
                    key={notification.id}
                    className={!notification.isRead ? "bg-muted/30" : ""}
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
                      <Badge variant="secondary">
                        {NOTIFICATION_LABELS[notification.type] || notification.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {notification.message}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(notification.createdAt)}
                    </TableCell>
                    <TableCell>
                      {!notification.isRead ? (
                        <Badge variant="default" className="text-xs">
                          Unread
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Read
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
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
                  onClick={() => fetchNotifications(meta.page - 1)}
                  disabled={meta.page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNotifications(meta.page + 1)}
                  disabled={meta.page === meta.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
