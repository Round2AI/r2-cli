/**
 * AI 服务统一接口
 */

import { AlibabaAIService, type ChatMessage, type ChatOptions } from "./alibaba.js";

export type { ChatMessage, ChatOptions };

export interface AIService {
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;
  stream(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string, void, unknown>;
}

export class MultiAIService implements AIService {
  private alibaba: AlibabaAIService;

  constructor() {
    this.alibaba = new AlibabaAIService();
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    return this.alibaba.chat(messages, options);
  }

  async *stream(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string, void, unknown> {
    yield* this.alibaba.stream(messages, options);
  }
}

/** 全局 AI 服务实例 */
export const aiService = new MultiAIService();
