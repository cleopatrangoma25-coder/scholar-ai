"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ultraMinimal = void 0;
const https_1 = require("firebase-functions/v2/https");
exports.ultraMinimal = (0, https_1.onRequest)((req, res) => {
    res.json({
        status: "success",
        message: "Ultra minimal function works!",
        timestamp: new Date().toISOString()
    });
});
