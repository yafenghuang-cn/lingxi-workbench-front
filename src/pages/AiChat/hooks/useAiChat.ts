import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from "react";

import { postChatStream } from "@/api/ai";
import {
  createPendingChatImage,
  extractImagesFromClipboard,
  resolveImageContentParts,
  revokePendingChatImage,
  validateChatImageBatch,
  type PendingChatImage,
} from "@/lib/ai-chat-image";
import {
  toChatMessagePayload,
  type ChatMessage,
  type ChatMessageImage,
} from "@/lib/ai-chat-message";
import type { ChatContentPart } from "@/types/ai-chat";
import {
  extractStreamDelta,
  extractStreamErrorMessage,
  extractStreamReasoning,
} from "@/lib/stream-delta";
import { readSseStream } from "@/pages/AiChat/lib/sse";

type Conversation = {
  id: number;
  title: string;
  updatedAt: string;
};

const initialConversations: Conversation[] = [
  { id: 1, title: "新的对话", updatedAt: "刚刚" },
];

const createMessageId = () => Date.now() + Math.random();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getErrorMessage = (value: unknown) => {
  if (isRecord(value) && typeof value.message === "string") {
    return value.message;
  }

  if (value instanceof Error) {
    return value.message;
  }

  return "AI 对话接口暂时不可用，请稍后再试。";
};

const mapImagePartsToMessageImages = (
  pendingImages: PendingChatImage[],
  imageParts: ChatContentPart[],
): ChatMessageImage[] =>
  pendingImages.map((pending, index) => {
    const part = imageParts[index];
    const image: ChatMessageImage = {
      previewUrl: pending.previewUrl,
    };

    if (part?.type === "image_url") {
      image.url = part.image_url;
    }

    return image;
  });

const clearPendingImages = (images: PendingChatImage[]) => {
  images.forEach(revokePendingChatImage);
};

const useAiChat = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState<PendingChatImage[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState(1);
  const [isSending, setIsSending] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasMessages = messages.length > 0;
  const canSend = (input.trim().length > 0 || pendingImages.length > 0) && !isSending;

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const toggleSidebar = () => {
    setSidebarOpen((value) => !value);
  };

  const openSettings = () => {
    setSettingsOpen(true);
  };

  const closeSettings = () => {
    setSettingsOpen(false);
  };

  const handleConversationClick = (conversationId: number) => {
    setActiveConversationId(conversationId);
  };

  const openImagePicker = () => {
    fileInputRef.current?.click();
  };

  const removePendingImage = useCallback((imageId: string) => {
    setPendingImages((current) => {
      const target = current.find((item) => item.id === imageId);

      if (target) {
        revokePendingChatImage(target);
      }

      return current.filter((item) => item.id !== imageId);
    });
  }, []);

  const pendingImagesRef = useRef(pendingImages);
  pendingImagesRef.current = pendingImages;

  const appendPendingImages = useCallback((files: File[]) => {
    if (files.length === 0) {
      return false;
    }

    const validationError = validateChatImageBatch(files, pendingImagesRef.current.length);

    if (validationError) {
      setError(validationError);
      return false;
    }

    setError("");
    setPendingImages((current) => [...current, ...files.map((file) => createPendingChatImage(file))]);

    return true;
  }, []);

  const handleImageFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;

    if (!fileList?.length) {
      return;
    }

    appendPendingImages(Array.from(fileList));
    event.target.value = "";
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    if (isSending) {
      return;
    }

    const imageFiles = extractImagesFromClipboard(event.clipboardData);

    if (imageFiles.length === 0) {
      return;
    }

    event.preventDefault();
    appendPendingImages(imageFiles);
  };

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      pendingImagesRef.current.forEach(revokePendingChatImage);
    };
  }, []);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, pendingImages]);

  const startNewConversation = () => {
    abortControllerRef.current?.abort();

    const nextConversation = {
      id: Date.now(),
      title: "新的对话",
      updatedAt: "刚刚",
    };

    setPendingImages((current) => {
      clearPendingImages(current);
      return [];
    });
    setConversations((current) => [nextConversation, ...current]);
    setActiveConversationId(nextConversation.id);
    setMessages([]);
    setInput("");
    setError("");
    setIsSending(false);
  };

  const sendMessage = async () => {
    const content = input.trim();
    const imagesToSend = pendingImages;

    if ((!content && imagesToSend.length === 0) || isSending) {
      return;
    }

    setIsSending(true);
    setError("");

    let imageParts: ChatContentPart[] = [];

    try {
      imageParts = await resolveImageContentParts(imagesToSend);
    } catch (exception) {
      setIsSending(false);
      setError(getErrorMessage(exception));
      return;
    }

    const messageImages = mapImagePartsToMessageImages(imagesToSend, imageParts);
    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content,
      images: messageImages.length > 0 ? messageImages : undefined,
    };

    const assistantMessage: ChatMessage = {
      id: createMessageId(),
      role: "assistant",
      content: "",
      reasoning: "",
    };

    const requestMessages = [...messages, userMessage].map(toChatMessagePayload);

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput("");
    setPendingImages((current) => {
      clearPendingImages(current);
      return [];
    });

    const conversationTitle =
      content.slice(0, 18) ||
      (imagesToSend.length > 0 ? `图片对话（${imagesToSend.length}张）` : "新的对话");

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === activeConversationId
          ? { ...conversation, title: conversationTitle, updatedAt: "刚刚" }
          : conversation,
      ),
    );

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await postChatStream(
        {
          messages: requestMessages,
          reasoningEffort: "none",
        },
        controller.signal,
      );

      await readSseStream(response, async (parsed) => {
        if (
          parsed.event === "chunk" ||
          parsed.event === "message" ||
          parsed.event === "content_block_delta"
        ) {
          const delta = extractStreamDelta(parsed.data);
          const reasoning = extractStreamReasoning(parsed.data);

          if (delta || reasoning) {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessage.id
                  ? {
                      ...message,
                      content: delta ? message.content + delta : message.content,
                      reasoning: reasoning
                        ? `${message.reasoning ?? ""}${reasoning}`
                        : message.reasoning,
                    }
                  : message,
              ),
            );
          }
        }

        if (parsed.event === "error") {
          const streamError = extractStreamErrorMessage(parsed.data);
          throw new Error(streamError ?? getErrorMessage(parsed.data));
        }
      });
    } catch (exception) {
      if (controller.signal.aborted) {
        return;
      }

      const message = getErrorMessage(exception);

      setError(message);
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantMessage.id && !item.content
            ? { ...item, content: `请求失败：${message}` }
            : item,
        ),
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }

      if (!controller.signal.aborted) {
        setIsSending(false);
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return {
    sidebarOpen,
    input,
    pendingImages,
    messages,
    conversations,
    activeConversationId,
    messageEndRef,
    fileInputRef,
    hasMessages,
    isSending,
    canSend,
    settingsOpen,
    error,
    startNewConversation,
    sendMessage,
    handleKeyDown,
    handleInputChange,
    openImagePicker,
    handleImageFilesSelected,
    handlePaste,
    removePendingImage,
    toggleSidebar,
    openSettings,
    closeSettings,
    handleConversationClick,
  };
};

export default useAiChat;
