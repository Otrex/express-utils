import { expect } from 'chai';
import sinon from 'sinon';
import UseNotify, { Notifier, JobQueue } from '../pkg/core/UseNotify';

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

    expect(sender).to.be.an('object');
    expect(send).to.be.a('function');
  });

  it('should call run method when send is called without useEvent option', async () => {
    const { send } = UseNotify({ notifier: mockNotifier, jobQueue: mockJobQueue });
    const testData = { test: 'data' };

    await send(testData);

    expect(mockNotifier.load.calledOnceWith(testData)).to.be.true;
    expect(mockNotifier.compile.calledOnce).to.be.true;
    expect(mockJobQueue.push.calledOnce).to.be.true;
  });

  it('should emit job:send event when send is called with useEvent option', () => {
    const { sender, send } = UseNotify({ notifier: mockNotifier, jobQueue: mockJobQueue, useEvent: true });
    const testData = { test: 'data' };

    const emitSpy = sinon.spy(sender, 'emit');
    send(testData);

    expect(emitSpy.calledOnceWith('job:send', testData)).to.be.true;
  });

  it('should handle errors in run method', async () => {
    mockNotifier.compile = sinon.stub().rejects(new Error('Compile error'));
    const { sender, send } = UseNotify({ notifier: mockNotifier, jobQueue: mockJobQueue });
    const testData = { test: 'data' };

    const emitSpy = sinon.spy(sender, 'emit');
    await send(testData);

    expect(emitSpy.calledOnceWith('job:error', sinon.match({ job: null, error: sinon.match.instanceOf(Error) }))).to.be.true;
  });

  it('should register job in queue with correct properties', async () => {
    const { send } = UseNotify({ notifier: mockNotifier, jobQueue: mockJobQueue });
    const testData = { test: 'data' };

    await send(testData);

    const pushedJob = mockJobQueue.push.getCall(0).args[0];
    expect(pushedJob).to.have.property('id').that.is.a('number');
    expect(pushedJob).to.have.property('isRunning', false);
    expect(pushedJob).to.have.property('action').that.is.a('function');
    expect(pushedJob).to.have.property('onError').that.is.a('function');
    expect(pushedJob).to.have.property('onStart').that.is.a('function');
    expect(pushedJob).to.have.property('onComplete').that.is.a('function');
  });
});
