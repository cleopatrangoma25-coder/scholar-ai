import { onRequest } from "firebase-functions/v2/https";

// Simple test function
export const test = onRequest({
  cors: true,
  invoker: "public"
}, (req, res) => {
  res.json({
    message: "Test function is working!",
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    headers: req.headers
  });
}); 