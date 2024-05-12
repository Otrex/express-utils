import { Mail, useNotify } from "../pkg";
import { StringEngine } from "../pkg/core/UseMailer";
import { Job, JobQueue, Notifier } from "../pkg/core/UseNotify";

const temps: Record<string, string> = {
  "obi": "Obi is a {{gender}}"
};

Mail.setTemplateEngine({
  async getTemplate(id) {
    return temps[id as string]
  },
  async compile(template, data) {
    Object.entries(data).forEach(([k, v]) => {
      template = template.replace(`{{${k}}}`, v)
    })
    return template
  }
});

class MailNotifier<T extends Mail<any>> implements Notifier<T> {
  private mail: T;

  load(data: T) {
    this.mail = data;

    return this;
  }
  async send() {
    await new Promise((resolve) => {
      setTimeout(resolve, 5000)
    });

    console.log("working", this.mail.toString());

  }
  async compile() {
    return (await this.mail.getMessage()).toString()
  }
}

class MailJobQueue implements JobQueue {
  queue: Job[] = [];
  push(job: Job) {
    this.queue.push(job);
    if (!this.queue.find(e => e.isRunning)) {
      this.execute();
    }
  };
  async execute() {
    const cjob = this.queue[0];
    if (!cjob) return;

    cjob.onStart && cjob.onStart(cjob);
    cjob.isRunning = true;

    const result = await cjob.action();
    cjob.onComplete && cjob.onComplete(cjob, result);

    this.queue.shift();
    this.execute();
  };
}

const notify = useNotify({
  notifier: new MailNotifier(),
  jobQueue: new MailJobQueue()
})

notify.sender.addListener("job:completed", (...args) => {
  console.log(args[0].job.id);
  console.count()
})

console.time('log')
notify.send(new Mail("obi", { gender: "male" }, "obisiket@gmail.com"))
console.timeLog("log")

console.log("Hello")
