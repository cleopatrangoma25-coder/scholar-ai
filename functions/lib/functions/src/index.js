"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
// Initialize Firebase Admin if not already initialized
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
// Set up Firebase Auth
const auth = (0, auth_1.getAuth)();
/**
 * Basic HTTP handler for Firebase Functions
 */
const handler = (0, https_1.onRequest)(async (req, res) => {
    // Enhanced CORS configuration
    const allowedOrigins = [
        'https://scholar-ai-1-stage.web.app',
        'https://scholar-ai-1-stage.firebaseapp.com',
        'https://scholar-ai-1-prod.web.app',
        'https://scholar-ai-1-prod.firebaseapp.com',
        'http://localhost:5173',
        'http://localhost:3000'
    ];
    const origin = req.headers.origin;
    const isAllowedOrigin = allowedOrigins.includes(origin || '');
    // Set CORS headers
    if (isAllowedOrigin) {
        res.set("Access-Control-Allow-Origin", origin);
    }
    else {
        res.set("Access-Control-Allow-Origin", "*");
    }
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.set("Access-Control-Allow-Credentials", "true");
    res.set("Access-Control-Max-Age", "86400"); // 24 hours
    // Handle preflight requests
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    try {
        // Basic health check endpoint
        if (req.path === "/health") {
            res.status(200).json({
                status: "healthy",
                timestamp: new Date().toISOString(),
                environment: "production"
            });
            return;
        }
        // Default response
        res.status(200).json({
            message: "Scholar AI API is running",
            timestamp: new Date().toISOString(),
            environment: "production"
        });
    }
    catch (error) {
        console.error("Function error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.api = handler;
