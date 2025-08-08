import { initTRPC, TRPCError } from "@trpc/server";
import { getAuth, Auth } from "firebase-admin/auth";

// Initialize Firebase Admin if not already initialized
let firebaseAdmin: Auth;
try {
  firebaseAdmin = getAuth();
} catch (error) {
  // Firebase Admin not initialized yet, will be initialized in main function
  firebaseAdmin = null as any;
}

export function setFirebaseAdmin(admin: Auth) {
  firebaseAdmin = admin;
}

/**
 * Context for tRPC procedures
 */
export interface Context {
  user?: {
    uid: string;
    email: string;
    name?: string;
  };
}

/**
 * Create context for each request
 */
export async function createContext(req: any): Promise<Context> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return {};
    }

    const token = authHeader.substring(7);
    const decodedToken = await firebaseAdmin.verifyIdToken(token);
    
    return {
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email || "",
        name: decodedToken.name,
      },
    };
  } catch (error) {
    console.error("Error creating context:", error);
    return {};
  }
}

/**
 * Initialize tRPC
 */
const t = initTRPC.context<Context>().create();

/**
 * Middleware to require authentication
 */
const requireAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * Export reusable router and procedure builders
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(requireAuth); 