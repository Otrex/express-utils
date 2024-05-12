import { ITemplateEngine } from "../types";

export interface TemplateEngine {
  getTemplate: (id: string | number | symbol) => Promise<string> | string;
  compile: <T extends Record<string, any>>(tstring: string, data: T) => Promise<string>
}

export default class Mail<T extends Record<string, any>> {
  static templateEngine: TemplateEngine;
  private message: string;

  constructor(
    private templateId: string,
    private data: T,
    private to: string,
    private from?: string,
    private subject?: string,
    private attachments?: string[],

  ) {

  }

  static setTemplateEngine<Eng extends TemplateEngine>(engine: Eng) {
    Mail.templateEngine = engine
  }

  async getMessage() {
    this.message = await Mail.templateEngine.compile(
      await Mail.templateEngine.getTemplate(this.templateId),
      this.data
    );

    return this
  }

  toString() {
    return this.message
  }
}