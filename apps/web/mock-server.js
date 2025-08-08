import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Mock data
let papers = [
  {
    paperId: "paper_1",
    title: "Machine Learning in Healthcare",
    authors: ["Dr. Jane Smith", "Prof. John Doe"],
    status: "completed",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    extractedTextLength: 5000,
    textChunks: 25,
    processingTime: 3000
  },
  {
    paperId: "paper_2", 
    title: "Deep Learning Applications in Research",
    authors: ["Dr. Michael Johnson", "Dr. Sarah Wilson"],
    status: "completed",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
    extractedTextLength: 7500,
    textChunks: 35,
    processingTime: 4500
  },
  {
    paperId: "paper_3",
    title: "Natural Language Processing Advances",
    authors: ["Dr. Jane Smith", "Prof. Robert Brown"],
    status: "completed", 
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-05"),
    extractedTextLength: 6000,
    textChunks: 30,
    processingTime: 3800
  }
];
let paperIdCounter = 4;

// Mock paper.getUploadUrl
app.post('/api/trpc/paper.getUploadUrl', (req, res) => {
  try {
    const { fileName, contentType } = req.body[0].input;
    
    const paperId = `paper_${paperIdCounter++}`;
    const uploadUrl = `https://mock-storage.googleapis.com/upload/${paperId}/${fileName}`;
    
    // Add paper to mock storage
    papers.push({
      paperId,
      title: fileName.replace(/\.[^/.]+$/, ""),
      status: 'processing',
      createdAt: new Date(),
    });
    
    res.json([{
      result: {
        data: {
          uploadUrl,
          paperId,
        }
      }
    }]);
  } catch (error) {
    res.status(500).json([{ error: { message: error.message } }]);
  }
});

// Mock rag.query
app.post('/api/trpc/rag.query', (req, res) => {
  try {
    const { query, scope } = req.body[0].input;
    
    // Simulate processing time
    setTimeout(() => {
      const mockAnswer = `Based on the available research papers, here's what I found regarding "${query}":\n\nThis is a mock response demonstrating the RAG system functionality. In a real implementation, this would contain actual insights extracted from your uploaded papers and the public corpus.\n\nThe system would search through ${scope === 'private' ? 'your private papers' : scope === 'public' ? 'the public corpus' : 'all available papers'} and provide relevant information with proper citations.`;

      const mockSources = [
        {
          paperId: "mock-paper-1",
          title: "Sample Research Paper 1",
          authors: ["Dr. Jane Smith"],
          content: "This is a sample content from the research paper that contains relevant information about the query.",
          score: 0.95
        },
        {
          paperId: "mock-paper-2",
          title: "Example Study on Related Topic",
          authors: ["Prof. John Doe"],
          content: "Another sample content that provides additional context and information related to the query.",
          score: 0.87
        }
      ];

      res.json([{
        result: {
          data: {
            answer: mockAnswer,
            sources: mockSources,
            query,
            scope,
            timestamp: new Date().toISOString()
          }
        }
      }]);
    }, 1000);
  } catch (error) {
    res.status(500).json([{ error: { message: error.message } }]);
  }
});

// Mock paper.getById
app.post('/api/trpc/paper.getById', (req, res) => {
  try {
    const { paperId } = req.body[0].input;
    
    const paper = papers.find(p => p.paperId === paperId);
    if (!paper) {
      return res.status(404).json([{ error: { message: 'Paper not found' } }]);
    }
    
    res.json([{
      result: {
        data: paper
      }
    }]);
  } catch (error) {
    res.status(500).json([{ error: { message: error.message } }]);
  }
});

