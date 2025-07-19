import rateLimit from "express-rate-limit";

export const rateLimiterConfig = rateLimit({
  limit: 50,
  windowMs: 15 * 60 * 1000, // 15 minutes
  standardHeaders: "draft-7",
});
