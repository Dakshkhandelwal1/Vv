import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { HfInference } from "@huggingface/inference";
import { insertChatSchema, insertMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Get all chats
  app.get("/api/chats", async (req, res) => {
    const chats = await storage.getChats();
    res.json(chats);
  });

  // Create new chat
  app.post("/api/chats", async (req, res) => {
    const parsed = insertChatSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid chat data" });
      return;
    }
    const chat = await storage.createChat(parsed.data);
    res.json(chat);
  });

  // Get chat messages
  app.get("/api/chats/:id/messages", async (req, res) => {
    const messages = await storage.getMessages(Number(req.params.id));
    res.json(messages);
  });

  // Create message and generate image
  app.post("/api/chats/:id/messages", async (req, res) => {
    const parsed = insertMessageSchema.safeParse({
      ...req.body,
      chatId: Number(req.params.id),
    });
    
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid message data" });
      return;
    }

    // Save user message
    const userMessage = await storage.createMessage(parsed.data);

    if (parsed.data.role === "user") {
      try {
        // Create assistant message with loading state
        const loadingMessage = await storage.createMessage({
          chatId: Number(req.params.id),
          content: "Generating image...",
          role: "assistant",
          imageUrl: null,
        });

        // Generate image using HuggingFace
        const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);
        const image = await hf.textToImage({
          model: "black-forest-labs/FLUX.1-dev",
          inputs: parsed.data.content,
          parameters: { num_inference_steps: 5 },
          provider: "together",
        });

        // Convert blob to base64
        const buffer = await image.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const imageUrl = `data:image/jpeg;base64,${base64}`;

        // Update assistant message with image
        const assistantMessage = await storage.createMessage({
          chatId: Number(req.params.id),
          content: "Here's your generated image:",
          role: "assistant",
          imageUrl,
        });

        res.json([userMessage, assistantMessage]);
      } catch (error) {
        const errorMessage = await storage.createMessage({
          chatId: Number(req.params.id),
          content: "Sorry, there was an error generating the image.",
          role: "assistant",
          imageUrl: null,
        });
        res.json([userMessage, errorMessage]);
      }
    } else {
      res.json([userMessage]);
    }
  });

  return httpServer;
}
