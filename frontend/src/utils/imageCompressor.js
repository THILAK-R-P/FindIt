/**
 * Compresses and resizes an image file in the browser using HTML5 Canvas.
 * Guarantees a clean, standardized image/jpeg Base64 Data URL optimized for
 * backend transfer, MongoDB storage, and Google Gemini API processing.
 *
 * @param {File} file - The image file selected by the user
 * @param {number} maxWidth - Maximum width (default 1200)
 * @param {number} maxHeight - Maximum height (default 1200)
 * @param {number} quality - JPEG quality between 0.0 and 1.0 (default 0.85)
 * @returns {Promise<string>} Base64 Data URL (data:image/jpeg;base64,...)
 */
export const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('Please select an image file.'));
    }

    const isImage =
      (file.type && file.type.startsWith('image/')) ||
      /\.(jpe?g|png|webp|gif|bmp|svg|avif|heic|heif)$/i.test(file.name || '');

    if (!isImage) {
      return reject(new Error('Please select a valid image file (JPEG, PNG, WebP, etc.).'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (event) => {
      const rawDataUrl = event.target.result;
      const img = new Image();
      img.onerror = () => {
        // Fallback to raw Data URL if Image decoding encounters an error
        if (typeof rawDataUrl === 'string' && rawDataUrl.startsWith('data:image')) {
          return resolve(rawDataUrl);
        }
        reject(new Error('Failed to process image format. Please try another image.'));
      };
      img.onload = () => {
        try {
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          if (dataUrl && dataUrl.startsWith('data:image')) {
            resolve(dataUrl);
          } else {
            resolve(rawDataUrl);
          }
        } catch (canvasErr) {
          resolve(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
};
