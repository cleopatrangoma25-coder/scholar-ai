import { router, protectedProcedure } from "../context";
import { getFirestore } from "firebase-admin/firestore";
import { z } from "zod";

export const researchRouter = router({
  /**
   * Get trending research topics based on user's papers
   */
  getTrendingTopics: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const userId = ctx.user!.uid;
        
        const db = getFirestore();
        
        // Get user's completed papers from the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const papersQuery = db.collection("papers")
          .where("ownerUid", "==", userId)
          .where("status", "==", "completed")
          .where("createdAt", ">=", thirtyDaysAgo)
          .orderBy("createdAt", "desc");
        
        const papersSnapshot = await papersQuery.get();
        const papers = papersSnapshot.docs.map(doc => doc.data());
        
        // Extract topics from paper titles and content
        const topicMap = new Map<string, { count: number; papers: string[] }>();
        
        papers.forEach(paper => {
          // Simple topic extraction from title (in production, use NLP)
          const title = paper.title || "";
          const words = title.toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .filter((word: string) => word.length > 3); // Filter out short words
          
          words.forEach((word: string) => {
            if (!topicMap.has(word)) {
              topicMap.set(word, { count: 0, papers: [] });
            }
            const topicData = topicMap.get(word)!;
            topicData.count++;
            if (!topicData.papers.includes(paper.paperId)) {
              topicData.papers.push(paper.paperId);
            }
          });
        });
        
        // Convert to array and sort by frequency
        const trendingTopics = Array.from(topicMap.entries())
          .map(([topic, data]) => ({
            topic,
            frequency: data.count,
            paperCount: data.papers.length,
            papers: data.papers,
          }))
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 10);
        
        return trendingTopics;
      } catch (error) {
        console.error("Error getting trending topics:", error);
        throw new Error("Failed to get trending topics");
      }
    }),

  /**
   * Get recent research activity for the user
   */
  getRecentActivity: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).optional().default(7),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const { days } = input;
        const userId = ctx.user!.uid;
        
        const db = getFirestore();
        
        // Get papers from the specified time period
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const papersQuery = db.collection("papers")
          .where("ownerUid", "==", userId)
          .where("createdAt", ">=", startDate)
          .orderBy("createdAt", "desc");
        
        const papersSnapshot = await papersQuery.get();
        const papers = papersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));
        
        // Group by date
        const activityByDate = new Map<string, any[]>();
        
        papers.forEach(paper => {
          const dateKey = paper.createdAt.toISOString().split('T')[0];
          if (!activityByDate.has(dateKey)) {
            activityByDate.set(dateKey, []);
          }
          activityByDate.get(dateKey)!.push(paper);
        });
        
        // Convert to array and sort by date
        const recentActivity = Array.from(activityByDate.entries())
          .map(([date, papers]) => ({
            date,
            papers,
            count: papers.length,
          }))
          .sort((a, b) => b.date.localeCompare(a.date));
        
        return recentActivity;
      } catch (error) {
        console.error("Error getting recent activity:", error);
        throw new Error("Failed to get recent activity");
      }
    }),

  /**
   * Get research statistics for the user
   */
  getResearchStats: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const userId = ctx.user!.uid;
        
        const db = getFirestore();
        
        // Get all user's papers
        const papersQuery = db.collection("papers")
          .where("ownerUid", "==", userId);
        
        const papersSnapshot = await papersQuery.get();
        const papers = papersSnapshot.docs.map(doc => doc.data());
        
        // Calculate statistics
        const totalPapers = papers.length;
        const completedPapers = papers.filter(p => p.status === "completed").length;
        const processingPapers = papers.filter(p => p.status === "processing").length;
        const errorPapers = papers.filter(p => p.status === "error").length;
        
        const totalWords = papers.reduce((sum, p) => sum + (p.extractedTextLength || 0), 0);
        const totalChunks = papers.reduce((sum, p) => sum + (p.textChunks || 0), 0);
        
        // Get unique authors
        const authors = new Set<string>();
        papers.forEach(paper => {
          paper.authors?.forEach((author: string) => authors.add(author));
        });
        
        // Get papers by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const recentPapers = papers.filter(p => 
          p.createdAt && p.createdAt.toDate() >= sixMonthsAgo
        );
        
        const papersByMonth = new Map<string, number>();
        recentPapers.forEach(paper => {
          const monthKey = paper.createdAt.toDate().toISOString().slice(0, 7); // YYYY-MM
          papersByMonth.set(monthKey, (papersByMonth.get(monthKey) || 0) + 1);
        });
        
        return {
          overview: {
            totalPapers,
            completedPapers,
            processingPapers,
            errorPapers,
            completionRate: totalPapers > 0 ? (completedPapers / totalPapers) * 100 : 0,
          },
          content: {
            totalWords,
            totalChunks,
            avgWordsPerPaper: totalPapers > 0 ? Math.round(totalWords / totalPapers) : 0,
            avgChunksPerPaper: totalPapers > 0 ? Math.round(totalChunks / totalPapers) : 0,
          },
          authors: {
            uniqueAuthors: authors.size,
            authorList: Array.from(authors),
          },
          trends: {
            papersByMonth: Array.from(papersByMonth.entries())
              .map(([month, count]) => ({ month, count }))
              .sort((a, b) => a.month.localeCompare(b.month)),
          },
        };
      } catch (error) {
        console.error("Error getting research stats:", error);
        throw new Error("Failed to get research stats");
      }
    }),
}); 