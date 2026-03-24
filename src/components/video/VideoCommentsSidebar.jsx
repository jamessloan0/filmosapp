import React, { useState } from "react";
import { MessageSquare, Trash2, CheckCircle2, Circle } from "lucide-react";
import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';
import { useQueryClient } from "@tanstack/react-query";

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoCommentsSidebar({ comments, onSeek, onDelete, currentUserName, fileId }) {
  const [showResolved, setShowResolved] = useState(false);
  const queryClient = useQueryClient();

  const sorted = [...comments].sort((a, b) => a.timestamp - b.timestamp);
  const unresolved = sorted.filter(c => !c.resolved);
  const resolved = sorted.filter(c => c.resolved);
  const visible = showResolved ? sorted : unresolved;

  const handleResolve = async (e, comment) => {
    e.stopPropagation();
    await entities.VideoComment.update(comment.id, { resolved: !comment.resolved });
    queryClient.invalidateQueries({ queryKey: ["video-comments", fileId] });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 flex-shrink-0">
        <MessageSquare className="w-4 h-4 text-zinc-400" />
        <span className="text-sm font-semibold text-zinc-700">Comments</span>
        {unresolved.length > 0 && (
          <span className="ml-auto text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
            {unresolved.length} open
          </span>
        )}
      </div>

      {resolved.length > 0 && (
        <button
          onClick={() => setShowResolved(s => !s)}
          className="mx-4 my-2 text-xs text-zinc-400 hover:text-zinc-600 transition-colors text-left"
        >
          {showResolved ? "Hide" : "Show"} {resolved.length} resolved
        </button>
      )}

      {visible.length === 0 && !showResolved ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center mb-3">
            <MessageSquare className="w-5 h-5 text-zinc-300" />
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Pause the video and click "Comment" to leave a timestamped note.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-50">
          {visible.map((c) => (
            <div
              key={c.id}
              className={`group px-4 py-3 hover:bg-zinc-50 transition-colors cursor-pointer ${c.resolved ? "opacity-50" : ""}`}
              onClick={() => onSeek(c.timestamp)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="text-xs font-mono font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md flex-shrink-0 mt-0.5">
                    {formatTime(c.timestamp)}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm leading-snug ${c.resolved ? "line-through text-zinc-400" : "text-zinc-800"}`}>{c.text}</p>
                    <p className="text-xs text-zinc-400 mt-1">{c.author}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={(e) => handleResolve(e, c)}
                    title={c.resolved ? "Unresolve" : "Mark resolved"}
                    className={`p-1 rounded transition-colors ${c.resolved ? "text-emerald-500 hover:text-zinc-400" : "text-zinc-300 hover:text-emerald-500"}`}
                  >
                    {c.resolved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                  </button>
                  {onDelete && c.author === currentUserName && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                      className="p-1 rounded text-zinc-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}