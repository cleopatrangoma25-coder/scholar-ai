import { z } from "zod";

// Paper schemas
export const getUploadUrlSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  contentType: z.string().min(1, "Content type is required"),
});

export const paperSchema = z.object({
  paperId: z.string(),
  ownerUid: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  storagePath: z.string(),
  status: z.enum(["processing", "completed", "failed"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// RAG query schemas
export const queryScopeSchema = z.enum(["private", "public", "all"]);

export const ragQuerySchema = z.object({
  query: z.string().min(1, "Query is required"),
  scope: queryScopeSchema,
});

export const sourceSchema = z.object({
  paperId: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  pageNumber: z.number().optional(),
  content: z.string(),
  score: z.number(),
});

export const ragResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(sourceSchema),
});

// User schemas
export const userSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Export types
export type GetUploadUrlInput = z.infer<typeof getUploadUrlSchema>;
export type Paper = z.infer<typeof paperSchema>;
export type QueryScope = z.infer<typeof queryScopeSchema>;
export type RagQueryInput = z.infer<typeof ragQuerySchema>;
export type Source = z.infer<typeof sourceSchema>;
export type RagResponse = z.infer<typeof ragResponseSchema>;
export type User = z.infer<typeof userSchema>; 