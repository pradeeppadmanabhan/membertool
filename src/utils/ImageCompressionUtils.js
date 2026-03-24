/**
 * ImageCompressionUtils.js
 * Provides image compression and format optimization utilities for mobile-friendly uploads
 */

/**
 * Compresses an image file to a web-optimized format
 * Resizes to max dimensions, converts to WebP (or JPEG fallback), and reduces quality
 *
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Maximum width in pixels (default: 1024)
 * @param {number} options.maxHeight - Maximum height in pixels (default: 1024)
 * @param {number} options.quality - Quality level 0-1 for WebP/JPEG (default: 0.75)
 * @param {string} options.format - Target format: 'webp' or 'jpeg' (default: 'webp')
 * @returns {Promise<Object>} Promise resolving to {blob, originalSizeKB, compressedSizeKB, format}
 */
export const compressImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1024,
      maxHeight = 1024,
      quality = 0.75,
      format = "webp"
    } = options;

    // Create file reader to read the uploaded file
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const img = new Image();

        img.onload = () => {
          try {
            // Calculate new dimensions while maintaining aspect ratio
            let newWidth = img.width;
            let newHeight = img.height;

            if (img.width > maxWidth || img.height > maxHeight) {
              const aspectRatio = img.width / img.height;

              if (img.width > img.height) {
                newWidth = maxWidth;
                newHeight = Math.round(maxWidth / aspectRatio);
              } else {
                newHeight = maxHeight;
                newWidth = Math.round(maxHeight * aspectRatio);
              }
            }

            // Create canvas and draw resized image
            const canvas = document.createElement("canvas");
            canvas.width = newWidth;
            canvas.height = newHeight;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            // Calculate original size in KB
            const originalSizeKB = (file.size / 1024).toFixed(2);

            // Convert to blob in target format
            const mimeType = format === "webp" ? "image/webp" : "image/jpeg";
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Canvas blob conversion failed"));
                  return;
                }

                // Calculate compressed size in KB
                const compressedSizeKB = (blob.size / 1024).toFixed(2);

                // Create a File object from the blob with appropriate extension
                const extension = format === "webp" ? "webp" : "jpg";
                const fileName = `${file.name.split(".")[0]}.${extension}`;
                const compressedFile = new File([blob], fileName, {
                  type: mimeType,
                  lastModified: new Date().getTime(),
                });

                resolve({
                  file: compressedFile,
                  originalSizeKB,
                  compressedSizeKB,
                  format,
                  compressionRatio: (
                    (1 - compressedFile.size / file.size) *
                    100
                  ).toFixed(1)
                });
              },
              mimeType,
              quality,
            );
          } catch (error) {
            reject(new Error(`Canvas processing error: ${error.message}`));
          }
        };

        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };

        // Set image source to trigger load
        img.src = event.target.result;
      } catch (error) {
        reject(new Error(`Image compression error: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    // Start reading the file
    reader.readAsDataURL(file);
  });
};

/**
 * Formats file size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Validates if compression result is acceptable
 * @param {number} compressedSizeBytes - Compressed file size in bytes
 * @param {number} maxSizeBytes - Maximum allowed size in bytes
 * @returns {Object} {isValid: boolean, message: string}
 */
export const validateCompressedSize = (
  compressedSizeBytes,
  maxSizeBytes = 1024 * 1024,
) => {
  if (compressedSizeBytes <= maxSizeBytes) {
    return {
      isValid: true,
      message: ""
    };
  }

  return {
    isValid: false,
    message: `Compressed image (${formatFileSize(compressedSizeBytes)}) exceeds maximum size of ${formatFileSize(maxSizeBytes)}. Please try a smaller image.`
  };
};
