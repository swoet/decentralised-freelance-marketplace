import { QueryClient, DefaultOptions } from '@tanstack/react-query'

const queryConfig: DefaultOptions = {
  queries: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  mutations: {
    retry: 0,
  },
}

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
})

// Query keys factory for consistency
export const queryKeys = {
  // User queries
  user: {
    all: ['user'] as const,
    detail: (id: number) => ['user', id] as const,
    profile: () => ['user', 'profile'] as const,
    sessions: () => ['user', 'sessions'] as const,
  },
  
  // Project queries
  projects: {
    all: ['projects'] as const,
    lists: () => ['projects', 'list'] as const,
    list: (filters: Record<string, any>) => ['projects', 'list', filters] as const,
    detail: (id: number) => ['projects', id] as const,
    bids: (projectId: number) => ['projects', projectId, 'bids'] as const,
  },
  
  // Bid queries
  bids: {
    all: ['bids'] as const,
    list: (filters: Record<string, any>) => ['bids', 'list', filters] as const,
    detail: (id: number) => ['bids', id] as const,
    myBids: () => ['bids', 'my-bids'] as const,
  },
  
  // Escrow queries
  escrow: {
    all: ['escrow'] as const,
    list: () => ['escrow', 'list'] as const,
    detail: (id: number) => ['escrow', id] as const,
    milestones: (escrowId: number) => ['escrow', escrowId, 'milestones'] as const,
  },
  
  // Message queries
  messages: {
    all: ['messages'] as const,
    conversations: () => ['messages', 'conversations'] as const,
    conversation: (projectId: number) => ['messages', 'conversation', projectId] as const,
  },
  
  // Notification queries
  notifications: {
    all: ['notifications'] as const,
    list: () => ['notifications', 'list'] as const,
    unread: () => ['notifications', 'unread'] as const,
  },
  
  // Admin queries
  admin: {
    dashboard: () => ['admin', 'dashboard'] as const,
    users: (filters: Record<string, any>) => ['admin', 'users', filters] as const,
    analytics: (timeRange: string) => ['admin', 'analytics', timeRange] as const,
    logs: (filters: Record<string, any>) => ['admin', 'logs', filters] as const,
  },
  
  // Blockchain queries
  blockchain: {
    chains: () => ['blockchain', 'chains'] as const,
    transactions: (address: string) => ['blockchain', 'transactions', address] as const,
    balance: (address: string, chainId: number) => ['blockchain', 'balance', address, chainId] as const,
  },
  
  // AI queries
  ai: {
    matches: (userId: number) => ['ai', 'matches', userId] as const,
    recommendations: () => ['ai', 'recommendations'] as const,
  },
}
