import type { ChatContentPart, ChatMessagePayload } from "@/types/ai-chat";

export type ChatMessageImage = {
  url?: string;
  previewUrl: string;
};

export type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  images?: ChatMessageImage[];
  reasoning?: string;
};

export const toChatMessagePayload = (message: ChatMessage): ChatMessagePayload => {
  if (message.role === "assistant" || !message.images?.length) {
    return {
      role: message.role,
      content: message.content,
    };
  }

  const content: ChatContentPart[] = message.images.map((image) => ({
    type: "image_url",
    image_url: image.url ?? image.previewUrl,
  }));

  if (message.content.trim()) {
    content.push({ type: "text", text: message.content });
  }

  return {
    role: message.role,
    content,
  };
};
