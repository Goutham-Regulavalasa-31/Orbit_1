import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";

/**
 * Socket.io singleton.
 *
 * Pattern: initIO() is called once in server.js after the HTTP server is
 * created. All other modules call getIO() to obtain the same instance.
 * This avoids circular imports that would arise from importing server.js
 * directly into controllers.
 */

/** @type {import("socket.io").Server | null} */
let io = null;

// ── Initialise (called once in server.js) ─────────────────────────────────────
export const initIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: true,
      methods: ["GET", "POST"],
    },
    // Prefer WebSocket; fall back to polling only when WS is unavailable
    transports: ["websocket", "polling"],
    // Ping every 25 s; disconnect if no pong within 60 s
    pingInterval: 25_000,
    pingTimeout: 60_000,
  });

  // ── Handshake auth middleware ─────────────────────────────────────────────
  // Runs before the "connection" event for every new socket.
  // Rejects the connection immediately if the JWT is missing or invalid.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("AUTH_MISSING: No token provided"));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      } catch (err) {
        const msg =
          err.name === "TokenExpiredError"
            ? "AUTH_EXPIRED: Access token has expired"
            : "AUTH_INVALID: Invalid access token";
        return next(new Error(msg));
      }

      // Attach the user to the socket so handlers can reference it
      const user = await User.findById(decoded._id).select(
        "_id name avatar role"
      );
      if (!user) {
        return next(new Error("AUTH_INVALID: User no longer exists"));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error("❌  Socket auth middleware error:", err.message);
      next(new Error("AUTH_ERROR: Internal authentication error"));
    }
  });

  // ── Connection handler ────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    console.log(
      `🔌  Socket connected: ${socket.id} | user: ${socket.user.name} (${socket.user._id})`
    );

    // ── Auto-join the caller's private notification room ─────────────────
    // Every authenticated socket joins user:<id> so notification.service
    // can push "new_notification" straight to this specific person.
    const userRoom = `user:${socket.user._id}`;
    socket.join(userRoom);
    console.log(`   ↳ joined private room: ${userRoom}`);

    // ── join_post: subscribe to a post's real-time room ─────────────────
    socket.on("join_post", ({ postId } = {}) => {
      if (!postId || typeof postId !== "string") return;

      const room = `post:${postId}`;
      socket.join(room);
      console.log(`   ↳ joined room: ${room}`);
    });

    // ── leave_post: unsubscribe from a post's room ───────────────────────
    socket.on("leave_post", ({ postId } = {}) => {
      if (!postId || typeof postId !== "string") return;

      const room = `post:${postId}`;
      socket.leave(room);
      console.log(`   ↳ left room:   ${room}`);
    });

    // ── join_event: subscribe to an event's real-time room ───────────────
    // Joined by every rendered EventCard (grid) and the EventDetailPage,
    // same fan-out pattern as join_post — so an RSVP toggle reaches
    // whoever currently has that event on screen, wherever it's rendered.
    socket.on("join_event", ({ eventId } = {}) => {
      if (!eventId || typeof eventId !== "string") return;

      const room = `event:${eventId}`;
      socket.join(room);
      console.log(`   ↳ joined room: ${room}`);
    });

    // ── leave_event: unsubscribe from an event's room ────────────────────
    socket.on("leave_event", ({ eventId } = {}) => {
      if (!eventId || typeof eventId !== "string") return;

      const room = `event:${eventId}`;
      socket.leave(room);
      console.log(`   ↳ left room:   ${room}`);
    });

    // ── disconnect: cleanup (Socket.io handles room removal automatically) ─
    socket.on("disconnect", (reason) => {
      console.log(
        `🔌  Socket disconnected: ${socket.id} | reason: ${reason}`
      );
    });
  });

  console.log("✅  Socket.io initialized");
  return io;
};

// ── Getter (used by controllers / services) ───────────────────────────────────
export const getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.io not initialized. Call initIO(httpServer) first."
    );
  }
  return io;
};

/**
 * Convenience: broadcast an event to every socket in a post's room.
 *
 * @param {string} postId
 * @param {string} event  - e.g. "new_comment", "post_liked"
 * @param {object} payload
 */
export const emitToPost = (postId, event, payload) => {
  getIO().to(`post:${postId}`).emit(event, payload);
};

/**
 * Convenience: broadcast an event to every socket in an event's room.
 *
 * @param {string} eventId
 * @param {string} event  - e.g. "event_rsvp_updated"
 * @param {object} payload
 */
export const emitToEvent = (eventId, event, payload) => {
  getIO().to(`event:${eventId}`).emit(event, payload);
};

/**
 * Convenience: push an event to a single user's private room.
 * Used by notification.service to deliver "new_notification" in real time.
 *
 * @param {string} userId
 * @param {string} event   - e.g. "new_notification"
 * @param {object} payload
 */
export const emitToUser = (userId, event, payload) => {
  getIO().to(`user:${userId}`).emit(event, payload);
};
