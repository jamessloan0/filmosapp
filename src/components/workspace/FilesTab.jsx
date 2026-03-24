import React, { useState, useRef } from "react";
import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, FileText, Image, Film, File, Loader2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { uploadToS3 } from "@/components/utils/s3Upload";
import { downloadFile } from "@/components/utils/useSignedUrl";
import FilePreviewModal from "@/components/workspace/FilePreviewModal";

const CATEGORIES = [
  { value: "proposal", label: "Proposal" },
  { value: "references", label: "References" },
  { value: "drafts", label: "Drafts" },
  { value: "deliverables", label: "Deliverables" },
];

const CATEGORY_COLORS = {
  proposal: "bg-amber-50 text-amber-700 border-amber-200",
  references: "bg-purple-50 text-purple-700 border-purple-200",
  drafts: "bg-blue-50 text-blue-700 border-blue-200",
  deliverables: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function getFileIcon(fileName) {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return Image;
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return Film;
  return FileText;
}

export default function FilesTab({ files, projectId, isClient, onFileUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("proposal");
  const [filterCategory, setFilterCategory] = useState("all");
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const { file_url, expires_at, s3_key } = await uploadToS3(file, {
        projectId,
        onProgress: setUploadProgress,
      });

      await entities.ProjectFile.create({
        project_id: projectId,
        file_name: file.name,
        file_url,
        s3_key,
        category: selectedCategory,
        uploaded_by: "Filmmaker",
        expires_at,
      });

      await entities.Activity.create({
        project_id: projectId,
        type: "file_upload",
        description: `Uploaded "${file.name}" to ${selectedCategory}`,
        actor_name: "Filmmaker",
      });

      onFileUploaded();
    } catch (err) {
      console.error('Upload failed:', err.message);
      // show error via toast if available, else alert
      const { toast } = await import('@/components/ui/use-toast').then(m => ({ toast: m.toast })).catch(() => ({ toast: null }));
      if (toast) toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      else alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredFiles = filterCategory === "all"
    ? files
    : files.filter((f) => f.category === filterCategory);

  const groupedFiles = CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = filteredFiles.filter((f) => f.category === cat.value);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      {/* Upload bar */}
      {!isClient && (
        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-zinc-900 hover:bg-zinc-800"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {uploading ? `Uploading ${uploadProgress}%` : "Upload File"}
            </Button>
          </div>
          {uploading && (
            <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-sky-500 h-1.5 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filterCategory === "all"
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          All Files ({files.length})
        </button>
        {CATEGORIES.map((c) => {
          const count = files.filter((f) => f.category === c.value).length;
          return (
            <button
              key={c.value}
              onClick={() => setFilterCategory(c.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterCategory === c.value
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {c.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Files list */}
      {filteredFiles.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
          <File className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No files yet</p>
        </div>
      ) : (
        Object.entries(groupedFiles).map(([category, catFiles]) => {
          if (catFiles.length === 0) return null;
          const catLabel = CATEGORIES.find((c) => c.value === category)?.label;
          return (
            <div key={category}>
              <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
                {catLabel}
              </h3>
              <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
                {catFiles.map((file) => {
                  const FileIcon = getFileIcon(file.file_name);
                  return (
                    <div key={file.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                        <FileIcon className="w-4 h-4 text-zinc-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{file.file_name}</p>
                        <p className="text-xs text-zinc-400">
                          {format(new Date(file.created_date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge variant="outline" className={`${CATEGORY_COLORS[file.category]} text-xs hidden sm:inline-flex`}>
                        {catLabel}
                      </Badge>
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4 text-zinc-500" />
                      </button>
                      <button
                        onClick={() => downloadFile(file)}
                        className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-zinc-500" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}