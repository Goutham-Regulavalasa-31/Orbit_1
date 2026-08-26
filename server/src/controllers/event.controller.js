import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as eventService from "../services/event.service.js";

// ── Validation constants ──────────────────────────────────────────────────────
const MAX_EVENTS_LIMIT = 20;

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/v1/events
 * Protected — requires valid access token.
 * Accepts multipart/form-data with an optional cover image.
 *
 * Body fields:
 *  - title       {string}  required, 3-100 chars
 *  - description {string}  required, 10-1000 chars
 *  - date        {string}  required, ISO date string, must be in the future
 *  - location    {string}  required, 3-150 chars
 * Files:
 *  - coverImage  {File}    optional, image only
 */
export const createEvent = asyncHandler(async (req, res) => {
  const { title, description, date, location } = req.body;

  if (!title || title.trim().length < 3) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Event title must be at least 3 characters",
      errors: [{ field: "title", message: "Too short" }],
      data: null,
    });
  }

  if (title.trim().length > 100) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Event title is too long",
      errors: [{ field: "title", message: "Cannot exceed 100 characters" }],
      data: null,
    });
  }

  if (!description || description.trim().length < 10) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Event description must be at least 10 characters",
      errors: [{ field: "description", message: "Too short" }],
      data: null,
    });
  }

  if (!location || location.trim().length < 3) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Event location must be at least 3 characters",
      errors: [{ field: "location", message: "Too short" }],
      data: null,
    });
  }

  if (!date) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Event date is required",
      errors: [{ field: "date", message: "Required" }],
      data: null,
    });
  }

  const event = await eventService.createEvent({
    creatorId: req.user._id.toString(),
    title: title.trim(),
    description: description.trim(),
    date,
    location: location.trim(),
    coverFile: req.file ?? null,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, event, "Event created successfully"));
});

/**
 * GET /api/v1/events
 * Protected — requires valid access token.
 * Returns paginated upcoming events, sorted soonest-first.
 *
 * Query params:
 *  - page  {number} default 1
 *  - limit {number} default 12, max 20
 */
export const getEvents = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(MAX_EVENTS_LIMIT, Math.max(1, parseInt(req.query.limit) || 12));

  const data = await eventService.getEvents({
    userId: req.user._id.toString(),
    page,
    limit,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Events fetched successfully"));
});

/**
 * GET /api/v1/events/:id
 * Protected — requires valid access token.
 */
export const getEventById = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById({
    eventId: req.params.id,
    userId: req.user._id.toString(),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, event, "Event fetched successfully"));
});

/**
 * POST /api/v1/events/:id/rsvp
 * Protected — requires valid access token.
 * Idempotent toggle: RSVPing to an RSVP'd event cancels it.
 */
export const toggleRSVP = asyncHandler(async (req, res) => {
  const result = await eventService.toggleRSVP({
    eventId: req.params.id,
    userId: req.user._id.toString(),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, result.attending ? "RSVP confirmed" : "RSVP cancelled"));
});
