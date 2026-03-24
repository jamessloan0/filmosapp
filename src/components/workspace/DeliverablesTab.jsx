import React, { useState, useRef } from "react";
import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Film, FileText, Image, Loader2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { uploadToS3 } from "@/components/utils/s3Upload";
import VideoReviewModal from "@/components/video/VideoReviewModal";
import ShareLinkPopover from "@/components/workspace/ShareLinkPopover";
import DeliverableFileRow from "@/components/workspace/DeliverableFileRow";

function isVideo(fileName) {
  return /\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(fileName || "");
}

function getIcon(fileName) {
  const ext = (fileName || "").split(".").pop().toLowerCase();
  if (["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return Image;
  if (["mp4","mov","avi","mkv","webm","m4v"].includes(ext)) return Film;
  return FileText;
}

function generateToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 24 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function DeliverablesTab({ projectId, authorName, authorType = "filmmaker", isClient = false, isPro = false, files: propFiles, onRefresh }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const versionInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [versioningFor, setVersioningFor] = useState(null);
  const [versionNote, setVersionNote] = useState("");
  const [reviewFile, setReviewFile] = useState(null);
  const [reviewSrc, setReviewSrc] = useState(null);
  const [expanded, setExpanded] = useState({});

  const { data: fetchedFiles = [] } = useQuery({
    queryKey: ["deliverables", projectId],
    queryFn: () => entities.ProjectFile.filter({ project_id: projectId, category: "deliverables" }, "created_date"),
    enabled: !!projectId && !isClient,
  });

  const allFiles = isClient ? (propFiles || []) : fetchedFiles;

  const refresh = () => {
    if (isClient && onRefresh) {
      onRefresh();
    } else {
      queryClient.invalidateQueries({ queryKey: ["deliverables", projectId] });
    }
  };

  // Build version tree: top-level files + their versions
  const rootFiles = allFiles.filter(f => !f.parent_file_id);
  const getVersions = (fileId) => allFiles.filter(f => f.parent_file_id === fileId).sort((a, b) => (a.version_number || 1) - (b.version_number || 1));

  const handleUpload = async (file, parentFile = null) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const { file_url, expires_at, s3_key } = await uploadToS3(file, {
        projectId,
        onProgress: setUploadProgress,
      });
      const versionNumber = parentFile
        ? (getVersions(parentFile.id).length + 2)
        : 1;
      await entities.ProjectFile.create({
        project_id: projectId,
        file_name: file.name,
        file_url,
        s3_key,
        category: "deliverables",
        uploaded_by: authorName,
        parent_file_id: parentFile?.id || null,
        version_number: parentFile ? versionNumber : 1,
        version_note: versionNote.trim() || null,
        expires_at,
      });
      await entities.Activity.create({
        project_id: projectId,
        type: "file_upload",
        description: parentFile
          ? `Uploaded version ${versionNumber} of "${parentFile.file_name}"`
          : `Uploaded deliverable "${file.name}"`,
        actor_name: authorName,
      });
      if (parentFile) {
        setExpanded(prev => ({ ...prev, [parentFile.id]: true }));
      }
      refresh();
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setVersioningFor(null);
      setVersionNote("");
    }
  };

  const handleGenerateShareLink = async (file) => {
    const token = generateToken();
    await entities.ProjectFile.update(file.id, {
      share_token: token,
      share_enabled: true,
    });
    refresh();
  };

  const handleDisableShare = async (file) => {
    await entities.ProjectFile.update(file.id, { share_enabled: false });
    refresh();
  };

  const handleToggleDownloads = async (file) => {
    await entities.ProjectFile.update(file.id, { downloads_disabled: !file.downloads_disabled });
    refresh();
  };

  const shareUrl = (file) =>
    file.share_token
      ? `${window.location.origin}/ShareFile?token=${file.share_token}`
      : null;

  return (
    <div className="space-y-6">
      {/* Upload bar (filmmaker only) */}
      {!isClient && (
        <div className="bg-white border border-zinc-100 rounded-2xl p-4 shadow-sm">
          <input ref={fileInputRef} type="file" className="hidden"
            onChange={(e) => { handleUpload(e.target.files[0]); e.target.value = ""; }} />
          <div className="flex items-center gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-zinc-900 hover:bg-zinc-800 rounded-xl"
            >
              {uploading
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <Upload className="w-4 h-4 mr-2" />}
              {uploading ? `Uploading ${uploadProgress}%` : "Upload Deliverable"}
            </Button>
            {uploading && (
              <div className="flex-1 bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-sky-500 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Files list */}
      {rootFiles.length === 0 ? (
        <div className="bg-white border border-zinc-100 rounded-2xl p-14 text-center shadow-sm">
          <Film className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-400">No deliverables yet</p>
          {!isClient && <p className="text-xs text-zinc-300 mt-1">Upload your final edits and exports here.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {rootFiles.map((file) => {
            const versions = getVersions(file.id);
            const latestFile = versions.length > 0 ? versions[versions.length - 1] : file;
            const totalVersions = versions.length + 1;
            const isExpanded = expanded[file.id];
            const FileIcon = getIcon(file.file_name);
            const video = isVideo(file.file_name);

            return (
              <div key={file.id} className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm">
                {/* Root file row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${video ? "bg-sky-50" : "bg-zinc-50"}`}>
                    <FileIcon className={`w-5 h-5 ${video ? "text-sky-500" : "text-zinc-400"}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-zinc-900 truncate">{file.file_name}</p>
                      <Badge variant="outline" className="text-xs bg-zinc-50 border-zinc-200 text-zinc-500">
                        {totalVersions === 1 ? "v1" : `${totalVersions} versions`}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {format(new Date(file.created_date), "MMM d, yyyy")} · by {file.uploaded_by}
                    </p>
                    {file.version_note && (
                      <p className="text-xs text-zinc-500 mt-1 italic">"{file.version_note}"</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <DeliverableFileRow
                      file={latestFile}
                      isVideo={video}
                      FileIcon={FileIcon}
                      shareUrl={shareUrl(latestFile)}
                      onGenerate={() => handleGenerateShareLink(latestFile)}
                      onDisable={() => handleDisableShare(latestFile)}
                      onReview={(f, src) => { setReviewFile(f); setReviewSrc(src); }}
                      onToggleDownloads={handleToggleDownloads}
                      isClient={isClient}
                      isPro={isPro}
                    />
                    {!isClient && (
                      <button
                        onClick={() => setVersioningFor(file)}
                        className="p-2 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-700"
                        title="Upload new version"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                    {versions.length > 0 && (
                      <button
                        onClick={() => setExpanded(prev => ({ ...prev, [file.id]: !prev[file.id] }))}
                        className="p-2 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-400"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Versions */}
                {isExpanded && versions.map((v, idx) => {
                  const VersionIcon = getIcon(v.file_name);
                  const vVideo = isVideo(v.file_name);
                  return (
                    <div key={v.id} className="flex items-center gap-4 px-5 py-3 bg-zinc-50 border-t border-zinc-100">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-zinc-100 ml-3">
                        <VersionIcon className="w-3.5 h-3.5 text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-zinc-600 truncate">{v.file_name}</p>
                          <Badge variant="outline" className="text-[10px] bg-white border-zinc-200 text-zinc-400">
                            v{v.version_number || idx + 2}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-zinc-400">{format(new Date(v.created_date), "MMM d, yyyy")}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DeliverableFileRow
                          file={v}
                          isVideo={vVideo}
                          FileIcon={VersionIcon}
                          shareUrl={shareUrl(v)}
                          onGenerate={() => handleGenerateShareLink(v)}
                          onDisable={() => handleDisableShare(v)}
                          onReview={(f, src) => { setReviewFile(f); setReviewSrc(src); }}
                          onToggleDownloads={handleToggleDownloads}
                          isClient={isClient}
                          isPro={isPro}
                          compact
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Version upload inline */}
                {versioningFor?.id === file.id && (
                  <div className="border-t border-zinc-100 px-5 py-4 bg-zinc-50 space-y-3">
                    <input ref={versionInputRef} type="file" className="hidden"
                      onChange={(e) => { handleUpload(e.target.files[0], file); e.target.value = ""; }} />
                    <input
                      type="text"
                      placeholder="What changed? (optional note for client)"
                      value={versionNote}
                      onChange={(e) => setVersionNote(e.target.value)}
                      className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-sky-400 transition-colors"
                    />
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        onClick={() => versionInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs"
                      >
                        {uploading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                        {uploading ? `${uploadProgress}%` : "Choose File"}
                      </Button>
                      <button onClick={() => { setVersioningFor(null); setVersionNote(""); }} className="text-xs text-zinc-400 hover:text-zinc-600">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Video review modal */}
      {reviewFile && (
        <VideoReviewModal
          file={reviewFile}
          src={reviewSrc}
          projectId={projectId}
          authorName={authorName}
          authorType={authorType}
          open={!!reviewFile}
          onClose={() => { setReviewFile(null); setReviewSrc(null); }}
        />
      )}
    </div>
  );
}