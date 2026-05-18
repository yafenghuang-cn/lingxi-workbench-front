export type ChatTextPart = {
  type: "text";
  text: string;
};

export type ChatImageUrlPart = {
  type: "image_url";
  image_url: string;
};

export type ChatContentPart = ChatTextPart | ChatImageUrlPart;

export type ChatMessagePayload = {
  role: "user" | "assistant" | "system";
  content: string | ChatContentPart[];
};

export type WebAiUploadedFile = {
  url: string;
  filename?: string;
  mimeType?: string;
  size?: number;
};

export type ChatStreamRequestBody = {
  messages: ChatMessagePayload[];
  reasoningEffort?: "low" | "medium" | "high" | "none";
  deepThinking?: boolean;
};
