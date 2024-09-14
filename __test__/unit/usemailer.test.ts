
import { StringEngine } from '../../pkg/core/UseMailer';
import UseMailer from '../../pkg/core/UseMailer';
import { IMail, ISender } from '../../pkg/types';
import { join } from 'path';
import { promises as fs } from 'fs';

describe('UseMailer', () => {
  let templatePath: string;
  let mockSender: ISender;

  beforeAll(async () => {
    templatePath = join(__dirname, '..', '..', 'templates');
    await fs.mkdir(templatePath, { recursive: true });
    await fs.writeFile(join(templatePath, 'test.tmpl'), 'Hello {{ name }}!');
    await fs.writeFile(join(templatePath, 'component.tmpl'), 'Component content');
    await fs.writeFile(join(templatePath, 'with-component.tmpl'), 'Main content {% component %}');

    mockSender = {
      send: jest.fn().mockResolvedValue(undefined),
    };
  });

  afterAll(async () => {
    await fs.rm(templatePath, { recursive: true, force: true });
  });

  it('should setup mailer correctly', () => {
    const { Mail } = UseMailer({ templatePath, sender: mockSender });
    expect(Mail).toBeDefined();
  });

  it('should compile and render a simple template', async () => {
    const { Mail } = UseMailer({ templatePath, sender: mockSender });
    const mail = Mail.create({ template: 'test', email: 'test@example.com', data: { name: 'John' } });
    await mail.send();

    expect(mockSender.send).toHaveBeenCalledWith(expect.objectContaining({
      templateContent: 'Hello John!',
    }));
  });

  it('should compile and render a template with component', async () => {
    const { Mail } = UseMailer({ templatePath, sender: mockSender });
    const mail = Mail.create({ template: 'with-component', email: 'test@example.com' });
    await mail.send();

    expect(mockSender.send).toHaveBeenCalledWith(expect.objectContaining({
      templateContent: 'Main content Component content',
    }));
  });

  it('should throw an error for non-existent template', async () => {
    const { Mail } = UseMailer({ templatePath, sender: mockSender });
    const mail = Mail.create({ template: 'non-existent', email: 'test@example.com' });
    await expect(mail.send()).rejects.toThrow('Template, "non-existent" not found');
  });

  describe('StringEngine', () => {
    let engine: StringEngine;

    beforeEach(() => {
      engine = new StringEngine();
    });

    it('should replace all occurrences in a string', () => {
      const result = engine.replaceAll('Hello {{name}}! How are you, {{name}}?', '{{name}}', 'John');
      expect(result).toBe('Hello John! How are you, John?');
    });

    it('should find all occurrences matching a regex', () => {
      const result = engine.findAllOccurrences('Hello {%component1%} and {%component2%}', /{%[^%}]*%}/g);
      expect(result).toEqual(['{%component1%}', '{%component2%}']);
    });
  });
});
