"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simpleTest = void 0;
const https_1 = require("firebase-functions/v2/https");
exports.simpleTest = (0, https_1.onRequest)((req, res) => {
    // Set CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    // Handle preflight
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    res.json({
        message: "Simple test function working",
        timestamp: new Date().toISOString(),
        status: "success"
    });
});
