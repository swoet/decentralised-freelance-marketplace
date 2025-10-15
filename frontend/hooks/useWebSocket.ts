import { useEffect, useRef, useState, useCallback } from 'react'
import { useAppStore } from '@/stores/useAppStore'

interface UseWebSocketOptions {
  onMessage?: (data: any) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  reconnect?: boolean
  reconnectInterval?: number
  reconnectAttempts?: number
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnect = true,
    reconnectInterval = 3000,
    reconnectAttempts = 5,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectCountRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const token = useAppStore((state) => state.token)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      // Add token to WebSocket URL if authenticated
      const wsUrl = token ? `${url}?token=${token}` : url
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        setIsConnected(true)
        reconnectCountRef.current = 0
        onOpen?.()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
          onMessage?.(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        onClose?.()

        // Attempt to reconnect
        if (reconnect && reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        onError?.(error)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
    }
  }, [url, token, onMessage, onOpen, onClose, onError, reconnect, reconnectInterval, reconnectAttempts])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  const sendMessage = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    lastMessage,
    sendMessage,
    disconnect,
    reconnect: connect,
  }
}

// Specific WebSocket hooks
export function useNotificationWebSocket() {
  const addNotification = useAppStore((state) => state.addNotification)
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/notifications'

  return useWebSocket(WS_URL, {
    onMessage: (data) => {
      if (data.type === 'notification') {
        addNotification({
          type: data.level || 'info',
          title: data.title,
          message: data.message,
          actionUrl: data.action_url,
        })
      }
    },
  })
}

export function useChatWebSocket(projectId: number) {
  const [messages, setMessages] = useState<any[]>([])
  const WS_URL = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/chat/${projectId}`

  const { sendMessage, isConnected } = useWebSocket(WS_URL, {
    onMessage: (data) => {
      if (data.type === 'message') {
        setMessages((prev) => [...prev, data.message])
      }
    },
  })

  const sendChatMessage = useCallback(
    (content: string) => {
      sendMessage({
        type: 'message',
        content,
        project_id: projectId,
      })
    },
    [sendMessage, projectId]
  )

  return {
    messages,
    sendMessage: sendChatMessage,
    isConnected,
  }
}
