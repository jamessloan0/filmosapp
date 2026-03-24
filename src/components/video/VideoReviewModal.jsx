import React, { useRef } from "react";
import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';
import { getFileUrl } from "@/components/utils/useSignedUrl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import VideoCommentsSidebar from "./VideoCommentsSidebar";

export default function VideoReviewModal({ file, src, projectId, authorName, authorType, open, onClose }) {
  const playerRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ["video-comments", file?.id],
    queryFn: () => entities.VideoComment.filter({ file_id: file.id }, "timestamp"),
    enabled: !!file?.id && open,
  });

  const handleAddComment = async ({ timestamp, text }) => {
    await entities.VideoComment.create({
      file_id: file.id,
      project_id: projectId,
      timestamp,
      text,
      author: authorName,
      author_type: authorType,
    });
    queryClient.invalidateQueries({ queryKey: ["video-comments", file.id] });
  };

  const handleDeleteComment = async (commentId) => {
    await entities.VideoComment.delete(commentId);
    queryClient.invalidateQueries({ queryKey: ["video-comments", file.id] });
  };

  const handleSeek = (timestamp) => {
    // We pass seekTo via a ref trick through a custom event
    if (playerRef.current) {
      playerRef.current.seekTo(timestamp);
    }
  };

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl w-full p-0 overflow-hidden rounded-2xl border-0 shadow-2xl bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
          <div>
            <p className="text-sm font-semibold text-white truncate max-w-xs">{file.file_name}</p>
            {file.version_number && (
              <p className="text-xs text-zinc-500">Version {file.version_number}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5 text-zinc-300" />
          </button>
        </div>

        {/* Body: video + sidebar */}
        <div className="flex flex-col lg:flex-row" style={{ height: "70vh" }}>
          {/* Video */}
          <div className="flex-1 min-w-0 flex flex-col justify-center bg-black p-4">
            <VideoPlayerWithRef
              src={src || getFileUrl(file)}
              comments={comments}
              onAddComment={handleAddComment}
              ref={playerRef}
            />
          </div>
          {/* Sidebar */}
          <div className="w-full lg:w-72 bg-white border-t lg:border-t-0 lg:border-l border-zinc-100 overflow-hidden flex flex-col">
            <VideoCommentsSidebar
              comments={comments}
              onSeek={handleSeek}
              onDelete={handleDeleteComment}
              currentUserName={authorName}
              fileId={file?.id}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Wrapper to expose seekTo via ref
const VideoPlayerWithRef = React.forwardRef(function VideoPlayerWithRef(props, ref) {
  const videoRef = React.useRef(null);

  React.useImperativeHandle(ref, () => ({
    seekTo: (time) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        videoRef.current.play();
      }
    },
  }));

  return <VideoPlayer {...props} videoRef={videoRef} />;
});