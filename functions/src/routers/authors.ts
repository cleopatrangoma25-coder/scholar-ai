import { router, protectedProcedure } from "../context";
import { getFirestore } from "firebase-admin/firestore";
import { z } from "zod";

// Define paper type
interface PaperData {
  paperId: string;
  title: string;
  authors: string[];
  status: string;
  extractedTextLength?: number;
  createdAt: any;
  updatedAt: any;
}

export const authorsRouter = router({
  /**
   * Get author profile with papers and statistics
   */
  getAuthorProfile: protectedProcedure
    .input(z.object({
      authorName: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const { authorName } = input;
        const userId = ctx.user!.uid;
        
        const db = getFirestore();
        
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
          } as PaperData;
        });
        
        // Calculate author statistics
        const totalPapers = papers.length;
        const completedPapers = papers.filter(p => p.status === "completed").length;
        const totalWords = papers.reduce((sum, p) => sum + (p.extractedTextLength || 0), 0);
        const avgWordsPerPaper = totalPapers > 0 ? Math.round(totalWords / totalPapers) : 0;
        
        // Get co-authors
        const coAuthors = new Set<string>();
        papers.forEach(paper => {
          paper.authors?.forEach((author: string) => {
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
      } catch (error) {
        console.error("Error getting author profile:", error);
        throw new Error("Failed to get author profile");
      }
    }),

  /**
   * Get all authors for a user
   */
  getUserAuthors: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const userId = ctx.user!.uid;
        
        const db = getFirestore();
        
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
          } as PaperData;
        });
        
        // Extract all authors
        const authorMap = new Map<string, { count: number; papers: string[] }>();
        
        papers.forEach(paper => {
          paper.authors?.forEach((author: string) => {
            if (!authorMap.has(author)) {
              authorMap.set(author, { count: 0, papers: [] });
            }
            const authorData = authorMap.get(author)!;
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
      } catch (error) {
        console.error("Error getting user authors:", error);
        throw new Error("Failed to get user authors");
      }
    }),

  /**
   * Search authors by name
   */
  searchAuthors: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
      limit: z.number().min(1).max(50).optional().default(10),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const { query, limit } = input;
        const userId = ctx.user!.uid;
        
        const db = getFirestore();
        
        // Get all papers for the user
        const papersQuery = db.collection("papers")
          .where("ownerUid", "==", userId)
          .where("status", "==", "completed");
        
        const papersSnapshot = await papersQuery.get();
        const papers = papersSnapshot.docs.map(doc => doc.data());
        
        // Extract authors matching the query
        const queryLower = query.toLowerCase();
        const authorMap = new Map<string, { count: number; papers: string[] }>();
        
        papers.forEach(paper => {
          paper.authors?.forEach((author: string) => {
            if (author.toLowerCase().includes(queryLower)) {
              if (!authorMap.has(author)) {
                authorMap.set(author, { count: 0, papers: [] });
              }
              const authorData = authorMap.get(author)!;
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
      } catch (error) {
        console.error("Error searching authors:", error);
        throw new Error("Failed to search authors");
      }
    }),
}); 