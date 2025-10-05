/**
 * Utility functions for image handling and IPFS uploads
 */

/**
 * Convert a file to base64 data URL
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Base64 data URL
 */
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Convert multiple files to base64 data URLs
 * @param {File[]} files - Array of files to convert
 * @returns {Promise<Array>} - Array of objects with file data, name, and type
 */
export const filesToBase64Array = async (files) => {
    const convertedFiles = [];
    
    for (const file of files) {
        try {
            const base64Data = await fileToBase64(file);
            convertedFiles.push({
                data: base64Data,
                name: file.name,
                type: file.type,
                size: file.size
            });
        } catch (error) {
            console.error(`Error converting file ${file.name}:`, error);
            throw new Error(`Failed to convert file ${file.name}`);
        }
    }
    
    return convertedFiles;
};

/**
 * Validate image file
 * @param {File} file - File to validate
 * @returns {boolean} - Whether file is valid
 */
export const validateImageFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!validTypes.includes(file.type)) {
        throw new Error(`Invalid file type: ${file.type}. Supported types: ${validTypes.join(', ')}`);
    }
    
    if (file.size > maxSize) {
        throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: 10MB`);
    }
    
    return true;
};

/**
 * Validate multiple image files
 * @param {File[]} files - Array of files to validate
 * @returns {boolean} - Whether all files are valid
 */
export const validateImageFiles = (files) => {
    if (!files || files.length === 0) {
        throw new Error('No files provided');
    }
    
    if (files.length > 10) {
        throw new Error('Maximum 10 images allowed per listing');
    }
    
    files.forEach(validateImageFile);
    return true;
};

/**
 * Compress image if it's too large
 * @param {File} file - File to potentially compress
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @param {number} quality - JPEG quality (0.1 to 1.0)
 * @returns {Promise<File>} - Compressed file
 */
export const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            let { width, height } = img;
            
            // Calculate new dimensions
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
                const compressedFile = new File([blob], file.name, {
                    type: file.type,
                    lastModified: Date.now()
                });
                resolve(compressedFile);
            }, file.type, quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
};
