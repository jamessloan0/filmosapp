import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';

/**
 * Upload a file to S3 via a presigned URL.
 * @param {File} file
 * @param {object} options
 * @param {string} options.projectId
 * @param {function} [options.onProgress] - called with 0-100 percent
 * @returns {Promise<{file_url: string, expires_at: string}>}
 */
const MIME_MAP = {
  mov: 'video/quicktime',
  mp4: 'video/mp4',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  webm: 'video/webm',
  m4v: 'video/x-m4v',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

function getMimeType(file) {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

export async function uploadToS3(file, { projectId, onProgress } = {}) {
  const mimeType = getMimeType(file);
  // Ask backend for a presigned PUT URL
  const response = await invoke('s3GetUploadUrl', {
    fileName: file.name,
    fileType: mimeType,
    fileSize: file.size,
    projectId,
  });

  const { uploadUrl, fileUrl, expiresAt, key, error } = response.data;
  if (error) throw new Error(error);

  // Upload directly to S3 with progress tracking
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`S3 upload failed with status ${xhr.status}. Check bucket CORS policy.`));
    });
    xhr.addEventListener('error', () => reject(new Error('Upload network error — check S3 bucket CORS policy allows PUT from this origin.')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', mimeType);
    xhr.send(file);
  });

  return { file_url: fileUrl, expires_at: expiresAt, s3_key: key };
}