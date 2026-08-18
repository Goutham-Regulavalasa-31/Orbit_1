import mongoose from "mongoose";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

let retryCount = 0;

/**
 * Establishes a MongoDB connection via Mongoose with:
 * - Exponential-friendly retry logic (up to MAX_RETRIES attempts)
 * - Named event listeners for visibility into connection state changes
 * - Graceful process exit on exhausted retries
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌  MONGODB_URI is not defined in environment variables.");
    process.exit(1);
  }

  // ── Connection lifecycle event listeners ──────────────────────────────
  mongoose.connection.on("connected", () => {
    console.log(`✅  MongoDB connected → ${mongoose.connection.host}`);
    retryCount = 0; // reset on successful connection
  });

  mongoose.connection.on("error", (err) => {
    console.error(`❌  MongoDB error: ${err.message}`);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️   MongoDB disconnected. Reconnect will be attempted.");
  });

  // ── Recursive retry function ──────────────────────────────────────────
  const attemptConnection = async () => {
    try {
      await mongoose.connect(uri, {
        dbName: "orbit",
      });
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        retryCount += 1;
        console.warn(
          `⚠️   Connection attempt ${retryCount}/${MAX_RETRIES} failed. ` +
          `Retrying in ${RETRY_DELAY_MS / 1000}s… (${error.message})`
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return attemptConnection();
      }

      console.error(
        `❌  Max MongoDB connection retries (${MAX_RETRIES}) reached. Shutting down.`
      );
      process.exit(1);
    }
  };

  await attemptConnection();
};

export default connectDB;
