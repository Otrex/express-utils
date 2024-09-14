import sinon from 'sinon';
import UseNotify, { Notifier, JobQueue, SendNotification } from '../../pkg/core/UseNotify';

describe('UseNotify', () => {
  let mockNotifier: Notifier<any>;
  let mockJobQueue: JobQueue;

  beforeEach(() => {
    mockNotifier = {
      load: sinon.stub().returnsThis(),
      send: sinon.stub().resolves(),
      compile: sinon.stub().resolves('compiled'),
    };

    mockJobQueue = {
      queue: [],
      push: sinon.stub(),
      execute: sinon.stub(),
    };
  });

  it('should create a sender and send function', () => {
    const { sender, send } = UseNotify({ notifier: mockNotifier, jobQueue: mockJobQueue });
    expect(sender).toBeInstanceOf(SendNotification);
    expect(send).toBeInstanceOf(Function);
  });

  it('should emit job:send event when send is called with useEvent option', () => {
    const { sender, send } = UseNotify({ notifier: mockNotifier, jobQueue: mockJobQueue, useEvent: true });
    const testData = { test: 'data' };

    const emitSpy = jest.spyOn(sender, 'emit');
    send(testData);

    expect(emitSpy).toHaveBeenCalledWith('job:send', testData);
  });

  it('should handle errors in run method', async () => {
    mockNotifier.compile = sinon.stub().rejects(new Error('Compile error'));
    const { sender, send } = UseNotify({ notifier: mockNotifier, jobQueue: mockJobQueue });
    const testData = { test: 'data' };

    const emitSpy = jest.spyOn(sender, 'emit');
    await send(testData);

    expect(emitSpy).toHaveBeenCalledWith('job:error', expect.objectContaining({
      job: null,
      error: expect.any(Error)
    }));
  });
});
