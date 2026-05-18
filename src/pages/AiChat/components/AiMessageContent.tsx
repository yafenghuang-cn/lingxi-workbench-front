import type React from "react";

type AiMessageContentProps = {
  content: string;
  isStreaming?: boolean;
  placeholder?: string;
  compact?: boolean;
};

const AiMessageContent: React.FC<AiMessageContentProps> = ({
  content,
  isStreaming = false,
  placeholder,
  compact = false,
}) => {
  if (!content.trim()) {
    if (!placeholder) {
      return null;
    }

    return <p className="ai-chat-placeholder">{placeholder}</p>;
  }

  return (
    <div className={compact ? "ai-chat-message ai-chat-message--compact" : "ai-chat-message"}>
      <pre className="ai-chat-message__text">{content}</pre>
      {isStreaming && <span className="ai-chat-message__cursor" aria-hidden />}
    </div>
  );
};

export default AiMessageContent;
