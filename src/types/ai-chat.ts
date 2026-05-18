export interface IChatTextPart {
  type: "text";
  text: string;
}

export interface IChatImageUrlPart {
  type: "image_url";
  image_url: string;
}

export type ChatContentPart = IChatTextPart | IChatImageUrlPart;

export interface IChatMessagePayload {
  role: "user" | "assistant" | "system";
  content: string | ChatContentPart[];
}

export interface IWebAiUploadedFile {
  url: string;
  filename?: string;
  mimeType?: string;
  size?: number;
}

export interface IChatStreamRequestBody {
  messages: IChatMessagePayload[];
  reasoningEffort?: "low" | "medium" | "high" | "none";
  deepThinking?: boolean;
}
