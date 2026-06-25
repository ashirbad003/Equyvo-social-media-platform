const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}`;
const API_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}`;

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  resourceType: 'image' | 'video';
  format: string;
  bytes: number;
  width: number;
  height: number;
  createdAt: string;
  duration?: number;
}

export function isCloudinaryConfigured(): boolean {
  return !!(CLOUD_NAME && UPLOAD_PRESET);
}

export function compressImage(
  file: File,
  maxWidth = 1200,
  quality = 0.6
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const scale = Math.min(1, maxWidth / img.width);
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Could not get canvas context')); return; }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image for compression'));
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadToCloudinary(
  file: File | Blob,
  options?: {
    folder?: string;
    publicId?: string;
    tags?: string[];
    skipCompression?: boolean;
  }
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env'
    );
  }

  const isImage = file instanceof File && file.type.startsWith('image/');

  let uploadFile = file;
  if (isImage && !options?.skipCompression) {
    try {
      uploadFile = await compressImage(file);
    } catch {
      // fall through to upload original if compression fails
    }
  }

  const formData = new FormData();
  formData.append('file', uploadFile);
  formData.append('upload_preset', UPLOAD_PRESET!);

  if (options?.folder) formData.append('folder', options.folder);
  if (options?.publicId) formData.append('public_id', options.publicId);
  if (options?.tags) formData.append('tags', options.tags.join(','));

  const resourceType = isImage ? 'image' : 'video';

  const compression = resourceType === 'image'
    ? 'q_auto:low,f_auto,c_limit,w_1080'
    : 'q_20,w_720';

  formData.append('transformation', compression);

  const response = await fetch(`${API_URL}/${resourceType}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Upload failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    publicId: data.public_id,
    secureUrl: data.secure_url,
    resourceType: data.resource_type,
    format: data.format,
    bytes: data.bytes,
    width: data.width,
    height: data.height,
    createdAt: data.created_at,
    duration: data.duration,
  };
}

export function getCloudinaryUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: number | 'auto';
    format?: string;
    resourceType?: 'image' | 'video';
    effects?: string[];
  }
): string {
  if (!CLOUD_NAME) return '';

  const transformations: string[] = [];

  if (options?.width) transformations.push(`w_${options.width}`);
  if (options?.height) transformations.push(`h_${options.height}`);
  if (options?.crop) transformations.push(`c_${options.crop}`);
  if (options?.quality) transformations.push(`q_${options.quality}`);
  if (options?.format) transformations.push(`f_${options.format}`);
  if (options?.effects?.length) transformations.push(...options.effects);

  const transformStr = transformations.length > 0 ? transformations.join(',') + '/' : '';
  const rt = options?.resourceType || 'image';

  return `${BASE_URL}/${rt}/upload/${transformStr}${publicId}`;
}

export function getOptimizedImageUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: string;
  }
): string {
  return getCloudinaryUrl(publicId, {
    ...options,
    quality: 'auto:good',
    format: 'auto',
    crop: options?.crop || 'fill',
    effects: ['e_improve'],
  });
}

export function getOptimizedVideoUrl(publicId: string, options?: { width?: number; height?: number }): string {
  return getCloudinaryUrl(publicId, {
    ...options,
    quality: 'auto:good',
    format: 'auto',
    resourceType: 'video',
  });
}

export function getThumbnailUrl(
  publicId: string,
  options?: { width?: number; height?: number }
): string {
  return getCloudinaryUrl(publicId, {
    width: options?.width || 300,
    height: options?.height || 400,
    quality: 'auto:good',
    crop: 'fill',
    format: 'auto',
  });
}

export function getAvatarUrl(publicId: string, size?: number): string {
  return getCloudinaryUrl(publicId, {
    width: size || 150,
    height: size || 150,
    quality: 'auto:good',
    crop: 'fill',
    format: 'auto',
    effects: ['g_face', 'r_max'],
  });
}
