import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Play, Loader2, DownloadCloud, EyeOff } from "lucide-react";
import { useSignedUrl, downloadFile } from "@/components/utils/useSignedUrl";
import ShareLinkPopover from "@/components/workspace/ShareLinkPopover";

export default function DeliverableFileRow({ file, isVideo, FileIcon, shareUrl, onGenerate, onDisable, onReview, onToggleDownloads, isClient = false, isPro = false, compact = false }) {
  const mediaUrl = useSignedUrl(file);

  const isProcessing = isVideo && file.proxy_status === 'processing';
  const proxyFailed = isVideo && file.proxy_status === 'failed';
  const canReview = isVideo && !isProcessing;
  const downloadsDisabled = !!file.downloads_disabled;

  return (
    <>
      {isVideo && isProcessing && (
        <span className={`flex items-center gap-1 text-zinc-400 text-xs ${compact ? "" : "px-1"}`}>
          <Loader2 className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"} animate-spin`} />
          {!compact && "Processing…"}
        </span>
      )}

      {canReview && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => mediaUrl && onReview(file, mediaUrl)}
          disabled={!mediaUrl}
          className={`rounded-lg text-sky-600 border-sky-200 hover:bg-sky-50 text-xs gap-1.5 ${compact ? "h-7" : ""}`}
          title={proxyFailed ? "Playing original (proxy failed)" : file.proxy_status === 'ready' ? "Playing optimized proxy" : "Review video"}
        >
          {!mediaUrl
            ? <Loader2 className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"} animate-spin`} />
            : <Play className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
          }
          Review
        </Button>
      )}

      {!isClient && (
        <ShareLinkPopover
          file={file}
          shareUrl={shareUrl}
          onGenerate={onGenerate}
          onDisable={onDisable}
          compact={compact}
        />
      )}

      {/* Download toggle (filmmaker Pro only) */}
      {!isClient && isPro && onToggleDownloads && (
        <button
          onClick={() => onToggleDownloads(file)}
          className={`${compact ? "p-1.5" : "p-2"} rounded-lg hover:bg-zinc-100 transition-colors ${downloadsDisabled ? "text-amber-500 hover:text-amber-700" : "text-zinc-400 hover:text-zinc-700"}`}
          title={downloadsDisabled ? "Downloads disabled — click to enable" : "Disable client downloads"}
        >
          {downloadsDisabled
            ? <EyeOff className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
            : <DownloadCloud className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
          }
        </button>
      )}

      {/* Download button — hidden for clients when disabled */}
      {!(isClient && downloadsDisabled) && (
        <button
          onClick={() => downloadFile(file)}
          className={`${compact ? "p-1.5" : "p-2"} rounded-lg hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-700`}
          title="Download original file"
        >
          <Download className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
        </button>
      )}
    </>
  );
}