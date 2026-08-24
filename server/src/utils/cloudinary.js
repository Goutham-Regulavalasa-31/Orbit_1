import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

/**
 * Cloudinary configuration.
 * Reads credentials exclusively from environment variables — never hardcoded.
 * Called once at module load time; safe because dotenv is loaded in server.js
 * before any other imports.
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // always use HTTPS URLs
});

// ── Folder structure in Cloudinary ────────────────────────────────────────────
const FOLDERS = {
  images: "orbit/posts/images",
  pdfs: "orbit/posts/pdfs",
};

/**
 * Converts a Buffer to a Readable stream.
 * Required because Cloudinary's upload_stream expects a Node.js stream,
 * but Multer's memoryStorage gives us a Buffer.
 *
 * @param {Buffer} buffer
 * @returns {Readable}
 */
const bufferToStream = (buffer) => {
  const readable = new Readable({
    read() {
      this.push(buffer);
      this.push(null); // signal end-of-stream
    },
  });
  return readable;
};

/**
 * Uploads a file buffer to Cloudinary.
 *
 * @param {Buffer} buffer     - The file buffer from multer memoryStorage
 * @param {string} mimetype   - MIME type of the file (e.g. "image/jpeg")
 * @param {string} [folderOverride] - Use a folder other than the default posts/{images,pdfs} pair (e.g. club covers)
 * @returns {Promise<{ url: string, publicId: string, resourceType: string }>}
 * @throws  Will reject if Cloudinary upload fails
 */
export const uploadToCloudinary = (buffer, mimetype, folderOverride) => {
  const isPdf = mimetype === "application/pdf";

  const uploadOptions = {
    folder: folderOverride ?? (isPdf ? FOLDERS.pdfs : FOLDERS.images),
    resource_type: isPdf ? "raw" : "image",
    // For images: auto-quality + auto-format for optimal delivery
    ...(isPdf
      ? {}
      : {
          quality: "auto",
          fetch_format: "auto",
          // Limit max dimensions while preserving aspect ratio
          transformation: [{ width: 2048, crop: "limit" }],
        }),
  };

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          return reject(
            new Error(`Cloudinary upload failed: ${error.message}`)
          );
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: isPdf ? "raw" : "image",
        });
      }
    );

    bufferToStream(buffer).pipe(uploadStream);
  });
};

/**
 * Deletes a file from Cloudinary by its public_id.
 * Used when a post is deleted to clean up orphaned media assets.
 *
 * @param {string} publicId      - The Cloudinary public_id
 * @param {string} resourceType  - "image" | "raw"
 * @returns {Promise<void>}
 */
export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    // Log but don't throw — a failed media deletion should not block the
    // post deletion response. The asset can be cleaned up manually.
    console.error(`⚠️  Cloudinary deletion failed for ${publicId}:`, error.message);
  }
};

export default cloudinary;
