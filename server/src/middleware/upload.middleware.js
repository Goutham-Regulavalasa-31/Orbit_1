import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

// ── Allowed MIME types ────────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

// ── Size limits (in bytes) ────────────────────────────────────────────────────
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_PDF_SIZE   = 20 * 1024 * 1024; // 20 MB

/**
 * Multer memory-storage configuration.
 *
 * Why memory storage (not disk)?
 * - Files are piped directly from RAM → Cloudinary upload_stream
 * - No temp files on disk → no cleanup needed, no disk I/O overhead
 * - Safe for serverless / container deployments with ephemeral filesystems
 *
 * Trade-off: large files briefly occupy heap memory. The 20MB hard cap
 * on PDFs and the 5-file limit keep this bounded to ~100MB worst case.
 */
const storage = multer.memoryStorage();

/**
 * Custom file filter — rejects unsupported MIME types before the buffer
 * is even allocated, saving memory on invalid uploads.
 */
const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      new ApiError(
        400,
        `File type "${file.mimetype}" is not supported. ` +
          "Allowed types: JPEG, PNG, WEBP, GIF, PDF."
      ),
      false
    );
  }
  cb(null, true);
};

/**
 * Multer instance.
 * Max file size is set to the higher PDF limit (20MB); per-file MIME-based
 * enforcement happens in the service layer after Multer has run.
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_PDF_SIZE,   // hard upper bound — Multer enforces this
    files: 5,                 // max 5 files per request
    fields: 10,               // max 10 non-file form fields
  },
});

/**
 * Per-file MIME-aware size validation.
 * Call this after `upload.array('media', 5)` to enforce the lower image cap.
 * Multer only supports a single fileSize limit — this middleware bridges the gap.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} _res
 * @param {import('express').NextFunction} next
 */
export const validateFileSizes = (req, _res, next) => {
  if (!req.files || req.files.length === 0) return next();

  for (const file of req.files) {
    const isImage = file.mimetype.startsWith("image/");
    const limit = isImage ? MAX_IMAGE_SIZE : MAX_PDF_SIZE;

    if (file.size > limit) {
      const limitMB = limit / (1024 * 1024);
      return next(
        new ApiError(
          413,
          `File "${file.originalname}" exceeds the ${limitMB}MB limit for ` +
            `${isImage ? "images" : "PDFs"}.`
        )
      );
    }
  }

  next();
};

export { upload };
