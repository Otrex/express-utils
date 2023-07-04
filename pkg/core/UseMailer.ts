import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { IMail, ISender, ITemplateEngine, MailerOptions } from "../types";

const TEMPLATE_EXT = "tmpl"

class StringEngine implements ITemplateEngine {
  templates: string[];
  templatePath: string;

  render(mail: IMail) {
    const data = mail.data;
    if (data) {
      Object.entries(data).map(([key, value]) => {
        mail.templateContent = this.replaceAll(mail.templateContent, `{{ ${key} }}`, value);
        mail.templateContent = this.replaceAll(mail.templateContent, `{{${key}}}`, value);
        mail.templateContent = this.replaceAll(mail.templateContent, `{{${key}}}`, value);
        mail.templateContent = this.replaceAll(mail.templateContent, `{{${key} }}`, value);
      })
    }
  }

  replaceAll(string: string, oldSubstring: string, newSubstring: string) {
    return string.split(oldSubstring).join(newSubstring);
  }

  replaceAllFromArray(string: string, replacements: string[][]) {
    return replacements.reduce(
      (acc, [search, replace]) => acc.replace(new RegExp(search, "g"), replace),
      string
    );
  }

  findAllOccurrences(string: string, regex: RegExp) {
    const matches = Array.from(string.matchAll(regex), (match) => match[0]);
    return matches;
  }

  getTemplate(template: string) {
    if (!template) throw new Error("No template entered for template: '" + template + "'");
    const $template = this.templates.find(t => t.includes(`${template}.${TEMPLATE_EXT}`));
    
    if (!$template) throw new Error(`Template, "${template}" not found`);
    return readFileSync(join(this.templatePath, $template)).toString();
  }

  compile(template: string): string {
    try {
      const $template = this.getTemplate(template);
      const componentRegex = /{%[^%}]*%}/g;
      const components = this.findAllOccurrences($template, componentRegex);
      const componentsPath = components.map((e) => e.split("%")[1].trim());

      const replacements = componentsPath.map((e, idx) => {
        return [
          components[idx],
          this.getTemplate(e),
        ];
      });

      return this.replaceAllFromArray($template, replacements);
    } catch (error: any) {
      throw error;
    }
  }
}

class Mail implements IMail {
  static sender: ISender;
  static templateEngine: ITemplateEngine;

  public templateContent: string;

  constructor(public email: string, public template: string, public subject?: string, public data?: Record<string, any>) {}

  static create(options: { template: string; email: string; subject?: string, data?: Record<string, any>}) {
    return new Mail(options.email, options.template, options.subject, options.data)
      .getTemplate();
  }

  static setup(opts: MailerOptions & { templates: string[] }) {
    Mail.sender = opts.sender;
    Mail.templateEngine = opts.templateEngine!;
    Mail.templateEngine.templates = opts.templates;
    Mail.templateEngine.templatePath = opts.templatePath;
  }

  getTemplate() {
    if (!this.template) throw new Error("No template selected");
    this.templateContent = Mail.templateEngine.compile(this.template);
    return this;
  }

  async send() {
    Mail.templateEngine.render(this);
    return Mail.sender.send(this);
  }
}

const defaultOptions = {
  templateEngine: new StringEngine(),
};

export default (options: MailerOptions) => {
  const $options = { ...defaultOptions, ...options };
  const templates = readdirSync($options.templatePath, "utf-8");

  Mail.setup({
    ...$options,
    templates,
  });

  return {
    Mail,
  };
};
