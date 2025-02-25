import { type Chat, type Message } from "@shared/schema";

export interface IStorage {
  createChat(chat: { title: string }): Promise<Chat>;
  getChats(): Promise<Chat[]>;
  getChat(id: number): Promise<Chat | undefined>;
  getMessages(chatId: number): Promise<Message[]>;
  createMessage(message: { chatId: number; content: string; role: string; imageUrl: string | null }): Promise<Message>;
}

let chats: Chat[] = [];
let messages: Message[] = [];
let nextChatId = 1;
let nextMessageId = 1;

export const storage: IStorage = {
  getChats: async () => chats,

  createChat: async (data: { title: string }): Promise<Chat> => {
    const chat = {
      id: nextChatId++,
      title: data.title,
      createdAt: new Date(),
    };
    chats.push(chat);
    return chat;
  },

  getChat: async (id: number): Promise<Chat | undefined> => {
    return chats.find(chat => chat.id === id);
  },

  getMessages: async (chatId: number): Promise<Message[]> => {
    return messages.filter(m => m.chatId === chatId);
  },

  createMessage: async (data: { chatId: number; content: string; role: string; imageUrl: string | null }): Promise<Message> => {
    const message = {
      id: nextMessageId++,
      chatId: data.chatId,
      content: data.content,
      role: data.role as "user" | "assistant",
      imageUrl: data.imageUrl,
      createdAt: new Date(),
    };
    messages.push(message);
    return message;
  }
};