import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Create Supabase client with service key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const REVIEW_IMAGES_BUCKET = 'review-images';
const COLLECTION_IMAGES_BUCKET = 'collection-images';
const PRODUCT_IMAGES_BUCKET = 'product-images';
const VARIANT_IMAGES_BUCKET = 'variant-images';

/**
 * Storage utility for handling file uploads to Supabase Storage
 */
export class StorageService {
  /**
   * Upload a review image to Supabase Storage
   * @param fileBuffer - File buffer to upload
   * @param userId - User ID (for organizing files)
   * @param filename - Original filename
   * @param mimeType - MIME type of the file
   * @returns Public URL of the uploaded file
   */
  static async uploadReviewImage(
    fileBuffer: Buffer,
    userId: string,
    filename: string,
    mimeType: string
  ): Promise<string> {
    try {
      // Generate unique filename
      const ext = path.extname(filename);
      const randomString = crypto.randomBytes(8).toString('hex');
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}-${randomString}${ext}`;

      // Create path: user_id/filename
      const filePath = `${userId}/${uniqueFilename}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(REVIEW_IMAGES_BUCKET)
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          upsert: false, // Don't overwrite existing files
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(REVIEW_IMAGES_BUCKET)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading review image:', error);
      throw error;
    }
  }

  /**
   * Delete a review image from Supabase Storage
   * @param imageUrl - Full public URL of the image
   */
  static async deleteReviewImage(imageUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const filePath = this.extractFilePathFromUrl(imageUrl);

      if (!filePath) {
        console.warn('Could not extract file path from URL:', imageUrl);
        return;
      }

      const { error } = await supabase.storage
        .from(REVIEW_IMAGES_BUCKET)
        .remove([filePath]);

      if (error) {
        console.error('Supabase storage delete error:', error);
        throw new Error(`Failed to delete image: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting review image:', error);
      throw error;
    }
  }

  /**
   * Delete multiple review images
   * @param imageUrls - Array of public URLs
   */
  static async deleteReviewImages(imageUrls: string[]): Promise<void> {
    if (!imageUrls || imageUrls.length === 0) {
      return;
    }

    try {
      const filePaths = imageUrls
        .map((url) => this.extractFilePathFromUrl(url))
        .filter((path): path is string => path !== null);

      if (filePaths.length === 0) {
        return;
      }

      const { error } = await supabase.storage
        .from(REVIEW_IMAGES_BUCKET)
        .remove(filePaths);

      if (error) {
        console.error('Supabase storage batch delete error:', error);
        throw new Error(`Failed to delete images: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting review images:', error);
      throw error;
    }
  }

  /**
   * Extract file path from Supabase Storage public URL
   * @param publicUrl - Full public URL
   * @returns File path or null if invalid
   */
  private static extractFilePathFromUrl(publicUrl: string): string | null {
    try {
      const url = new URL(publicUrl);
      // URL format: https://{project}.supabase.co/storage/v1/object/public/review-images/{path}
      const pathMatch = url.pathname.match(
        /\/storage\/v1\/object\/public\/review-images\/(.+)$/
      );
      return pathMatch ? pathMatch[1] : null;
    } catch (error) {
      console.error('Error parsing URL:', error);
      return null;
    }
  }

  /**
   * Validate file for review image upload
   * @param mimeType - MIME type of the file
   * @param fileSize - Size of the file in bytes
   * @throws Error if validation fails
   */
  static validateReviewImage(mimeType: string, fileSize: number): void {
    // Allowed MIME types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(mimeType.toLowerCase())) {
      throw new Error(
        'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
      );
    }

    // Max file size: 5MB
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes

    if (fileSize > maxSize) {
      throw new Error('File size exceeds 5MB limit.');
    }
  }

  /**
   * Upload a collection image to Supabase Storage
   * @param fileBuffer - File buffer to upload
   * @param filename - Original filename
   * @param mimeType - MIME type of the file
   * @returns Public URL of the uploaded file
   */
  static async uploadCollectionImage(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<string> {
    try {
      // Generate unique filename
      const ext = path.extname(filename);
      const randomString = crypto.randomBytes(8).toString('hex');
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}-${randomString}${ext}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(COLLECTION_IMAGES_BUCKET)
        .upload(uniqueFilename, fileBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(COLLECTION_IMAGES_BUCKET)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading collection image:', error);
      throw error;
    }
  }

  /**
   * Validate file for collection image upload
   * @param mimeType - MIME type of the file
   * @param fileSize - Size of the file in bytes
   * @throws Error if validation fails
   */
  static validateCollectionImage(mimeType: string, fileSize: number): void {
    // Allowed MIME types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(mimeType.toLowerCase())) {
      throw new Error(
        'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
      );
    }

    // Max file size: 10MB for collection hero images
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes

    if (fileSize > maxSize) {
      throw new Error('File size exceeds 10MB limit.');
    }
  }

  /**
   * Upload a product image to Supabase Storage
   * @param fileBuffer - File buffer to upload
   * @param filename - Original filename
   * @param mimeType - MIME type of the file
   * @returns Public URL of the uploaded file
   */
  static async uploadProductImage(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<string> {
    try {
      // Generate unique filename
      const ext = path.extname(filename);
      const randomString = crypto.randomBytes(8).toString('hex');
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}-${randomString}${ext}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(uniqueFilename, fileBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading product image:', error);
      throw error;
    }
  }

  /**
   * Upload a variant image to Supabase Storage
   * @param fileBuffer - File buffer to upload
   * @param filename - Original filename
   * @param mimeType - MIME type of the file
   * @returns Public URL of the uploaded file
   */
  static async uploadVariantImage(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<string> {
    try {
      // Generate unique filename
      const ext = path.extname(filename);
      const randomString = crypto.randomBytes(8).toString('hex');
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}-${randomString}${ext}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(VARIANT_IMAGES_BUCKET)
        .upload(uniqueFilename, fileBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(VARIANT_IMAGES_BUCKET)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading variant image:', error);
      throw error;
    }
  }

  /**
   * Validate file for product/variant image upload
   * @param mimeType - MIME type of the file
   * @param fileSize - Size of the file in bytes
   * @throws Error if validation fails
   */
  static validateProductImage(mimeType: string, fileSize: number): void {
    // Allowed MIME types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(mimeType.toLowerCase())) {
      throw new Error(
        'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
      );
    }

    // Max file size: 5MB
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes

    if (fileSize > maxSize) {
      throw new Error('File size exceeds 5MB limit.');
    }
  }

  /**
   * Check if the review-images bucket exists, create if not
   */
  static async ensureBucketExists(): Promise<void> {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();

      if (error) {
        console.error('Error listing buckets:', error);
        return;
      }

      const bucketExists = buckets?.some(
        (bucket) => bucket.name === REVIEW_IMAGES_BUCKET
      );

      if (!bucketExists) {
        console.log(`Creating ${REVIEW_IMAGES_BUCKET} bucket...`);

        const { error: createError } = await supabase.storage.createBucket(
          REVIEW_IMAGES_BUCKET,
          {
            public: true,
            fileSizeLimit: 5 * 1024 * 1024, // 5MB
          }
        );

        if (createError) {
          console.error('Error creating bucket:', createError);
        } else {
          console.log(`${REVIEW_IMAGES_BUCKET} bucket created successfully`);
        }
      }

      // Also ensure collection-images bucket exists
      const collectionBucketExists = buckets?.some(
        (bucket) => bucket.name === COLLECTION_IMAGES_BUCKET
      );

      if (!collectionBucketExists) {
        console.log(`Creating ${COLLECTION_IMAGES_BUCKET} bucket...`);

        const { error: createError } = await supabase.storage.createBucket(
          COLLECTION_IMAGES_BUCKET,
          {
            public: true,
            fileSizeLimit: 10 * 1024 * 1024, // 10MB
          }
        );

        if (createError) {
          console.error('Error creating bucket:', createError);
        } else {
          console.log(`${COLLECTION_IMAGES_BUCKET} bucket created successfully`);
        }
      }

      // Ensure product-images bucket exists
      const productBucketExists = buckets?.some(
        (bucket) => bucket.name === PRODUCT_IMAGES_BUCKET
      );

      if (!productBucketExists) {
        console.log(`Creating ${PRODUCT_IMAGES_BUCKET} bucket...`);

        const { error: createError } = await supabase.storage.createBucket(
          PRODUCT_IMAGES_BUCKET,
          {
            public: true,
            fileSizeLimit: 5 * 1024 * 1024, // 5MB
          }
        );

        if (createError) {
          console.error('Error creating bucket:', createError);
        } else {
          console.log(`${PRODUCT_IMAGES_BUCKET} bucket created successfully`);
        }
      }

      // Ensure variant-images bucket exists
      const variantBucketExists = buckets?.some(
        (bucket) => bucket.name === VARIANT_IMAGES_BUCKET
      );

      if (!variantBucketExists) {
        console.log(`Creating ${VARIANT_IMAGES_BUCKET} bucket...`);

        const { error: createError } = await supabase.storage.createBucket(
          VARIANT_IMAGES_BUCKET,
          {
            public: true,
            fileSizeLimit: 5 * 1024 * 1024, // 5MB
          }
        );

        if (createError) {
          console.error('Error creating bucket:', createError);
        } else {
          console.log(`${VARIANT_IMAGES_BUCKET} bucket created successfully`);
        }
      }
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
    }
  }
}
