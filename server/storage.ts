import { type Chat, type Message, type InsertChat, type InsertMessage } from "@shared/schema";

export interface IStorage {
  createChat(chat: InsertChat): Promise<Chat>;
  getChats(): Promise<Chat[]>;
  getChat(id: number): Promise<Chat | undefined>;
  getMessages(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private chats: Map<number, Chat>;
  private messages: Map<number, Message>;
  private chatId: number = 1;
  private messageId: number = 1;

  constructor() {
    this.chats = new Map();
    this.messages = new Map();
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const id = this.chatId++;
    const newChat: Chat = {
      id,
      ...chat,
      createdAt: new Date(),
    };
    this.chats.set(id, newChat);
    return newChat;
  }

  async getChats(): Promise<Chat[]> {
    return Array.from(this.chats.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getChat(id: number): Promise<Chat | undefined> {
    return this.chats.get(id);
  }

  async getMessages(chatId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.chatId === chatId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const newMessage: Message = {
      id,
      ...message,
      createdAt: new Date(),
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }
}

export const storage = new MemStorage();
