import { z } from "zod";

/**
 * Creates a type-safe error object for tRPC
 */
export function createTRPCError(
  code: "UNAUTHORIZED" | "NOT_FOUND" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR",
  message: string
) {
  return {
    code,
    message,
  };
}

/**
 * Validates environment variables using Zod
 */
export function validateEnv<T extends z.ZodTypeAny>(
  schema: T,
  env: Record<string, string | undefined>
): z.infer<T> {
  try {
    return schema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => err.path.join(".")).join(", ");
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

/**
 * Generates a unique ID for papers
 */
export function generatePaperId(): string {
  return `paper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formats authors array into a readable string
 */
export function formatAuthors(authors: string[]): string {
  if (authors.length === 0) return "Unknown";
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
  return `${authors.slice(0, -1).join(", ")}, and ${authors[authors.length - 1]}`;
} 