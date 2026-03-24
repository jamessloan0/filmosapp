import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Link2, Check, Copy, X } from "lucide-react";

export default function ShareLinkPopover({ file, shareUrl, onGenerate, onDisable, compact = false }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`rounded-lg hover:bg-zinc-100 transition-colors ${
            file.share_enabled ? "text-sky-500" : "text-zinc-400 hover:text-zinc-700"
          } ${compact ? "p-1.5" : "p-2"}`}
          title="Share link"
        >
          <Link2 className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 rounded-xl shadow-xl border-zinc-100" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-800">Share Link</p>
            {file.share_enabled && (
              <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                Active
              </span>
            )}
          </div>

          {file.share_enabled && shareUrl ? (
            <>
              <div className="bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2 flex items-center gap-2">
                <p className="text-xs text-zinc-500 flex-1 truncate font-mono">{shareUrl}</p>
                <button onClick={handleCopy} className="flex-shrink-0 text-zinc-400 hover:text-zinc-700 transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-xs text-zinc-400">Anyone with this link can preview and download the file.</p>
              <div className="flex gap-2">
                <Button onClick={handleCopy} size="sm" className="flex-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs">
                  {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
                <Button onClick={onDisable} size="sm" variant="outline" className="rounded-lg text-xs text-red-500 border-red-200 hover:bg-red-50">
                  <X className="w-3.5 h-3.5 mr-1" />
                  Disable
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-zinc-400">
                Generate a shareable link. Anyone with the link can preview and download this file without logging in.
              </p>
              <Button onClick={onGenerate} size="sm" className="w-full rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs">
                <Link2 className="w-3.5 h-3.5 mr-1.5" />
                Generate Share Link
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}