// Mock paper.getUserPapers
app.post('/api/trpc/paper.getUserPapers', (req, res) => {
  try {
    const { status, search, limit = 20, offset = 0 } = req.body[0].input || {};
    
    let filteredPapers = papers;
    
    // Filter by status
    if (status && status !== 'all') {
      filteredPapers = filteredPapers.filter(p => p.status === status);
    }
    
    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPapers = filteredPapers.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.authors.some(author => author.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply pagination
    const paginatedPapers = filteredPapers.slice(offset, offset + limit);
    
    res.json([{
      result: {
        data: paginatedPapers
      }
    }]);
  } catch (error) {
    res.status(500).json([{ error: { message: error.message } }]);
  }
});

// Mock paper.getPaperDetails
app.post('/api/trpc/paper.getPaperDetails', (req, res) => {
  try {
    const { paperId } = req.body[0].input;
    
    const paper = papers.find(p => p.paperId === paperId);
    if (!paper) {
      return res.status(404).json([{ error: { message: 'Paper not found' } }]);
    }
    
    // Get related papers by same authors
    const relatedPapers = papers.filter(p => 
      p.paperId !== paperId && 
      p.authors.some(author => paper.authors.includes(author))
    ).slice(0, 5);
    
    const paperDetails = {
      ...paper,
      relatedPapers,
      metadata: {
        wordCount: paper.extractedTextLength || 0,
        chunkCount: paper.textChunks || 0,
        processingTime: paper.processingTime || 0,
      }
    };
    
    res.json([{
      result: {
        data: paperDetails
      }
    }]);
  } catch (error) {
    res.status(500).json([{ error: { message: error.message } }]);
  }
});

// Mock authors.getAuthorProfile
app.post('/api/trpc/authors.getAuthorProfile', (req, res) => {
  try {
    const { authorName } = req.body[0].input;
    
    const authorPapers = papers.filter(p => p.authors.includes(authorName));
    const totalPapers = authorPapers.length;
    const totalWords = authorPapers.reduce((sum, p) => sum + (p.extractedTextLength || 0), 0);
    
    // Get co-authors
    const coAuthors = new Set();
    authorPapers.forEach(paper => {
      paper.authors.forEach(author => {
        if (author !== authorName) coAuthors.add(author);
      });
    });
    
    const authorProfile = {
      authorName,
      statistics: {
        totalPapers,
        completedPapers: totalPapers,
        totalWords,
        avgWordsPerPaper: totalPapers > 0 ? Math.round(totalWords / totalPapers) : 0,
        coAuthorCount: coAuthors.size,
      },
      papers: authorPapers.slice(0, 5),
      coAuthors: Array.from(coAuthors),
      recentActivity: authorPapers.slice(0, 5).map(p => ({
        paperId: p.paperId,
        title: p.title,
        status: p.status,
        createdAt: p.createdAt,
      }))
    };
    
    res.json([{
      result: {
        data: authorProfile
      }
    }]);
  } catch (error) {
    res.status(500).json([{ error: { message: error.message } }]);
  }
});

// Mock authors.getUserAuthors
app.post('/api/trpc/authors.getUserAuthors', (req, res) => {
  try {
    const authorMap = new Map();
    
    papers.forEach(paper => {
      paper.authors.forEach(author => {
        if (!authorMap.has(author)) {
          authorMap.set(author, { count: 0, papers: [] });
        }
        const authorData = authorMap.get(author);
        authorData.count++;
        authorData.papers.push(paper.paperId);
      });
    });
    
    const authors = Array.from(authorMap.entries())
      .map(([name, data]) => ({
        name,
        paperCount: data.count,
        papers: data.papers,
      }))
      .sort((a, b) => b.paperCount - a.paperCount);
    
    res.json([{
      result: {
        data: authors
      }
    }]);
  } catch (error) {
    res.status(500).json([{ error: { message: error.message } }]);
  }
});

// Mock research.getTrendingTopics
app.post('/api/trpc/research.getTrendingTopics', (req, res) => {
  try {
    const topicMap = new Map();
    
    papers.forEach(paper => {
      const words = paper.title.toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(word => word.length > 3);
      
      words.forEach(word => {
        if (!topicMap.has(word)) {
          topicMap.set(word, { count: 0, papers: [] });
        }
        const topicData = topicMap.get(word);
        topicData.count++;
        if (!topicData.papers.includes(paper.paperId)) {
          topicData.papers.push(paper.paperId);
        }
      });
    });
    
    const trendingTopics = Array.from(topicMap.entries())
      .map(([topic, data]) => ({
        topic,
        frequency: data.count,
        paperCount: data.papers.length,
        papers: data.papers,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
    
    res.json([{
      result: {
        data: trendingTopics
      }
    }]);
  } catch (error) {
    res.status(500).json([{ error: { message: error.message } }]);
  }
});

// Mock topics.getTopicDetails
app.post('/api/trpc/topics.getTopicDetails', (req, res) => {
  try {
    const { topic } = req.body[0].input;
    
    const relatedPapers = papers.filter(paper => 
      paper.title.toLowerCase().includes(topic.toLowerCase()) ||
      paper.authors.some(author => author.toLowerCase().includes(topic.toLowerCase()))
    );
    
    const topicDetails = {
      topic,
      definition: `Definition for ${topic} - This is a mock definition that would be stored in Firestore.`,
      frequency: relatedPapers.length,
      relatedPapers: relatedPapers.slice(0, 10).map(p => ({
        paperId: p.paperId,
        title: p.title,
        authors: p.authors,
        createdAt: p.createdAt,
      })),
      coOccurringTopics: [
        { topic: "machine", frequency: 3 },
        { topic: "learning", frequency: 2 },
        { topic: "research", frequency: 2 }
      ]
    };
    
    res.json([{
      result: {
        data: topicDetails
      }
    }]);
  } catch (error) {
    res.status(500).json([{ error: { message: error.message } }]);
  }
});

// Mock rag.getConversationHistory
app.post('/api/trpc/rag.getConversationHistory', (req, res) => {
  try {
    const conversations = [
      {
        id: "conv_1",
        query: "What are the latest developments in machine learning?",
        answer: "Based on the available research papers, here are the latest developments...",
        scope: "private",
        timestamp: new Date("2024-01-15T10:30:00Z"),
        sources: [
          {
            paperId: "paper_1",
            title: "Machine Learning in Healthcare",
            authors: ["Dr. Jane Smith", "Prof. John Doe"],
            score: 0.95
          }
        ]
      },
      {
        id: "conv_2", 
        query: "How is deep learning applied in research?",
        answer: "Deep learning applications in research include...",
        scope: "all",
        timestamp: new Date("2024-01-14T15:45:00Z"),
        sources: [
          {
            paperId: "paper_2",
            title: "Deep Learning Applications in Research", 
            authors: ["Dr. Michael Johnson", "Dr. Sarah Wilson"],
            score: 0.87
          }
        ]
      }
    ];
    
    res.json([{
      result: {
        data: conversations
      }
    }]);
  } catch (error) {
    res.status(500).json([{ error: { message: error.message } }]);
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- POST /api/trpc/paper.getUploadUrl');
  console.log('- POST /api/trpc/paper.getUserPapers');
  console.log('- POST /api/trpc/paper.getPaperDetails');
  console.log('- POST /api/trpc/paper.getById');
  console.log('- POST /api/trpc/authors.getAuthorProfile');
  console.log('- POST /api/trpc/authors.getUserAuthors');
  console.log('- POST /api/trpc/research.getTrendingTopics');
  console.log('- POST /api/trpc/topics.getTopicDetails');
  console.log('- POST /api/trpc/rag.query');
  console.log('- POST /api/trpc/rag.getConversationHistory');
}); 