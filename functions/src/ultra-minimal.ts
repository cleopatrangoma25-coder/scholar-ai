import { onRequest } from "firebase-functions/v2/https";

export const ultraMinimal = onRequest((req, res) => {
  res.json({
    status: "success",
    message: "Ultra minimal function works!",
    timestamp: new Date().toISOString()
  });
}); 