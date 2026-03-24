const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "duhnwxyi6";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "FilmOS";

/**
 * Upload a file directly to Cloudinary with progress tracking.
 * @param {File} file
 * @param {object} options
 * @param {string} options.folder - Cloudinary folder path
 * @param {function} options.onProgress - called with 0-100 percent
 * @returns {Promise<{file_url: string}>}
 */
export function uploadToCloudinary(file, { folder = "filmos", onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", folder);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve({ file_url: data.secure_url });
      } else {
        reject(new Error(`Cloudinary upload failed: ${xhr.status} ${xhr.responseText}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    // Use /auto/upload to support all file types including large videos
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`);
    xhr.send(formData);
  });
}