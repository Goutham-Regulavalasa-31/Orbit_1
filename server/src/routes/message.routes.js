import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  getConversations,
  getUnreadMessagesCount,
  getMessages,
  markMessagesRead,
  sendMessage,
} from "../controllers/message.controller.js";

const router = Router();

// All message routes require authentication
router.use(verifyJWT);

// Static paths MUST be registered before "/:userId" — otherwise Express
// would match "conversations"/"unread-count" as a literal userId param.
router.get("/conversations", getConversations);
router.get("/unread-count", getUnreadMessagesCount);
router.get("/:userId", getMessages);
router.patch("/:userId/read", markMessagesRead);
router.post("/:userId", sendMessage);

export default router;
