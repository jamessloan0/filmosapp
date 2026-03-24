import React, { useRef, useState } from "react";
import { Play, Pause, Maximize2, MessageSquarePlus, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoPlayer({ src, comments = [], onAddComment, readOnly = false, videoRef: externalRef }) {
  const internalRef = useRef(null);
  const videoRef = externalRef || internalRef;
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentAt, setCommentAt] = useState(0);
  const scrubberRef = useRef(null);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    setCurrentTime(videoRef.current?.currentTime || 0);
  };

  const handleLoadedMetadata = () => {
    setDuration(videoRef.current?.duration || 0);
  };

  const seekTo = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleScrubberClick = (e) => {
    if (!scrubberRef.current || !duration) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seekTo(Math.max(0, Math.min(duration, ratio * duration)));
  };

  const handleScrubberHover = (e) => {
    if (!scrubberRef.current || !duration) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setHoverTime(Math.max(0, Math.min(duration, ratio * duration)));
  };

  const handleAddCommentClick = () => {
    if (videoRef.current) videoRef.current.pause();
    setPlaying(false);
    setCommentAt(currentTime);
    setShowCommentInput(true);
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    onAddComment({ timestamp: commentAt, text: commentText.trim() });
    setCommentText("");
    setShowCommentInput(false);
  };

  const fullscreen = () => {
    videoRef.current?.requestFullscreen?.();
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-2xl overflow-hidden bg-zinc-950 shadow-2xl">
      {/* Video */}
      <div className="relative group" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={src}
          className="w-full aspect-video object-contain bg-black cursor-pointer"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          muted={muted}
        />
        {/* Play overlay */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-zinc-900 px-4 pt-3 pb-4 space-y-2">
        {/* Scrubber */}
        <div
          ref={scrubberRef}
          className="relative h-2 bg-zinc-700 rounded-full cursor-pointer group/scrub"
          onClick={handleScrubberClick}
          onMouseMove={handleScrubberHover}
          onMouseLeave={() => setHoverTime(null)}
        >
          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 bg-sky-500 rounded-full transition-none"
            style={{ width: `${progress}%` }}
          />
          {/* Scrub thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg opacity-0 group-hover/scrub:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, transform: "translate(-50%, -50%)" }}
          />
          {/* Comment markers */}
          {duration > 0 && comments.map((c) => (
            <div
              key={c.id}
              title={`${formatTime(c.timestamp)}: ${c.text}`}
              onClick={(e) => { e.stopPropagation(); seekTo(c.timestamp); }}
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-zinc-900 cursor-pointer hover:scale-150 transition-transform z-10"
              style={{ left: `${(c.timestamp / duration) * 100}%`, transform: "translate(-50%, -50%)" }}
            />
          ))}
          {/* Hover time tooltip */}
          {hoverTime !== null && duration > 0 && (
            <div
              className="absolute -top-7 bg-zinc-800 text-white text-xs px-1.5 py-0.5 rounded pointer-events-none"
              style={{ left: `${(hoverTime / duration) * 100}%`, transform: "translateX(-50%)" }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Buttons row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              {playing
                ? <Pause className="w-4 h-4 text-white fill-white" />
                : <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              }
            </button>
            <button
              onClick={() => setMuted(m => !m)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <span className="text-xs text-zinc-400 font-mono tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!readOnly && onAddComment && (
              <button
                onClick={handleAddCommentClick}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                Comment
              </button>
            )}
            <button
              onClick={fullscreen}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Comment input */}
      {showCommentInput && (
        <div className="bg-zinc-800 border-t border-zinc-700 px-4 py-3 space-y-2">
          <p className="text-xs text-amber-400 font-medium">
            Commenting at {formatTime(commentAt)}
          </p>
          <div className="flex gap-2">
            <input
              autoFocus
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
              placeholder="Add your comment..."
              className="flex-1 bg-zinc-700 text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-zinc-400 border border-zinc-600 focus:border-sky-500 transition-colors"
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim()}
              className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm rounded-lg font-medium disabled:opacity-40 transition-colors"
            >
              Post
            </button>
            <button
              onClick={() => setShowCommentInput(false)}
              className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-sm rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}