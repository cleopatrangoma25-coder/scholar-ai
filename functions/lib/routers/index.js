"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const context_1 = require("../context");
const paper_1 = require("./paper");
const rag_1 = require("./rag");
const authors_1 = require("./authors");
const research_1 = require("./research");
const topics_1 = require("./topics");
exports.appRouter = (0, context_1.router)({
    health: context_1.publicProcedure.query(() => {
        return { status: "ok", timestamp: new Date().toISOString() };
    }),
    paper: paper_1.paperRouter,
    rag: rag_1.ragRouter,
    authors: authors_1.authorsRouter,
    research: research_1.researchRouter,
    topics: topics_1.topicsRouter,
});
