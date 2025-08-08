"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorsRouter = void 0;
const context_1 = require("../context");
const firestore_1 = require("firebase-admin/firestore");
const zod_1 = require("zod");
exports.authorsRouter = (0, context_1.router)({
    /**
     * Get author profile with papers and statistics
     */
    getAuthorProfile: context_1.protectedProcedure
        .input(zod_1.z.object({
        authorName: zod_1.z.string(),
    }))
        .query(async ({ input, ctx }) => {
        try {
            const { authorName } = input;
            const userId = ctx.user.uid;
            const db = (0, firestore_1.getFirestore)();
            // Get all papers by this author for the user
            const papersQuery = db.collection("papers")
                .where("ownerUid", "==", userId)
                .where("authors", "array-contains", authorName)
                .orderBy("createdAt", "desc");
            const papersSnapshot = await papersQuery.get();
            const papers = papersSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    paperId: doc.id,
                    title: data.title || "Untitled",
                    authors: data.authors || [],
                    status: data.status || "unknown",
                    extractedTextLength: data.extractedTextLength || 0,
                    createdAt: data.createdAt?.toDate(),
                    updatedAt: data.updatedAt?.toDate(),
                };
            });
            // Calculate author statistics
            const totalPapers = papers.length;
            const completedPapers = papers.filter(p => p.status === "completed").length;
            const totalWords = papers.reduce((sum, p) => sum + (p.extractedTextLength || 0), 0);
            const avgWordsPerPaper = totalPapers > 0 ? Math.round(totalWords / totalPapers) : 0;
            // Get co-authors
            const coAuthors = new Set();
            papers.forEach(paper => {
                paper.authors?.forEach((author) => {
                    if (author !== authorName) {
                        coAuthors.add(author);
                    }
                });
            });
            // Get recent activity
            const recentPapers = papers.slice(0, 5);
            return {
                authorName,
                statistics: {
                    totalPapers,
                    completedPapers,
                    totalWords,
                    avgWordsPerPaper,
                    coAuthorCount: coAuthors.size,
                },
                papers: recentPapers,
                coAuthors: Array.from(coAuthors),
                recentActivity: recentPapers.map(p => ({
                    paperId: p.paperId,
                    title: p.title,
                    status: p.status,
                    createdAt: p.createdAt,
                })),
            };
        }
        catch (error) {
            console.error("Error getting author profile:", error);
            throw new Error("Failed to get author profile");
        }
    }),
    /**
     * Get all authors for a user
     */
    getUserAuthors: context_1.protectedProcedure
        .query(async ({ ctx }) => {
        try {
            const userId = ctx.user.uid;
            const db = (0, firestore_1.getFirestore)();
            // Get all papers for the user
            const papersQuery = db.collection("papers")
                .where("ownerUid", "==", userId)
                .where("status", "==", "completed");
            const papersSnapshot = await papersQuery.get();
            const papers = papersSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    paperId: doc.id,
                    title: data.title || "Untitled",
                    authors: data.authors || [],
                    status: data.status || "unknown",
                    extractedTextLength: data.extractedTextLength || 0,
                    createdAt: data.createdAt?.toDate(),
                    updatedAt: data.updatedAt?.toDate(),
                };
            });
            // Extract all authors
            const authorMap = new Map();
            papers.forEach(paper => {
                paper.authors?.forEach((author) => {
                    if (!authorMap.has(author)) {
                        authorMap.set(author, { count: 0, papers: [] });
                    }
                    const authorData = authorMap.get(author);
                    authorData.count++;
                    authorData.papers.push(paper.paperId);
                });
            });
            // Convert to array and sort by paper count
            const authors = Array.from(authorMap.entries())
                .map(([name, data]) => ({
                name,
                paperCount: data.count,
                papers: data.papers,
            }))
                .sort((a, b) => b.paperCount - a.paperCount);
            return authors;
        }
        catch (error) {
            console.error("Error getting user authors:", error);
            throw new Error("Failed to get user authors");
        }
    }),
    /**
     * Search authors by name
     */
    searchAuthors: context_1.protectedProcedure
        .input(zod_1.z.object({
        query: zod_1.z.string().min(1),
        limit: zod_1.z.number().min(1).max(50).optional().default(10),
    }))
        .query(async ({ input, ctx }) => {
        try {
            const { query, limit } = input;
            const userId = ctx.user.uid;
            const db = (0, firestore_1.getFirestore)();
            // Get all papers for the user
            const papersQuery = db.collection("papers")
                .where("ownerUid", "==", userId)
                .where("status", "==", "completed");
            const papersSnapshot = await papersQuery.get();
            const papers = papersSnapshot.docs.map(doc => doc.data());
            // Extract authors matching the query
            const queryLower = query.toLowerCase();
            const authorMap = new Map();
            papers.forEach(paper => {
                paper.authors?.forEach((author) => {
                    if (author.toLowerCase().includes(queryLower)) {
                        if (!authorMap.has(author)) {
                            authorMap.set(author, { count: 0, papers: [] });
                        }
                        const authorData = authorMap.get(author);
                        authorData.count++;
                        authorData.papers.push(paper.paperId);
                    }
                });
            });
            // Convert to array and sort by relevance
            const authors = Array.from(authorMap.entries())
                .map(([name, data]) => ({
                name,
                paperCount: data.count,
                papers: data.papers,
                relevance: name.toLowerCase().startsWith(queryLower) ? 2 : 1, // Boost exact matches
            }))
                .sort((a, b) => {
                // Sort by relevance first, then by paper count
                if (a.relevance !== b.relevance) {
                    return b.relevance - a.relevance;
                }
                return b.paperCount - a.paperCount;
            })
                .slice(0, limit)
                .map(({ relevance, ...author }) => author); // Remove relevance score from response
            return authors;
        }
        catch (error) {
            console.error("Error searching authors:", error);
            throw new Error("Failed to search authors");
        }
    }),
});
