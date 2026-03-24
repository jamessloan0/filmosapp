import React, { useEffect } from "react";
import { X, MessageSquare } from "lucide-react";

export default function NotificationBanner({ notification, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed top-4 right-4 bg-sky-600 text-white rounded-lg shadow-lg p-4 flex items-start gap-3 max-w-sm z-50 animate-slide-down">
      <div className="flex items-center gap-3 flex-1">
        <MessageSquare className="w-5 h-5 flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-medium text-sm">{notification.senderName}</p>
          <p className="text-xs text-sky-100 truncate">{notification.content}</p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 hover:bg-sky-500 rounded p-1 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}