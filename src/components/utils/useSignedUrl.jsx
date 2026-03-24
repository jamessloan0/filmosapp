import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';

const CLOUDFRONT_BASE = 'https://d1uwhxuquz3bk7.cloudfront.net';

/**
 * Returns the CloudFront URL for a file (for streaming/preview when no proxy exists).
 */
export function getFileUrl(file) {
  if (!file) return null;
  if (file.s3_key) return `${CLOUDFRONT_BASE}/${file.s3_key}`;
  return file.file_url || null;
}

/**
 * Returns the best URL for video playback:
 * - If a low-bitrate proxy is ready (Cloudinary), use it for smooth streaming.
 * - Otherwise fall back to the original CloudFront URL.
 */
export function getPlaybackUrl(file) {
  if (!file) return null;
  if (file.proxy_status === 'ready' && file.proxy_url) return file.proxy_url;
  return getFileUrl(file);
}

/**
 * Hook version — returns playback URL (proxy if ready, else original).
 */
export function useSignedUrl(file) {
  return getPlaybackUrl(file);
}

/**
 * Forces browser to download the ORIGINAL, uncompressed file from S3.
 * Gets a presigned S3 URL with Content-Disposition: attachment.
 * Falls back to opening the URL in a new tab for non-S3 files.
 */
export async function downloadFile(file) {
  if (!file) return;

  if (file.s3_key) {
    try {
      const res = await invoke('s3GetDownloadUrl', {
        s3Key: file.s3_key,
        fileName: file.file_name,
      });
      const signedUrl = res.data?.signedUrl;
      if (signedUrl) {
        const a = document.createElement('a');
        a.href = signedUrl;
        a.download = file.file_name || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
    } catch (e) {
      console.error('Download error:', e);
    }
  }

  // Fallback for legacy (non-S3) files
  const url = getFileUrl(file);
  if (url) window.open(url, '_blank');
}