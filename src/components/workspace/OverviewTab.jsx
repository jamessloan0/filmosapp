import React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Mail, FileText, MessageSquare, Receipt, ArrowUpRight } from "lucide-react";

const STATUS_CONFIG = {
  proposal: { label: "Proposal", className: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  in_progress: { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-200" },
  delivered: { label: "Delivered", className: "bg-zinc-100 text-zinc-700 border-zinc-200" },
};

const ACTIVITY_ICONS = {
  file_upload: FileText,
  message: MessageSquare,
  invoice_created: Receipt,
  status_change: ArrowUpRight,
};

export default function OverviewTab({ project, activities, onStatusChange, isClient }) {
  const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.proposal;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Project Info */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">
            Project Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-zinc-400 mb-1">Project Name</p>
              <p className="font-medium text-zinc-900">{project.name}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">Client</p>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                <p className="font-medium text-zinc-900">{project.client_email}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">Created</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <p className="font-medium text-zinc-900">
                  {format(new Date(project.created_date), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">Status</p>
              {!isClient ? (
                <Select value={project.status} onValueChange={onStatusChange}>
                  <SelectTrigger className="w-44 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className={`${status.className}`}>
                  {status.label}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">
          Recent Activity
        </h3>
        {activities.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-8">No activity yet</p>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, 10).map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.type] || FileText;
              return (
                <div key={activity.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-700">{activity.description}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {format(new Date(activity.created_date), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}