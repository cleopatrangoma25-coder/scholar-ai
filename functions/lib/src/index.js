"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onFileUploaded = exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const fetch_1 = require("@trpc/server/adapters/fetch");
const routers_1 = require("./routers");
const context_1 = require("./context");
// Initialize Firebase Admin if not already initialized
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
// Set up Firebase Auth for tRPC context
const auth = (0, auth_1.getAuth)();
(0, context_1.setFirebaseAdmin)(auth);
/**
 * tRPC HTTP handler for Firebase Functions
 */
const handler = (0, https_1.onRequest)(async (req, res) => {
    // Handle CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    try {
        // Convert Firebase request to proper Request object
        const url = new URL(req.url, `http://${req.headers.host}`);
        const request = new Request(url.toString(), {
            method: req.method,
            headers: req.headers,
            body: req.body ? JSON.stringify(req.body) : undefined,
        });
        const response = await (0, fetch_1.fetchRequestHandler)({
            endpoint: "/api/trpc",
            req: request,
            router: routers_1.appRouter,
            createContext: () => (0, context_1.createContext)(req),
            onError: ({ error }) => {
                console.error("tRPC error:", error);
            },
        });
        // Copy response headers
        Object.entries(response.headers).forEach(([key, value]) => {
            res.set(key, value);
        });
        // Send response
        res.status(response.status).send(await response.text());
    }
    catch (error) {
        console.error("Function error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.api = handler;
// Import and export the storage trigger
const storage_1 = require("./triggers/storage");
Object.defineProperty(exports, "onFileUploaded", { enumerable: true, get: function () { return storage_1.onFileUploaded; } });
