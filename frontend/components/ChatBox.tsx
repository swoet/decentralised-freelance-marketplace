import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface ChatBoxProps {
  projectId: string;
}

interface Message {
  sender: string;
  content: string;
  timestamp: string;
}

export default function ChatBox({ projectId }: ChatBoxProps) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages when component mounts
  useEffect(() => {
    if (!token || !projectId) return;
    
    const loadMessages = async () => {
      try {
        setConnectionStatus('connecting');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const response = await fetch(`${API_URL}/messages?project_id=${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setMessages(Array.isArray(data) ? data : []);
          setConnectionStatus('connected');
        } else if (response.status === 404) {
          // No messages endpoint or project chat not implemented
          setMessages([]);
          setConnectionStatus('error');
        } else {
          setConnectionStatus('error');
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
        setConnectionStatus('error');
      }
    };
    
    loadMessages();
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    
    return () => clearInterval(interval);
  }, [projectId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !token || !user) return;
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_id: user.id, // For now, using same user - this should be updated to support actual recipients
          project_id: projectId,
          content: input,
        }),
      });
      
      if (response.ok) {
        setInput('');
        // Reload messages to show the new message
        const loadResponse = await fetch(`${API_URL}/messages?project_id=${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (loadResponse.ok) {
          const data = await loadResponse.json();
          setMessages(Array.isArray(data) ? data : []);
        }
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-80 bg-white rounded-lg shadow p-4">
        <p className="text-gray-500">Please log in to access project chat</p>
      </div>
    );
  }

  // Note: This is a basic implementation. For proper project group chat,
  // we would need a dedicated chat room system with proper participant management

  return (
    <div className="flex flex-col h-80 bg-white rounded-lg shadow p-4">
      {/* Connection Status */}
      <div className="mb-2">
        <span className={`text-xs px-2 py-1 rounded ${
          connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
          connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
          connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {connectionStatus === 'connected' ? '● Connected' :
           connectionStatus === 'connecting' ? '● Connecting...' :
           connectionStatus === 'error' ? '● Connection Error' :
           '● Disconnected'}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto mb-2">
        {connectionStatus === 'error' ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-center">
            <div>
              <p className="mb-2">🚧 Project Chat Coming Soon!</p>
              <p className="text-sm">Group chat functionality is being developed.</p>
              <p className="text-sm">For now, use direct messages or comments on bids.</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`mb-1 ${msg.sender === user.id ? 'text-right' : 'text-left'}`}>
              <span className="block text-xs text-gray-400">{msg.sender} • {new Date(msg.timestamp).toLocaleTimeString()}</span>
              <span className="inline-block bg-blue-100 text-blue-900 rounded px-2 py-1 mt-1 max-w-xs break-words">{msg.content}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendMessage} className="flex items-center space-x-2">
        <input
          className="flex-1 border border-gray-300 rounded px-3 py-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={connectionStatus === 'error' ? 'Chat not available yet' : 'Type a message...'}
          disabled={connectionStatus !== 'connected'}
        />
        <button 
          type="submit" 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={connectionStatus !== 'connected' || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
} 