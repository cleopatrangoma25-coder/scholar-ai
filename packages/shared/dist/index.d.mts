import { z } from 'zod';

declare const getUploadUrlSchema: z.ZodObject<{
    fileName: z.ZodString;
    contentType: z.ZodString;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    contentType: string;
}, {
    fileName: string;
    contentType: string;
}>;
declare const paperSchema: z.ZodObject<{
    paperId: z.ZodString;
    ownerUid: z.ZodString;
    title: z.ZodString;
    authors: z.ZodArray<z.ZodString, "many">;
    storagePath: z.ZodString;
    status: z.ZodEnum<["processing", "completed", "failed"]>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status: "processing" | "completed" | "failed";
    paperId: string;
    ownerUid: string;
    title: string;
    authors: string[];
    storagePath: string;
    createdAt: Date;
    updatedAt: Date;
}, {
    status: "processing" | "completed" | "failed";
    paperId: string;
    ownerUid: string;
    title: string;
    authors: string[];
    storagePath: string;
    createdAt: Date;
    updatedAt: Date;
}>;
declare const queryScopeSchema: z.ZodEnum<["private", "public", "all"]>;
declare const ragQuerySchema: z.ZodObject<{
    query: z.ZodString;
    scope: z.ZodEnum<["private", "public", "all"]>;
}, "strip", z.ZodTypeAny, {
    query: string;
    scope: "private" | "public" | "all";
}, {
    query: string;
    scope: "private" | "public" | "all";
}>;
declare const sourceSchema: z.ZodObject<{
    paperId: z.ZodString;
    title: z.ZodString;
    authors: z.ZodArray<z.ZodString, "many">;
    pageNumber: z.ZodOptional<z.ZodNumber>;
    content: z.ZodString;
    score: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    paperId: string;
    title: string;
    authors: string[];
    content: string;
    score: number;
    pageNumber?: number | undefined;
}, {
    paperId: string;
    title: string;
    authors: string[];
    content: string;
    score: number;
    pageNumber?: number | undefined;
}>;
declare const ragResponseSchema: z.ZodObject<{
    answer: z.ZodString;
    sources: z.ZodArray<z.ZodObject<{
        paperId: z.ZodString;
        title: z.ZodString;
        authors: z.ZodArray<z.ZodString, "many">;
        pageNumber: z.ZodOptional<z.ZodNumber>;
        content: z.ZodString;
        score: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        paperId: string;
        title: string;
        authors: string[];
        content: string;
        score: number;
        pageNumber?: number | undefined;
    }, {
        paperId: string;
        title: string;
        authors: string[];
        content: string;
        score: number;
        pageNumber?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    answer: string;
    sources: {
        paperId: string;
        title: string;
        authors: string[];
        content: string;
        score: number;
        pageNumber?: number | undefined;
    }[];
}, {
    answer: string;
    sources: {
        paperId: string;
        title: string;
        authors: string[];
        content: string;
        score: number;
        pageNumber?: number | undefined;
    }[];
}>;
declare const userSchema: z.ZodObject<{
    uid: z.ZodString;
    email: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    createdAt: Date;
    updatedAt: Date;
    uid: string;
    email: string;
    name?: string | undefined;
}, {
    createdAt: Date;
    updatedAt: Date;
    uid: string;
    email: string;
    name?: string | undefined;
}>;
type GetUploadUrlInput = z.infer<typeof getUploadUrlSchema>;
type Paper = z.infer<typeof paperSchema>;
type QueryScope = z.infer<typeof queryScopeSchema>;
type RagQueryInput = z.infer<typeof ragQuerySchema>;
type Source = z.infer<typeof sourceSchema>;
type RagResponse = z.infer<typeof ragResponseSchema>;
type User = z.infer<typeof userSchema>;

/**
 * Creates a type-safe error object for tRPC
 */
declare function createTRPCError(code: "UNAUTHORIZED" | "NOT_FOUND" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR", message: string): {
    code: "UNAUTHORIZED" | "NOT_FOUND" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR";
    message: string;
};
/**
 * Validates environment variables using Zod
 */
declare function validateEnv<T extends z.ZodTypeAny>(schema: T, env: Record<string, string | undefined>): z.infer<T>;
/**
 * Generates a unique ID for papers
 */
declare function generatePaperId(): string;
/**
 * Formats authors array into a readable string
 */
declare function formatAuthors(authors: string[]): string;

export { type GetUploadUrlInput, type Paper, type QueryScope, type RagQueryInput, type RagResponse, type Source, type User, createTRPCError, formatAuthors, generatePaperId, getUploadUrlSchema, paperSchema, queryScopeSchema, ragQuerySchema, ragResponseSchema, sourceSchema, userSchema, validateEnv };
