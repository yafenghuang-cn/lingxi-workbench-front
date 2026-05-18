import { uploadChatImage } from "@/api/ai";
import type { ChatContentPart, WebAiUploadedFile } from "@/types/ai-chat";

export const CHAT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/bmp";

export const CHAT_IMAGE_MAX_COUNT = 6;
export const CHAT_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const CHAT_IMAGE_MAX_TOTAL_BYTES = 45 * 1024 * 1024;

export type PendingChatImage = {
  id: string;
  file: File;
  previewUrl: string;
};

export const createPendingChatImage = (file: File): PendingChatImage => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  file,
  previewUrl: URL.createObjectURL(file),
});

export const revokePendingChatImage = (image: PendingChatImage) => {
  URL.revokeObjectURL(image.previewUrl);
};

export const validateChatImageFile = (file: File): string | null => {
  if (!file.type.startsWith("image/")) {
    return "仅支持上传图片文件";
  }

  if (file.size > CHAT_IMAGE_MAX_BYTES) {
    return `单张图片不能超过 ${Math.round(CHAT_IMAGE_MAX_BYTES / 1024 / 1024)}MB`;
  }

  return null;
};

export const extractImagesFromClipboard = (clipboardData: DataTransfer | null): File[] => {
  if (!clipboardData) {
    return [];
  }

  const files: File[] = [];

  for (let index = 0; index < clipboardData.items.length; index += 1) {
    const item = clipboardData.items[index];

    if (item.kind !== "file" || !item.type.startsWith("image/")) {
      continue;
    }

    const file = item.getAsFile();

    if (!file) {
      continue;
    }

    const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
    const name =
      file.name && !file.name.startsWith("image.")
        ? file.name
        : `paste-${Date.now()}-${index}.${extension}`;

    files.push(file.name === name ? file : new File([file], name, { type: file.type }));
  }

  if (files.length === 0) {
    for (const file of Array.from(clipboardData.files)) {
      if (file.type.startsWith("image/")) {
        files.push(file);
      }
    }
  }

  return files;
};

export const validateChatImageBatch = (files: File[], existingCount: number): string | null => {
  if (existingCount + files.length > CHAT_IMAGE_MAX_COUNT) {
    return `最多上传 ${CHAT_IMAGE_MAX_COUNT} 张图片`;
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  if (totalBytes > CHAT_IMAGE_MAX_TOTAL_BYTES) {
    return "单次图片总大小不能超过 45MB";
  }

  for (const file of files) {
    const error = validateChatImageFile(file);

    if (error) {
      return error;
    }
  }

  return null;
};

const uploadedFileToContentPart = (uploaded: WebAiUploadedFile): ChatContentPart => {
  if (uploaded.url?.trim()) {
    return {
      type: "image_url",
      image_url: uploaded.url.trim(),
    };
  }

  throw new Error("上传响应缺少图片地址");
};

export const resolveImageContentParts = async (
  images: PendingChatImage[],
): Promise<ChatContentPart[]> => {
  return Promise.all(
    images.map(async (image) => {
      const uploaded = await uploadChatImage(image.file);
      return uploadedFileToContentPart(uploaded);
    }),
  );
};
