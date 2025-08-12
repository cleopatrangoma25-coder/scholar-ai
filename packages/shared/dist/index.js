"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  createTRPCError: () => createTRPCError,
  formatAuthors: () => formatAuthors,
  generatePaperId: () => generatePaperId,
  getUploadUrlSchema: () => getUploadUrlSchema,
  paperSchema: () => paperSchema,
  queryScopeSchema: () => queryScopeSchema,
  ragQuerySchema: () => ragQuerySchema,
  ragResponseSchema: () => ragResponseSchema,
  sourceSchema: () => sourceSchema,
  userSchema: () => userSchema,
  validateEnv: () => validateEnv
});
module.exports = __toCommonJS(index_exports);

// src/schemas.ts
var import_zod = require("zod");
var getUploadUrlSchema = import_zod.z.object({
  fileName: import_zod.z.string().min(1, "File name is required"),
  contentType: import_zod.z.string().min(1, "Content type is required")
});
var paperSchema = import_zod.z.object({
  paperId: import_zod.z.string(),
  ownerUid: import_zod.z.string(),
  title: import_zod.z.string(),
  authors: import_zod.z.array(import_zod.z.string()),
  storagePath: import_zod.z.string(),
  status: import_zod.z.enum(["processing", "completed", "failed"]),
  createdAt: import_zod.z.date(),
  updatedAt: import_zod.z.date()
});
var queryScopeSchema = import_zod.z.enum(["private", "public", "all"]);
var ragQuerySchema = import_zod.z.object({
  query: import_zod.z.string().min(1, "Query is required"),
  scope: queryScopeSchema
});
var sourceSchema = import_zod.z.object({
  paperId: import_zod.z.string(),
  title: import_zod.z.string(),
  authors: import_zod.z.array(import_zod.z.string()),
  pageNumber: import_zod.z.number().optional(),
  content: import_zod.z.string(),
  score: import_zod.z.number()
});
var ragResponseSchema = import_zod.z.object({
  answer: import_zod.z.string(),
  sources: import_zod.z.array(sourceSchema)
});
var userSchema = import_zod.z.object({
  uid: import_zod.z.string(),
  email: import_zod.z.string().email(),
  name: import_zod.z.string().optional(),
  createdAt: import_zod.z.date(),
  updatedAt: import_zod.z.date()
});

// src/utils.ts
var import_zod2 = require("zod");
function createTRPCError(code, message) {
  return {
    code,
    message
  };
}
function validateEnv(schema, env) {
  try {
    return schema.parse(env);
  } catch (error) {
    if (error instanceof import_zod2.z.ZodError) {
      const missingVars = error.errors.map((err) => err.path.join(".")).join(", ");
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}
function generatePaperId() {
  return `paper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function formatAuthors(authors) {
  if (authors.length === 0) return "Unknown";
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
  return `${authors.slice(0, -1).join(", ")}, and ${authors[authors.length - 1]}`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createTRPCError,
  formatAuthors,
  generatePaperId,
  getUploadUrlSchema,
  paperSchema,
  queryScopeSchema,
  ragQuerySchema,
  ragResponseSchema,
  sourceSchema,
  userSchema,
  validateEnv
});
//# sourceMappingURL=index.js.map