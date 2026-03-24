import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Clock, User, Archive, RotateCcw, Trash2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  proposal: { label: "Proposal", className: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  in_progress: { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-200" },
  delivered: { label: "Delivered", className: "bg-zinc-100 text-zinc-600 border-zinc-200" },
};

export default function ProjectCard({ project, onArchive, onRestore, onDelete }) {
  const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.proposal;
  const isArchived = !!project.archived;

  const handleAction = (e, fn) => {
    e.preventDefault();
    e.stopPropagation();
    fn(project);
  };

  const cardContent = (
    <div
      className={`group relative bg-white rounded-2xl p-5 transition-all duration-200 border
        ${isArchived
          ? "border-zinc-150 opacity-70 hover:opacity-90"
          : "border-zinc-100 shadow-sm hover:shadow-md hover:-translate-y-0.5"
        }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-base tracking-tight truncate transition-colors
            ${isArchived ? "text-zinc-500" : "text-zinc-900 group-hover:text-sky-600"}`}>
            {project.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-zinc-400">
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{project.client_name || project.client_email}</span>
          </div>
        </div>
        {isArchived ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => handleAction(e, onRestore)}
              title="Restore"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => handleAction(e, onDelete)}
              title="Delete permanently"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => handleAction(e, onArchive)}
              title="Archive project"
              className="p-1.5 rounded-lg text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
            <ArrowRight className="w-4 h-4 text-zinc-200 group-hover:text-zinc-400 transition-colors" />
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-50">
        <Badge variant="outline" className={`${status.className} text-xs font-medium`}>
          {status.label}
        </Badge>
        <div className="flex items-center gap-1 text-xs text-zinc-350">
          <Clock className="w-3 h-3 text-zinc-300" />
          <span className="text-zinc-400">
            {format(new Date(project.updated_date || project.created_date), "MMM d, yyyy")}
          </span>
        </div>
      </div>
    </div>
  );

  if (isArchived) {
    return <div className="block">{cardContent}</div>;
  }

  return (
    <Link
      to={createPageUrl("ProjectWorkspace") + `?id=${project.id}`}
      className="block"
    >
      {cardContent}
    </Link>
  );
}