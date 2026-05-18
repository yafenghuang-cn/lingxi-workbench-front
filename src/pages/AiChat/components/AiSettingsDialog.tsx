import { SaveOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Space, Typography } from "antd";
import type React from "react";
import { useEffect, useState } from "react";

import {
  deleteApiKeyConfig,
  fetchApiKeyConfig,
  saveApiKeyConfig,
  type WebAiApiKeyConfig,
} from "@/api/ai";
import { getAccessToken } from "@/lib/auth-token";

type AiSettingsDialogProps = {
  open: boolean;
  onClose: () => void;
};

type FormSettings = {
  requestUrl: string;
  model: string;
  apiKeyToken: string;
};

const defaultFormSettings: FormSettings = {
  requestUrl: "",
  model: "",
  apiKeyToken: "",
};

const AiSettingsDialog: React.FC<AiSettingsDialogProps> = ({ open, onClose }) => {
  const [settings, setSettings] = useState<FormSettings>(defaultFormSettings);
  const [remoteConfig, setRemoteConfig] = useState<WebAiApiKeyConfig | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const configured = Boolean(
    settings.requestUrl.trim() &&
      (settings.model.trim() || remoteConfig?.model) &&
      (settings.apiKeyToken.trim() || remoteConfig?.hasApiKeyToken),
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const loadConfig = async () => {
      setLoading(true);
      setError("");
      setSaved(false);

      try {
        if (!getAccessToken()) {
          setRemoteConfig(null);
          setSettings(defaultFormSettings);
          setError("请先登录后再配置 AI API Key");
          return;
        }

        const config = await fetchApiKeyConfig();

        if (cancelled) {
          return;
        }

        setRemoteConfig(config);
        setSettings({
          requestUrl: config.requestUrl,
          model: config.model,
          apiKeyToken: "",
        });
      } catch (exception) {
        if (!cancelled) {
          setError(exception instanceof Error ? exception.message : "加载 AI 配置失败");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSave = async () => {
    const requestUrl = settings.requestUrl.trim();
    const model = settings.model.trim() || remoteConfig?.model?.trim() || "";
    const apiKeyToken = settings.apiKeyToken.trim();

    if (!requestUrl) {
      setError("请填写请求 URL");
      return;
    }

    if (!model) {
      setError("请填写模型名称");
      return;
    }

    if (!apiKeyToken && !remoteConfig?.hasApiKeyToken) {
      setError("请填写 API Key Token");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const config = await saveApiKeyConfig(requestUrl, model, apiKeyToken || undefined);
      setRemoteConfig(config);
      setSettings({
        requestUrl: config.requestUrl,
        model: config.model,
        apiKeyToken: "",
      });
      setSaved(true);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "保存配置失败");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    setError("");

    try {
      const config = await deleteApiKeyConfig();
      setRemoteConfig(config);
      setSettings(defaultFormSettings);
      setSaved(false);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "清除配置失败");
    } finally {
      setSaving(false);
    }
  };

  const apiKeyPlaceholder = remoteConfig?.hasApiKeyToken
    ? `已配置 ${remoteConfig.apiKeyTokenMasked}，输入新值可覆盖`
    : "输入 API Key Token";

  return (
    <Modal destroyOnHidden open={open} title="AI 配置" width={520} onCancel={onClose} footer={null}>
      {loading ? (
        <Typography.Text type="secondary">正在加载配置...</Typography.Text>
      ) : (
        <Form layout="vertical" requiredMark={false}>
          <div className="ai-settings-status">
            <Typography.Text type="secondary">自定义 API Key</Typography.Text>
            <Typography.Text type={configured ? "success" : "secondary"}>
              {configured ? "已配置" : "未配置"}
            </Typography.Text>
            {remoteConfig?.updatedAt && (
              <Typography.Text className="ai-settings-updated" type="secondary">
                更新于 {new Date(remoteConfig.updatedAt).toLocaleString()}
              </Typography.Text>
            )}
          </div>

          <Form.Item label="请求 URL">
            <Input
              disabled={saving}
              placeholder="https://api.example.com/v1/chat/completions"
              type="url"
              value={settings.requestUrl}
              onChange={(event) => {
                setSaved(false);
                setError("");
                setSettings((current) => ({ ...current, requestUrl: event.target.value }));
              }}
            />
          </Form.Item>

          <Form.Item label="模型名称">
            <Input
              disabled={saving}
              placeholder="模型 ID"
              value={settings.model}
              onChange={(event) => {
                setSaved(false);
                setError("");
                setSettings((current) => ({ ...current, model: event.target.value }));
              }}
            />
          </Form.Item>

          <Form.Item label="API Key Token">
            <Space.Compact className="ai-settings-api-key">
              <Input.Password
                disabled={saving}
                placeholder={apiKeyPlaceholder}
                value={settings.apiKeyToken}
                onChange={(event) => {
                  setSaved(false);
                  setError("");
                  setSettings((current) => ({ ...current, apiKeyToken: event.target.value }));
                }}
              />
              <Button icon={<SaveOutlined />} loading={saving} type="primary" onClick={() => void handleSave()}>
                保存
              </Button>
            </Space.Compact>
          </Form.Item>

          <Space wrap>
            {remoteConfig?.hasApiKeyToken && (
              <Button danger loading={saving} onClick={() => void handleClear()}>
                清除配置
              </Button>
            )}
            {saved && <Typography.Text type="success">配置已保存到服务端</Typography.Text>}
            {error && <Typography.Text type="danger">{error}</Typography.Text>}
          </Space>
        </Form>
      )}
    </Modal>
  );
};

export default AiSettingsDialog;
