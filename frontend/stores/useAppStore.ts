import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// Types
export interface User {
  id: number
  email: string
  username: string
  role: 'client' | 'freelancer' | 'admin' | 'super_admin'
  wallet_address?: string
  is_verified: boolean
  mfa_enabled: boolean
  profile_picture?: string
}

export interface Project {
  id: number
  title: string
  description: string
  budget_min: number
  budget_max: number
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  client_id: number
  created_at: string
  required_skills?: string[]
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}

export interface AppState {
  // User state
  user: User | null
  isAuthenticated: boolean
  token: string | null
  
  // Projects state
  projects: Project[]
  selectedProject: Project | null
  
  // Notifications state
  notifications: Notification[]
  unreadCount: number
  
  // UI state
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  
  // Loading states
  isLoading: boolean
  
  // Actions - User
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  
  // Actions - Projects
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  updateProject: (id: number, updates: Partial<Project>) => void
  deleteProject: (id: number) => void
  setSelectedProject: (project: Project | null) => void
  
  // Actions - Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
  clearNotifications: () => void
  removeNotification: (id: string) => void
  
  // Actions - UI
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        token: null,
        projects: [],
        selectedProject: null,
        notifications: [],
        unreadCount: 0,
        sidebarOpen: true,
        theme: 'system',
        isLoading: false,

        // User actions
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        
        setToken: (token) => set({ token }),
        
        login: (user, token) => set({ 
          user, 
          token, 
          isAuthenticated: true 
        }),
        
        logout: () => set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          projects: [],
          selectedProject: null
        }),
        
        updateUser: (updates) => set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        })),

        // Project actions
        setProjects: (projects) => set({ projects }),
        
        addProject: (project) => set((state) => ({
          projects: [project, ...state.projects]
        })),
        
        updateProject: (id, updates) => set((state) => ({
          projects: state.projects.map(p => 
            p.id === id ? { ...p, ...updates } : p
          ),
          selectedProject: state.selectedProject?.id === id 
            ? { ...state.selectedProject, ...updates }
            : state.selectedProject
        })),
        
        deleteProject: (id) => set((state) => ({
          projects: state.projects.filter(p => p.id !== id),
          selectedProject: state.selectedProject?.id === id 
            ? null 
            : state.selectedProject
        })),
        
        setSelectedProject: (project) => set({ selectedProject: project }),

        // Notification actions
        addNotification: (notification) => {
          const id = `notif-${Date.now()}-${Math.random()}`
          const newNotification: Notification = {
            ...notification,
            id,
            timestamp: new Date(),
            read: false
          }
          
          set((state) => ({
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1
          }))
          
          // Auto-remove after 5 seconds for non-error notifications
          if (notification.type !== 'error') {
            setTimeout(() => {
              get().removeNotification(id)
            }, 5000)
          }
        },
        
        markNotificationAsRead: (id) => set((state) => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        })),
        
        markAllNotificationsAsRead: () => set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0
        })),
        
        clearNotifications: () => set({ 
          notifications: [], 
          unreadCount: 0 
        }),
        
        removeNotification: (id) => set((state) => {
          const notification = state.notifications.find(n => n.id === id)
          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: notification && !notification.read 
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount
          }
        }),

        // UI actions
        toggleSidebar: () => set((state) => ({ 
          sidebarOpen: !state.sidebarOpen 
        })),
        
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        
        setTheme: (theme) => set({ theme }),
        
        setLoading: (loading) => set({ isLoading: loading })
      }),
      {
        name: 'craftnexus-storage',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
          theme: state.theme,
          sidebarOpen: state.sidebarOpen
        })
      }
    )
  )
)

// Selectors for better performance
export const selectUser = (state: AppState) => state.user
export const selectIsAuthenticated = (state: AppState) => state.isAuthenticated
export const selectProjects = (state: AppState) => state.projects
export const selectNotifications = (state: AppState) => state.notifications
export const selectUnreadCount = (state: AppState) => state.unreadCount
export const selectTheme = (state: AppState) => state.theme
