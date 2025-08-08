"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectedProcedure = exports.publicProcedure = exports.router = void 0;
exports.setFirebaseAdmin = setFirebaseAdmin;
exports.createContext = createContext;
const server_1 = require("@trpc/server");
const auth_1 = require("firebase-admin/auth");
// Initialize Firebase Admin if not already initialized
let firebaseAdmin;
try {
    firebaseAdmin = (0, auth_1.getAuth)();
}
catch (error) {
    // Firebase Admin not initialized yet, will be initialized in main function
    firebaseAdmin = null;
}
function setFirebaseAdmin(admin) {
    firebaseAdmin = admin;
}
/**
 * Create context for each request
 */
async function createContext(req) {
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
    }
    catch (error) {
        console.error("Error creating context:", error);
        return {};
    }
}
/**
 * Initialize tRPC
 */
const t = server_1.initTRPC.context().create();
/**
 * Middleware to require authentication
 */
const requireAuth = t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
        throw new server_1.TRPCError({
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
exports.router = t.router;
exports.publicProcedure = t.procedure;
exports.protectedProcedure = t.procedure.use(requireAuth);
