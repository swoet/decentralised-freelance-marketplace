import { useEffect } from 'react';

interface ToastProps {
  message: string | any; // Accept any type but will convert to string
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
  // Ensure message is always a string
  const displayMessage = typeof message === 'string' 
    ? message 
    : typeof message === 'object' && message !== null
    ? message.msg || message.message || JSON.stringify(message)
    : String(message);

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const typeStyles = {
    success: 'bg-green-100 text-green-800 border-green-300',
    error: 'bg-red-100 text-red-800 border-red-300',
    info: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  return (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded border shadow-lg ${typeStyles[type]}`}> 
      <span>{displayMessage}</span>
      <button onClick={onClose} className="ml-4 text-sm text-gray-500 hover:text-gray-700">&times;</button>
    </div>
  );
} 