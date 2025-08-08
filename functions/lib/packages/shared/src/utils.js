"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTRPCError = createTRPCError;
exports.validateEnv = validateEnv;
exports.generatePaperId = generatePaperId;
exports.formatAuthors = formatAuthors;
const zod_1 = require("zod");
/**
 * Creates a type-safe error object for tRPC
 */
function createTRPCError(code, message) {
    return {
        code,
        message,
    };
}
/**
 * Validates environment variables using Zod
 */
function validateEnv(schema, env) {
    try {
        return schema.parse(env);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const missingVars = error.errors.map((err) => err.path.join(".")).join(", ");
            throw new Error(`Missing or invalid environment variables: ${missingVars}`);
        }
        throw error;
    }
}
/**
 * Generates a unique ID for papers
 */
function generatePaperId() {
    return `paper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * Formats authors array into a readable string
 */
function formatAuthors(authors) {
    if (authors.length === 0)
        return "Unknown";
    if (authors.length === 1)
        return authors[0];
    if (authors.length === 2)
        return `${authors[0]} and ${authors[1]}`;
    return `${authors.slice(0, -1).join(", ")}, and ${authors[authors.length - 1]}`;
}
