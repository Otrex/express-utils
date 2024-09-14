import EventEmitter from "events"

export interface Notifier<T, Res = any> {
  load: (data: T) => this;
  send: () => Promise<Res>
  compile: () => Promise<string> | string
}

export interface Job<T = any> {
  isRunning?: boolean,
  id: string | number | Symbol,
  action: () => Promise<T> | T,
  onError?: (j: Job, error: any) => void
  onComplete?: (j: Job, result: T) => void
  onStart?: (j: Job) => void
}

export interface JobQueue {
  queue: Job[];
  push: (job: Job) => void
  execute: () => Promise<void> | void
}


export class SendNotification<T, M extends Notifier<any>, J extends JobQueue> extends EventEmitter {
  private notification: M;
  private jobQueue: J;

  constructor(notification: M, jobQueue: J) {
    super()
    this.notification = notification;
    this.jobQueue = jobQueue;
    this.registerListeners();
  }

  registerListeners() {
    this.addListener("job:send", async (data: T) => {
      await this.run(data);
    });
  }

  async run(data: T) {
    try {

      await this.notification
        .load(data)
        .compile();

      this.jobQueue.push({
        id: Date.now() * Math.random() * 1000,
        isRunning: false,
        action: async () => {
          await this.notification.send()
        },
        onError: (job, error) => {
          this.emit("job:error", { job, error })
        },
        onStart: (job) => {
          this.emit("job:started", { job });
        },
        onComplete: (job, result) => {
          this.emit("job:completed", { job, result })
        },
      })

      return this;
    } catch (error) {
      this.emit("job:error", { job: null, error })
    }
  }
}

export interface NotificationOptions<T> {
  notifier: Notifier<T>,
  jobQueue: JobQueue,
  useEvent?: boolean
}

export default <T>(options: NotificationOptions<T>) => {
  const sender = new SendNotification(
    options.notifier,
    options.jobQueue
  );

  const send = (data: T) => {
    if (options.useEvent) {
      sender.emit("job:send", data);
    } else {
      sender.run(data);
    }
  }

  return {
    sender,
    send
  }
}