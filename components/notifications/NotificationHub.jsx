import React, { useState, useEffect, useRef } from "react";
import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, MessageSquare, ThumbsUp, Presentation, X, CheckCheck } from "lucide-react";
import { format } from "date-fns";

const TYPE_CONFIG = {
  message: { icon: MessageSquare, color: "text-sky-500" },
  feedback: { icon: ThumbsUp, color: "text-orange-500" },
  proposal: { icon: Presentation, color: "text-purple-500" },
};

export default function NotificationHub({ user }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const panelRef = useRef(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: () => entities.Notification.filter({ recipient_email: user.email }, "-created_date", 50),
    enabled: !!user?.email,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  // Real-time updates
  useEffect(() => {
    if (!user?.email) return;
    const unsubscribe = entities.Notification.subscribe((event) => {
      if (event.type === "create" && event.data?.recipient_email === user.email) {
        queryClient.setQueryData(["notifications", user.email], (old = []) =>
          old.some(n => n.id === event.data.id) ? old : [event.data, ...old]
        );
      }
      if (event.type === "update") {
        queryClient.setQueryData(["notifications", user.email], (old = []) =>
          old.map(n => n.id === event.id ? { ...n, ...event.data } : n)
        );
      }
    });
    return unsubscribe;
  }, [user?.email, queryClient]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = async (id) => {
    await entities.Notification.update(id, { read: true });
    queryClient.setQueryData(["notifications", user?.email], (old = []) =>
      old.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => entities.Notification.update(n.id, { read: true })));
    queryClient.setQueryData(["notifications", user?.email], (old = []) =>
      old.map(n => ({ ...n, read: true }))
    );
  };

  const clearAll = async () => {
    await Promise.all(notifications.map(n => entities.Notification.delete(n.id)));
    queryClient.setQueryData(["notifications", user?.email], []);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-sm"
      >
        <Bell className="w-4 h-4 text-zinc-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-sky-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <span className="text-sm font-semibold text-zinc-900">Notifications</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 font-medium transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                <p className="text-sm text-zinc-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const conf = TYPE_CONFIG[notif.type] || TYPE_CONFIG.message;
                const Icon = conf.icon;
                return (
                  <div
                    key={notif.id}
                    onClick={() => markRead(notif.id)}
                    className={`flex gap-3 px-4 py-3 border-b border-zinc-50 hover:bg-zinc-50 transition-colors cursor-pointer ${!notif.read ? "bg-sky-50/40" : ""}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className={`w-4 h-4 ${conf.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-zinc-800 leading-snug">{notif.title}</p>
                        {!notif.read && <div className="w-2 h-2 bg-sky-500 rounded-full flex-shrink-0 mt-1" />}
                      </div>
                      {notif.body && (
                        <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{notif.body}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-zinc-400 font-medium">{notif.project_name}</span>
                        <span className="text-[10px] text-zinc-300">·</span>
                        <span className="text-[10px] text-zinc-400">{format(new Date(notif.created_date), "MMM d, h:mm a")}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}