"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minimal = void 0;
const https_1 = require("firebase-functions/v2/https");
exports.minimal = (0, https_1.onRequest)((req, res) => {
    res.json({
        message: "Minimal function working",
        timestamp: new Date().toISOString()
    });
});
