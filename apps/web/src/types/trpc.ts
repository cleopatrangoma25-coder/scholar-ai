// Temporary type definitions for tRPC until functions are built
// Using any type to bypass TypeScript issues during build

export interface AppRouter {
  _def: {
    queries: Record<string, any>;
    mutations: Record<string, any>;
    subscriptions: Record<string, any>;
  };
  createCaller: any;
  health: {
    query: () => Promise<{ status: string; timestamp: string }>;
  };
  paper: {
    getUploadUrl: {
      input: { fileName: string; contentType: string };
      output: { uploadUrl: string; paperId: string };
    };
    getById: {
      input: string;
      output: any;
    };
    getUserPapers: {
      input: {
        status?: 'all' | 'processing' | 'completed' | 'error';
        search?: string;
        limit?: number;
        offset?: number;
      };
      output: any[];
    };
    getPaperDetails: {
      input: string;
      output: any;
    };
  };
  rag: {
    query: {
      input: { query: string; scope: 'private' | 'public' | 'all' };
      output: {
        answer: string;
        sources: Array<{
          paperId: string;
          title: string;
          authors: string[];
          content: string;
          score: number;
        }>;
        query: string;
        scope: string;
        timestamp: string;
      };
    };
  };
  authors: {
    getAll: {
      output: any[];
    };
    getById: {
      input: string;
      output: any;
    };
    getAuthorPapers: {
      input: { authorId: string; limit?: number; offset?: number };
      output: any[];
    };
  };
  research: {
    getTrendingTopics: {
      output: any[];
    };
    getRecentPapers: {
      output: any[];
    };
    searchPapers: {
      input: { query: string; limit?: number; offset?: number };
      output: any[];
    };
  };
  topics: {
    getAll: {
      output: any[];
    };
    getById: {
      input: string;
      output: any;
    };
    getTopicPapers: {
      input: { topicId: string; limit?: number; offset?: number };
      output: any[];
    };
    searchTopics: {
      input: { query: string; limit?: number; offset?: number };
      output: any[];
    };
  };
} 