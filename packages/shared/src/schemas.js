"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchema = exports.ragResponseSchema = exports.sourceSchema = exports.ragQuerySchema = exports.queryScopeSchema = exports.paperSchema = exports.getUploadUrlSchema = void 0;
const zod_1 = require("zod");
// Paper schemas
exports.getUploadUrlSchema = zod_1.z.object({
    fileName: zod_1.z.string().min(1, "File name is required"),
    contentType: zod_1.z.string().min(1, "Content type is required"),
});
exports.paperSchema = zod_1.z.object({
    paperId: zod_1.z.string(),
    ownerUid: zod_1.z.string(),
    title: zod_1.z.string(),
    authors: zod_1.z.array(zod_1.z.string()),
    storagePath: zod_1.z.string(),
    status: zod_1.z.enum(["processing", "completed", "failed"]),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
// RAG query schemas
exports.queryScopeSchema = zod_1.z.enum(["private", "public", "all"]);
exports.ragQuerySchema = zod_1.z.object({
    query: zod_1.z.string().min(1, "Query is required"),
    scope: exports.queryScopeSchema,
});
exports.sourceSchema = zod_1.z.object({
    paperId: zod_1.z.string(),
    title: zod_1.z.string(),
    authors: zod_1.z.array(zod_1.z.string()),
    pageNumber: zod_1.z.number().optional(),
    content: zod_1.z.string(),
    score: zod_1.z.number(),
});
exports.ragResponseSchema = zod_1.z.object({
    answer: zod_1.z.string(),
    sources: zod_1.z.array(exports.sourceSchema),
});
// User schemas
exports.userSchema = zod_1.z.object({
    uid: zod_1.z.string(),
    email: zod_1.z.string().email(),
    name: zod_1.z.string().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
