import React from "react";
import { X, Download } from "lucide-react";
import { downloadFile } from "@/components/utils/useSignedUrl";

function getFileType(fileName) {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'].includes(ext)) return 'video';
  if (ext === 'pdf') return 'pdf';
  return 'other';
}

export default function FilePreviewModal({ file, onClose }) {
  if (!file) return null;
  const type = getFileType(file.file_name);
  const url = file.file_url;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-zinc-900 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-700 flex-shrink-0">
          <p className="text-sm font-medium text-zinc-200 truncate">{file.file_name}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => downloadFile(file)}
              className="p-2 rounded-lg hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto flex items-center justify-center min-h-0 bg-zinc-950 p-4">
          {type === 'image' && (
            <img
              src={url}
              alt={file.file_name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          )}
          {type === 'video' && (
            <video
              src={url}
              controls
              className="max-w-full max-h-full rounded-lg"
              style={{ maxHeight: '70vh' }}
            />
          )}
          {type === 'pdf' && (
            <iframe
              src={url}
              title={file.file_name}
              className="w-full rounded-lg"
              style={{ height: '70vh' }}
            />
          )}
          {type === 'other' && (
            <div className="text-center text-zinc-400 py-12">
              <p className="text-sm mb-3">Preview not available for this file type.</p>
              <button
                onClick={() => downloadFile(file)}
                className="text-sky-400 hover:text-sky-300 text-sm underline"
              >
                Download to view
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}