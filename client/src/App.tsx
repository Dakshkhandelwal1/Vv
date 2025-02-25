
import { useState, useEffect } from 'react';
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
    <div className="flex h-screen bg-background text-foreground">
      <div className="w-64 border-r p-4 flex flex-col">
        <div className="mb-4">
          <input
            type="text"
            value={newChatTitle}
            onChange={e => setNewChatTitle(e.target.value)}
            placeholder="New chat title"
            className="w-full p-2 border rounded"
          />
          <button
            onClick={() => createChat.mutate(newChatTitle)}
            className="w-full mt-2 p-2 bg-primary text-white rounded"
          >
            Create Chat
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          {chats?.map(chat => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`p-2 cursor-pointer rounded ${
                selectedChat?.id === chat.id ? 'bg-accent' : ''
              }`}
            >
              {chat.title}
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 border-b">
              <h1 className="text-xl font-bold">{selectedChat.title}</h1>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {messages?.map(message => (
                <div
                  key={message.id}
                  className={`mb-4 ${
                    message.role === 'user' ? 'text-right' : ''
                  }`}
                >
                  <div
                    className={`inline-block p-2 rounded ${
                      message.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-accent'
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="Generated"
                      className="mt-2 max-w-sm rounded"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border rounded"
                />
                <button
                  onClick={() => sendMessage.mutate(newMessage)}
                  className="p-2 bg-primary text-white rounded"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
