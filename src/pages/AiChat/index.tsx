import {
  CloseOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PictureOutlined,
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Button, Typography } from "antd";
import classNames from "classnames/bind";
import type React from "react";

import AiMessageContent from "@/pages/AiChat/components/AiMessageContent";
import AiSettingsDialog from "@/pages/AiChat/components/AiSettingsDialog";
import useAiChat from "@/pages/AiChat/hooks/useAiChat";
import { CHAT_IMAGE_ACCEPT } from "@/lib/ai-chat-image";

import styles from "./AiChat.module.scss";

const cx = classNames.bind(styles);

const starterPrompts = ["帮我梳理本周工作重点", "写一份接口联调清单", "总结这段业务需求"];

const AiChatPage: React.FC = () => {
  const {
    sidebarOpen,
    input,
    pendingImages,
    messages,
    conversations,
    activeConversationId,
    hasMessages,
    isSending,
    canSend,
    settingsOpen,
    error,
    messageEndRef,
    fileInputRef,
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
  } = useAiChat();

  return (
    <div className={cx("ai-chat")}>
      <div className={cx("ai-chat__body")}>
        <aside className={cx("ai-chat__sidebar", { "ai-chat__sidebar--collapsed": !sidebarOpen })}>
          <div className={cx("ai-chat__sidebar-header")}>
            <Button
              block
              className={cx("ai-chat__new-btn")}
              icon={<PlusOutlined />}
              type="primary"
              onClick={startNewConversation}
            >
              新建对话
            </Button>
          </div>

          <nav className={cx("ai-chat__conversation-list")}>
            {conversations.map((conversation) => {
              const active = conversation.id === activeConversationId;

              return (
                <button
                  key={conversation.id}
                  className={cx("ai-chat__conversation-item", {
                    "ai-chat__conversation-item--active": active,
                  })}
                  type="button"
                  onClick={() => handleConversationClick(conversation.id)}
                >
                  <span className={cx("ai-chat__conversation-title")}>{conversation.title}</span>
                  <span className={cx("ai-chat__conversation-time")}>{conversation.updatedAt}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className={cx("ai-chat__main")}>
          <header className={cx("ai-chat__toolbar")}>
            <div className={cx("ai-chat__toolbar-left")}>
              <Button
                aria-label={sidebarOpen ? "收起侧边栏" : "展开侧边栏"}
                icon={sidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                type="text"
                onClick={toggleSidebar}
              />
              <h1 className={cx("ai-chat__toolbar-title")}>AI 对话</h1>
            </div>
            <div className={cx("ai-chat__toolbar-actions")}>
              <Button aria-label="AI 配置" icon={<SettingOutlined />} type="text" onClick={openSettings} />
            </div>
          </header>

          <div className={cx("ai-chat__messages")}>
            {hasMessages ? (
              <div className={cx("ai-chat__messages-inner")}>
                {messages.map((message, index) => {
                  const isUser = message.role === "user";
                  const isStreamingAssistant =
                    !isUser && isSending && index === messages.length - 1;

                  return (
                    <div
                      key={message.id}
                      className={cx("ai-chat__row", { "ai-chat__row--user": isUser })}
                    >
                      {!isUser && (
                        <span className={cx("ai-chat__avatar")}>
                          <RobotOutlined />
                        </span>
                      )}
                      <article
                        className={cx("ai-chat__bubble", {
                          "ai-chat__bubble--user": isUser,
                          "ai-chat__bubble--assistant": !isUser,
                        })}
                      >
                        {isUser && message.images && message.images.length > 0 && (
                          <div
                            className={cx("ai-chat__images", {
                              "ai-chat__images--multi": message.images.length > 1,
                            })}
                          >
                            {message.images.map((image) => (
                              <img
                                key={image.url ?? image.previewUrl}
                                alt="用户上传的图片"
                                className={cx("ai-chat__image")}
                                src={image.url ?? image.previewUrl}
                              />
                            ))}
                          </div>
                        )}
                        {!isUser && message.reasoning && (
                          <details className={cx("ai-chat__reasoning")}>
                            <summary>思考过程</summary>
                            <AiMessageContent compact content={message.reasoning} />
                          </details>
                        )}
                        {isUser ? (
                          message.content && (
                            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{message.content}</p>
                          )
                        ) : (
                          <AiMessageContent
                            content={message.content}
                            isStreaming={isStreamingAssistant}
                            placeholder={
                              message.reasoning ? undefined : "正在生成回复..."
                            }
                          />
                        )}
                      </article>
                    </div>
                  );
                })}
                <div ref={messageEndRef} />
              </div>
            ) : (
              <div className={cx("ai-chat__empty")}>
                <div>
                  <div className={cx("ai-chat__empty-icon")}>
                    <RobotOutlined />
                  </div>
                  <Typography.Title level={4} style={{ marginBottom: 8 }}>
                    开始新对话
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    发送消息前请先在设置中配置 AI API Key
                  </Typography.Text>
                  <div className={cx("ai-chat__prompts")}>
                    {starterPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        className={cx("ai-chat__prompt")}
                        type="button"
                        onClick={() => handleInputChange(prompt)}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <footer className={cx("ai-chat__composer")}>
            <input
              ref={fileInputRef}
              accept={CHAT_IMAGE_ACCEPT}
              style={{ display: "none" }}
              multiple
              type="file"
              onChange={handleImageFilesSelected}
            />

            {pendingImages.length > 0 && (
              <div className={cx("ai-chat__pending-images")}>
                {pendingImages.map((image) => (
                  <div key={image.id} className={cx("ai-chat__pending-image")}>
                    <img alt="待发送图片" src={image.previewUrl} />
                    <button
                      aria-label="移除图片"
                      className={cx("ai-chat__pending-remove")}
                      type="button"
                      onClick={() => removePendingImage(image.id)}
                    >
                      <CloseOutlined />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={cx("ai-chat__input-row")}>
              <Button
                aria-label="上传图片"
                disabled={isSending}
                icon={<PictureOutlined />}
                type="text"
                onClick={openImagePicker}
              />
              <textarea
                className={cx("ai-chat__textarea")}
                placeholder={
                  isSending
                    ? "正在等待回复..."
                    : "输入消息，或粘贴/上传图片（Enter 发送，Shift+Enter 换行）"
                }
                rows={1}
                value={input}
                onChange={(event) => handleInputChange(event.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
              />
              <Button
                aria-label="发送"
                disabled={!canSend}
                icon={<SendOutlined />}
                type="primary"
                onClick={() => void sendMessage()}
              />
            </div>

            {error && <p className={cx("ai-chat__error")}>{error}</p>}
          </footer>
        </section>
      </div>

      <AiSettingsDialog open={settingsOpen} onClose={closeSettings} />
    </div>
  );
};

export default AiChatPage;
