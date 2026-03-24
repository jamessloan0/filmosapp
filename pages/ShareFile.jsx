import React, { useState, useEffect } from "react";
import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';
import { useQuery } from "@tanstack/react-query";
import { Film, Download, AlertTriangle, Loader2, FileText, Image, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoPlayer from "@/components/video/VideoPlayer";
import { useSignedUrl, downloadFile } from "@/components/utils/useSignedUrl";

function isVideo(name) {
  return /\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(name || "");
}
function isImage(name) {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name || "");
}

export default function ShareFile() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const { data: file, isLoading, error } = useQuery({
    queryKey: ["share-file", token],
    queryFn: async () => {
      const files = await entities.ProjectFile.filter({ share_token: token, share_enabled: true });
      if (!files || files.length === 0) return null;
      const f = files[0];
      // Enforce share link expiry
      if (f.share_expires_at && new Date(f.share_expires_at) < new Date()) return null;
      return f;
    },
    enabled: !!token,
  });

  if (!token) {
    return <ErrorState message="Invalid share link." />;
  }
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
      </div>
    );
  }
  if (!file) {
    return <ErrorState message="This link is no longer active or has been disabled." />;
  }

  const video = isVideo(file.file_name);
  const image = isImage(file.file_name);
  const mediaUrl = useSignedUrl(file);

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-10">
        <img
          src="https://media.base44.com/images/public/69b490115c68bd1fe6d609a8/19ed2b1d5_filmOSlogomain-removebg-preview.png"
          alt="FilmOS"
          className="h-9 w-auto"
        />
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 overflow-hidden">
        {/* Preview area */}
        {video ? (
          <div className="bg-zinc-950">
            {mediaUrl
              ? <VideoPlayer src={mediaUrl} comments={[]} readOnly />
              : <div className="flex items-center justify-center aspect-video"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
            }
          </div>
        ) : image ? (
          <div className="bg-zinc-100 flex items-center justify-center p-4" style={{ maxHeight: 400 }}>
            <img
              src={mediaUrl || file.file_url}
              alt={file.file_name}
              className="max-h-96 max-w-full rounded-xl object-contain shadow-md"
            />
          </div>
        ) : (
          <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center py-16">
            <div className="w-20 h-20 rounded-3xl bg-white shadow-md flex items-center justify-center">
              <FileText className="w-9 h-9 text-zinc-300" />
            </div>
          </div>
        )}

        {/* File info + download */}
        <div className="px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 text-base truncate">{file.file_name}</p>
            <p className="text-sm text-zinc-400 mt-0.5">Shared via FilmOS</p>
          </div>
          {!file.downloads_disabled && (
            <Button
              onClick={() => downloadFile(file)}
              className="bg-zinc-900 hover:bg-zinc-800 rounded-xl h-10 px-6 font-medium flex-shrink-0 shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-zinc-400 mt-6">Powered by FilmOS · Filmmaker collaboration platform</p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center mb-5">
        <AlertTriangle className="w-7 h-7 text-zinc-400" />
      </div>
      <h1 className="text-xl font-bold text-zinc-800 mb-2">Link Unavailable</h1>
      <p className="text-sm text-zinc-400 max-w-xs">{message}</p>
    </div>
  );
}