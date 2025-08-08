import { router, protectedProcedure } from "../context";
import { getFirestore } from "firebase-admin/firestore";
import { z } from "zod";

export const topicsRouter = router({
  /**
   * Get topic details and definition
   */
  getTopicDetails: protectedProcedure
    .input(z.object({
      topic: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const { topic } = input;
        const userId = ctx.user!.uid;
        
        const db = getFirestore();
        
        // Get topic definition from Firestore (pre-populated)
        const topicRef = db.collection("topics").doc(topic.toLowerCase());
        const topicDoc = await topicRef.get();
        
        let topicDefinition = null;
        if (topicDoc.exists) {
          topicDefinition = topicDoc.data();
        }
        
        // Get papers related to this topic
        const papersQuery = db.collection("papers")
          .where("ownerUid", "==", userId)
          .where("status", "==", "completed");
        
        const papersSnapshot = await papersQuery.get();
        const papers = papersSnapshot.docs.map(doc => doc.data());
        
        // Find papers that mention this topic
        const topicLower = topic.toLowerCase();
        const relatedPapers = papers.filter(paper => {
          const title = paper.title?.toLowerCase() || "";
          const authors = paper.authors?.join(" ").toLowerCase() || "";
          return title.includes(topicLower) || authors.includes(topicLower);
        });
        
        // Get topic frequency in user's papers
        const topicFrequency = relatedPapers.length;
        
        // Get co-occurring topics
        const coOccurringTopics = new Map<string, number>();
        relatedPapers.forEach(paper => {
          const title = paper.title || "";
          const words = title.toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .filter((word: string) => word.length > 3 && word !== topicLower);
          
          words.forEach((word: string) => {
            coOccurringTopics.set(word, (coOccurringTopics.get(word) || 0) + 1);
          });
        });
        
        const topCoOccurring = Array.from(coOccurringTopics.entries())
          .map(([word, count]) => ({ topic: word, frequency: count }))
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 5);
        
        return {
          topic,
          definition: topicDefinition,
          frequency: topicFrequency,
          relatedPapers: relatedPapers.slice(0, 10).map(p => ({
            paperId: p.paperId,
            title: p.title,
            authors: p.authors,
            createdAt: p.createdAt?.toDate(),
          })),
          coOccurringTopics: topCoOccurring,
        };
      } catch (error) {
        console.error("Error getting topic details:", error);
        throw new Error("Failed to get topic details");
      }
    }),

  /**
   * Search topics by keyword
   */
  searchTopics: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
      limit: z.number().min(1).max(50).optional().default(10),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const { query, limit } = input;
        const userId = ctx.user!.uid;
        
        const db = getFirestore();
        
        // Get user's papers
        const papersQuery = db.collection("papers")
          .where("ownerUid", "==", userId)
          .where("status", "==", "completed");
        
        const papersSnapshot = await papersQuery.get();
        const papers = papersSnapshot.docs.map(doc => doc.data());
        
        // Extract topics from paper titles
        const topicMap = new Map<string, { count: number; papers: string[] }>();
        const queryLower = query.toLowerCase();
        
        papers.forEach(paper => {
          const title = paper.title || "";
          const words = title.toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .filter((word: string) => word.length > 3 && word.includes(queryLower));
          
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
        
        // Convert to array and sort by relevance
        const topics = Array.from(topicMap.entries())
          .map(([topic, data]) => ({
            topic,
            frequency: data.count,
            paperCount: data.papers.length,
            relevance: topic.toLowerCase().startsWith(queryLower) ? 2 : 1,
          }))
          .sort((a, b) => {
            if (a.relevance !== b.relevance) {
              return b.relevance - a.relevance;
            }
            return b.frequency - a.frequency;
          })
          .slice(0, limit)
          .map(({ relevance, ...topic }) => topic);
        
        return topics;
      } catch (error) {
        console.error("Error searching topics:", error);
        throw new Error("Failed to search topics");
      }
    }),

  /**
   * Get popular topics for the user
   */
  getPopularTopics: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).optional().default(20),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const { limit } = input;
        const userId = ctx.user!.uid;
        
        const db = getFirestore();
        
        // Get user's completed papers
        const papersQuery = db.collection("papers")
          .where("ownerUid", "==", userId)
          .where("status", "==", "completed");
        
        const papersSnapshot = await papersQuery.get();
        const papers = papersSnapshot.docs.map(doc => doc.data());
        
        // Extract all topics from paper titles
        const topicMap = new Map<string, { count: number; papers: string[] }>();
        
        papers.forEach(paper => {
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
        const popularTopics = Array.from(topicMap.entries())
          .map(([topic, data]) => ({
            topic,
            frequency: data.count,
            paperCount: data.papers.length,
            papers: data.papers,
          }))
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, limit);
        
        return popularTopics;
      } catch (error) {
        console.error("Error getting popular topics:", error);
        throw new Error("Failed to get popular topics");
      }
    }),

  /**
   * Get topic suggestions based on user's research
   */
  getTopicSuggestions: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const userId = ctx.user!.uid;
        
        const db = getFirestore();
        
        // Get user's recent papers
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const papersQuery = db.collection("papers")
          .where("ownerUid", "==", userId)
          .where("status", "==", "completed")
          .where("createdAt", ">=", thirtyDaysAgo)
          .orderBy("createdAt", "desc");
        
        const papersSnapshot = await papersQuery.get();
        const papers = papersSnapshot.docs.map(doc => doc.data());
        
        // Extract emerging topics
        const topicMap = new Map<string, { count: number; papers: string[] }>();
        
        papers.forEach(paper => {
          const title = paper.title || "";
          const words = title.toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .filter((word: string) => word.length > 3);
          
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
        
        // Get emerging topics (appearing in multiple recent papers)
        const emergingTopics = Array.from(topicMap.entries())
          .filter(([_, data]) => data.papers.length >= 2) // At least 2 papers
          .map(([topic, data]) => ({
            topic,
            frequency: data.count,
            paperCount: data.papers.length,
            papers: data.papers,
          }))
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 10);
        
        return {
          emergingTopics,
          totalTopics: topicMap.size,
          analyzedPapers: papers.length,
        };
      } catch (error) {
        console.error("Error getting topic suggestions:", error);
        throw new Error("Failed to get topic suggestions");
      }
    }),
}); 