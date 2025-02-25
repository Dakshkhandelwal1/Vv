
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Chat, Message } from '@shared/schema';

export default function App() {
  const [newChatTitle, setNewChatTitle] = useState('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: chats } = useQuery<Chat[]>({
    queryKey: ['chats'],
    queryFn: () => fetch('/api/chats').then(r => r.json()),
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: ['messages', selectedChat?.id],
    queryFn: () => selectedChat 
      ? fetch(`/api/chats/${selectedChat.id}/messages`).then(r => r.json())
      : Promise.resolve([]),
    enabled: !!selectedChat,
  });

  const createChat = useMutation({
    mutationFn: (title: string) => 
      fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      setNewChatTitle('');
    },
  });

  const sendMessage = useMutation({
    mutationFn: (content: string) =>
      fetch(`/api/chats/${selectedChat?.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, role: 'user' }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedChat?.id] });
      setNewMessage('');
    },
  });

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg p-6 flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Image AI Chat</h1>
          <div className="space-y-3">
            <input
              type="text"
              value={newChatTitle}
              onChange={e => setNewChatTitle(e.target.value)}
              placeholder="New chat title"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => createChat.mutate(newChatTitle)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Create New Chat
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          {chats?.map(chat => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`p-4 mb-2 rounded-lg cursor-pointer transition ${
                selectedChat?.id === chat.id 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'hover:bg-gray-100'
              }`}
            >
              {chat.title}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="bg-white shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800">{selectedChat.title}</h2>
            </div>
            
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {messages?.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-lg rounded-lg p-4 ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200'
                  }`}>
                    <p>{message.content}</p>
                    {message.imageUrl && (
                      <img 
                        src={message.imageUrl} 
                        alt="Generated" 
                        className="mt-2 rounded-lg max-w-md"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white shadow-lg p-6">
              <form 
                onSubmit={e => {
                  e.preventDefault();
                  if (newMessage.trim()) {
                    sendMessage.mutate(newMessage);
                  }
                }}
                className="flex space-x-4"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={sendMessage.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  Generate
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat or create a new one to start generating images
          </div>
        )}
      </div>
    </div>
  );
}
