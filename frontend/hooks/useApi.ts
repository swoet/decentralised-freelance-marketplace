import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/stores/useAppStore'
import { queryKeys } from '@/utils/queryClient'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ApiOptions extends RequestInit {
  requiresAuth?: boolean
}

// Generic API fetch function
async function apiFetch<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { requiresAuth = true, ...fetchOptions } = options
  const token = useAppStore.getState().token

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  }

  if (requiresAuth && token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }))
    throw new Error(error.detail || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Custom hook for API calls with React Query
export function useApi<T>(
  endpoint: string,
  options?: ApiOptions,
  queryOptions?: any
) {
  return useQuery({
    queryKey: [endpoint, options],
    queryFn: () => apiFetch<T>(endpoint, options),
    ...queryOptions,
  })
}

// Custom hook for mutations
export function useApiMutation<TData, TVariables>(
  endpoint: string | ((variables: TVariables) => string),
  options?: Omit<ApiOptions, 'body'>,
  mutationOptions?: any
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const url = typeof endpoint === 'function' ? endpoint(variables) : endpoint
      return apiFetch<TData>(url, {
        method: 'POST',
        body: JSON.stringify(variables),
        ...options,
      })
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries()
    },
    ...mutationOptions,
  })
}

// Specific API hooks
export function useProjects(page: number = 1, filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: queryKeys.projects.list({ page, ...filters }),
    queryFn: () => apiFetch(`/api/v1/projects?page=${page}&${new URLSearchParams(filters)}`),
  })
}

export function useProject(id: number) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => apiFetch(`/api/v1/projects/${id}`),
    enabled: !!id,
  })
}

export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: () => apiFetch('/api/v1/users/me'),
  })
}

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => apiFetch('/api/v1/notifications'),
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (projectData: any) => 
      apiFetch('/api/v1/projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}

export function useUpdateProject(id: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (updates: any) =>
      apiFetch(`/api/v1/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/projects/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}
