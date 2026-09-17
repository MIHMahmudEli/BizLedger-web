"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Notification, PaginatedResponse } from "@/types";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: (page?: number) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  bulkMarkAsRead: (ids: string[]) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchNotifications = useCallback(async (page = 1) => {
    try {
      const response = await api.get<PaginatedResponse<Notification>>("/notifications", {
        params: { page, limit: 20 },
      });
      setNotifications(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get<{ count: number }>("/notifications/unread-count");
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("WebSocket connected");
    });

    newSocket.on("notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/bell.png",
        });
      }

      try {
        const audio = new Audio("/sounds/notification.mp3");
        audio.play().catch(() => {});
      } catch {}
    });

    newSocket.on("unread-count", (data: { count: number }) => {
      setUnreadCount(data.count);
    });

    newSocket.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });

    setSocket(newSocket);

    fetchNotifications();
    fetchUnreadCount();

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      newSocket.disconnect();
    };
  }, [user, authLoading, fetchNotifications, fetchUnreadCount]);

  const markAsRead = useCallback(async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await api.patch("/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const bulkMarkAsRead = useCallback(async (ids: string[]) => {
    await api.patch("/notifications/bulk-read", { ids });
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - ids.length));
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    await api.delete(`/notifications/${id}`);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setMeta((prev) => ({ ...prev, total: prev.total - 1 }));
  }, []);

  const bulkDelete = useCallback(async (ids: string[]) => {
    await api.post("/notifications/bulk-delete", { ids });
    setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
    setMeta((prev) => ({ ...prev, total: prev.total - ids.length }));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        bulkMarkAsRead,
        deleteNotification,
        bulkDelete,
        meta,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
