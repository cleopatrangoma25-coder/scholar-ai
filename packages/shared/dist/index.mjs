// src/schemas.ts
import { z } from "zod";
var getUploadUrlSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  contentType: z.string().min(1, "Content type is required")
});
var paperSchema = z.object({
  paperId: z.string(),
  ownerUid: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  storagePath: z.string(),
  status: z.enum(["processing", "completed", "failed"]),
  createdAt: z.date(),
  updatedAt: z.date()
});
var queryScopeSchema = z.enum(["private", "public", "all"]);
var ragQuerySchema = z.object({
  query: z.string().min(1, "Query is required"),
  scope: queryScopeSchema
});
var sourceSchema = z.object({
  paperId: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  pageNumber: z.number().optional(),
  content: z.string(),
  score: z.number()
});
var ragResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(sourceSchema)
});
var userSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// src/utils.ts
import { z as z2 } from "zod";
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
    if (error instanceof z2.ZodError) {
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
export {
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
};
//# sourceMappingURL=index.mjs.map