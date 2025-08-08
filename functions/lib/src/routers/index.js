"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const context_1 = require("../context");
const paper_1 = require("./paper");
const rag_1 = require("./rag");
exports.appRouter = (0, context_1.router)({
    paper: paper_1.paperRouter,
    rag: rag_1.ragRouter,
});
