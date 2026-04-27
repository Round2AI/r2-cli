/**
 * 阿里百炼 AI 服务实现
 */

/** 聊天消息 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** 聊天选项 */
export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

/** 阿里百炼配置 */
export interface AlibabaOptions {
  apiKey?: string;
  model?: string;
}

/** 阿里百炼 API 响应 */
interface AlibabaResponse {
  output?: { text: string };
  code?: string;
  message?: string;
}

/** 阿里百炼模型列表响应 */
interface AlibabaModelsResponse {
  output?: { model_list: Array<{ id: string; name: string }> };
  code?: string;
  message?: string;
}

const API_BASE = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation";
const DEFAULT_TIMEOUT = 30000;
const STREAM_TIMEOUT = 120000;

export class AlibabaAIService {
  private apiKey: string;
  private model: string;

  constructor(options: AlibabaOptions = {}) {
    this.apiKey = options.apiKey || process.env.ALIBABA_API_KEY || "";
    this.model = options.model || "qwen-turbo";
    if (!this.apiKey) {
      throw new Error("ALIBABA_API_KEY 未设置，请通过环境变量或构造参数传入");
    }
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
    const response = await this.callApi(messages, options);
    return response;
  }

  async *stream(messages: ChatMessage[], options: ChatOptions = {}): AsyncGenerator<string, void, unknown> {
    const requestBody = {
      model: options.model || this.model,
      input: {
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      },
      parameters: {
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
      },
      stream: true,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/generation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "X-DashScope-Async": "enable",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("无法获取响应流");

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data) as AlibabaResponse;
            if (parsed.output?.text) yield parsed.output.text;
          } catch {
            // 忽略不完整的 JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async listModels(): Promise<Array<{ id: string; name: string }>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
    try {
      const response = await fetch(`${API_BASE}/models`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      });

      const data = (await response.json()) as AlibabaModelsResponse;
      if (data.code) throw new Error(`获取模型列表失败: ${data.message}`);
      return data.output?.model_list || [];
    } finally {
      clearTimeout(timer);
    }
  }

  /** 调用阿里百炼 AI 接口，支持流式和非流式 */
  private async callApi(messages: ChatMessage[], options: ChatOptions): Promise<string> {
    const requestBody = {
      model: options.model || this.model,
      input: {
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      },
      parameters: {
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
      },
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
    try {
      const response = await fetch(`${API_BASE}/generation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "X-DashScope-Async": "enable",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as AlibabaResponse;
      if (data.code) throw new Error(`阿里百炼错误 ${data.code}: ${data.message}`);
      if (!data.output?.text) throw new Error("无效的响应格式");
      return data.output.text;
    } finally {
      clearTimeout(timer);
    }
  }
}
