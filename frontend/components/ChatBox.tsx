import { useEffect, useRef, useState } from 'react';

interface ChatBoxProps {
  projectId: string;
  userId: string;
}

interface Message {
  sender: string;
  content: string;
  timestamp: string;
}

export default function ChatBox({ projectId, userId }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:8000/api/v1/ws/${projectId}`);
    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setMessages((prev) => [...prev, msg]);
    };
    return () => {
      ws.current?.close();
    };
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && ws.current?.readyState === WebSocket.OPEN) {
      const msg = { sender: userId, content: input, timestamp: new Date().toISOString() };
      ws.current.send(JSON.stringify(msg));
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-80 bg-white rounded-lg shadow p-4">
      <div className="flex-1 overflow-y-auto mb-2">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-1 ${msg.sender === userId ? 'text-right' : 'text-left'}`}>
            <span className="block text-xs text-gray-400">{msg.sender} • {new Date(msg.timestamp).toLocaleTimeString()}</span>
            <span className="inline-block bg-blue-100 text-blue-900 rounded px-2 py-1 mt-1 max-w-xs break-words">{msg.content}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex items-center space-x-2">
        <input
          className="flex-1 border border-gray-300 rounded px-3 py-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Send</button>
      </form>
    </div>
  );
} 