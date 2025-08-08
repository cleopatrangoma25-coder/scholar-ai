import { router, publicProcedure } from "../context";
import { paperRouter } from "./paper";
import { ragRouter } from "./rag";
import { authorsRouter } from "./authors";
import { researchRouter } from "./research";
import { topicsRouter } from "./topics";

export const appRouter = router({
  health: publicProcedure.query(() => {
    return { status: "ok", timestamp: new Date().toISOString() };
  }),
  paper: paperRouter,
  rag: ragRouter,
  authors: authorsRouter,
  research: researchRouter,
  topics: topicsRouter,
});

export type AppRouter = typeof appRouter; 