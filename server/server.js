import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

const PORT = process.env.PORT ?? 5000;

// ── Boot sequence: connect DB first, then start HTTP server ──────────────
connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(
        `🚀  Orbit API server running → http://localhost:${PORT}`
      );
      console.log(`📋  Environment: ${process.env.NODE_ENV ?? "development"}`);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      console.log(`\n⚠️  Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log("✅  HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  })
  .catch((err) => {
    console.error("❌  Failed to start server:", err.message);
    process.exit(1);
  });

// ── Process-level safety nets ─────────────────────────────────────────────
process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️  Unhandled Rejection at:", promise, "| reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("⚠️  Uncaught Exception:", err.message);
  process.exit(1);
});
