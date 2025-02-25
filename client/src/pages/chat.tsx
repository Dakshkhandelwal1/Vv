import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { MessageSquarePlus, Send, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { Chat, Message } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function ChatPage() {
  const [location, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const chatId = parseInt(location.split("/")[2]);

  const { data: chats } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: ["/api/chats", chatId, "messages"],
    enabled: !isNaN(chatId),
  });

  const createChat = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/chats", {
        title: "New Chat",
      });
      return await res.json();
    },
    onSuccess: (data: Chat) => {
      setLocation(`/chat/${data.id}`);
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/chats/${chatId}/messages`, {
        content,
        role: "user",
      });
      return await res.json();
    },
    onSuccess: () => {
      setInput("");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message",
      });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar Trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden absolute top-4 left-4">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar chats={chats || []} onCreate={() => createChat.mutate()} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 border-r border-border">
        <Sidebar chats={chats || []} onCreate={() => createChat.mutate()} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative">
          <ScrollArea ref={scrollRef} className="absolute inset-0">
            <div className="p-4 space-y-4">
              {!messages?.length && (
                <div className="text-center text-muted-foreground pt-20">
                  <h1 className="text-4xl font-bold mb-2">Vidhya AI</h1>
                  <p>Start generating images with AI</p>
                </div>
              )}
              {messages?.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "assistant" ? "justify-start" : "justify-end"
                  }`}
                >
                  <Card
                    className={`max-w-[80%] p-4 ${
                      message.role === "assistant"
                        ? "bg-primary text-primary-foreground"
                        : ""
                    }`}
                  >
                    <p>{message.content}</p>
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        alt="Generated"
                        className="mt-2 rounded-lg max-w-full h-auto"
                      />
                    )}
                    {message.content === "Generating image..." && (
                      <div className="animate-pulse mt-2">••••</div>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) {
                sendMessage.mutate(input);
              }
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the image you want to generate..."
              disabled={sendMessage.isPending}
            />
            <Button type="submit" disabled={sendMessage.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ chats, onCreate }: { chats: Chat[]; onCreate: () => void }) {
  const [location] = useLocation();
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <Button onClick={onCreate} className="w-full" size="lg">
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {chats.map((chat) => (
            <Link key={chat.id} href={`/chat/${chat.id}`}>
              <Button
                variant={
                  location === `/chat/${chat.id}` ? "secondary" : "ghost"
                }
                className="w-full justify-start"
              >
                {chat.title}
              </Button>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
