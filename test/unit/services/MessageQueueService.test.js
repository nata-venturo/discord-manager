/**
 * @license Discord Manager
 * MessageQueueService.test.js - Unit tests for MessageQueueService
 *
 * Copyright (c) 2025 - Present Natarizkie
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { MessageQueueService } from '../../../src/services/MessageQueueService.js';

describe('MessageQueueService', () => {
    let messageQueue;
    let sandbox;
    let clock;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        clock = sandbox.useFakeTimers();
        messageQueue = new MessageQueueService();
    });

    afterEach(() => {
        messageQueue.clear();
        clock.restore();
        sandbox.restore();
    });

    describe('enqueue', () => {
        it('should add message to queue', () => {
            const message = { id: 'msg1', content: 'Hello' };

            messageQueue.enqueue(message);

            expect(messageQueue.getQueueLength()).to.equal(1);
        });

        it('should add multiple messages', () => {
            messageQueue.enqueue({ id: 'msg1' });
            messageQueue.enqueue({ id: 'msg2' });
            messageQueue.enqueue({ id: 'msg3' });

            expect(messageQueue.getQueueLength()).to.equal(3);
        });

        it('should handle priority messages', () => {
            messageQueue.enqueue({ id: 'msg1', priority: false });
            messageQueue.enqueue({ id: 'msg2', priority: true });

            // Priority message should be processed first
            const queueLength = messageQueue.getQueueLength();
            expect(queueLength).to.equal(2);
        });

        it('should maintain FIFO order for same priority', () => {
            const msg1 = { id: 'msg1', content: 'First' };
            const msg2 = { id: 'msg2', content: 'Second' };
            const msg3 = { id: 'msg3', content: 'Third' };

            messageQueue.enqueue(msg1);
            messageQueue.enqueue(msg2);
            messageQueue.enqueue(msg3);

            expect(messageQueue.getQueueLength()).to.equal(3);
        });
    });

    describe('processNext', () => {
        it('should process next message in queue', async () => {
            const processor = sandbox.stub().resolves();
            messageQueue.setProcessor(processor);

            const message = { id: 'msg1', content: 'Test' };
            messageQueue.enqueue(message);

            await messageQueue.processNext();

            expect(processor.calledOnce).to.be.true;
            expect(processor.calledWith(message)).to.be.true;
            expect(messageQueue.getQueueLength()).to.equal(0);
        });

        it('should do nothing if queue is empty', async () => {
            const processor = sandbox.stub().resolves();
            messageQueue.setProcessor(processor);

            await messageQueue.processNext();

            expect(processor.called).to.be.false;
        });

        it('should handle processor errors gracefully', async () => {
            const processor = sandbox.stub().rejects(new Error('Processing failed'));
            messageQueue.setProcessor(processor);

            const message = { id: 'msg1' };
            messageQueue.enqueue(message);

            // Should not throw
            await messageQueue.processNext();

            expect(messageQueue.getQueueLength()).to.equal(0);
        });

        it('should set processing flag during processing', async () => {
            const processor = sandbox.stub().callsFake(async () => {
                expect(messageQueue.isCurrentlyProcessing()).to.be.true;
            });
            messageQueue.setProcessor(processor);

            const message = { id: 'msg1' };
            messageQueue.enqueue(message);

            await messageQueue.processNext();

            expect(messageQueue.isCurrentlyProcessing()).to.be.false;
        });

        it('should process priority messages first', async () => {
            const processedMessages = [];
            const processor = sandbox.stub().callsFake(async (msg) => {
                processedMessages.push(msg.id);
            });
            messageQueue.setProcessor(processor);

            messageQueue.enqueue({ id: 'msg1', priority: false });
            messageQueue.enqueue({ id: 'msg2', priority: true });
            messageQueue.enqueue({ id: 'msg3', priority: false });

            await messageQueue.processNext();
            await messageQueue.processNext();
            await messageQueue.processNext();

            // Priority message should be first
            expect(processedMessages[0]).to.equal('msg2');
        });
    });

    describe('setProcessor', () => {
        it('should set message processor function', () => {
            const processor = sandbox.stub();

            messageQueue.setProcessor(processor);

            expect(messageQueue.processor).to.equal(processor);
        });

        it('should throw error if processor is not a function', () => {
            expect(() => {
                messageQueue.setProcessor('not a function');
            }).to.throw();
        });
    });

    describe('startAutoProcessing', () => {
        it('should start automatic queue processing', async () => {
            const processor = sandbox.stub().resolves();
            messageQueue.setProcessor(processor);

            messageQueue.enqueue({ id: 'msg1' });
            messageQueue.startAutoProcessing(100);

            // Advance time
            await clock.tickAsync(150);

            expect(processor.called).to.be.true;
        });

        it('should process multiple messages over time', async () => {
            const processor = sandbox.stub().resolves();
            messageQueue.setProcessor(processor);

            messageQueue.enqueue({ id: 'msg1' });
            messageQueue.enqueue({ id: 'msg2' });
            messageQueue.startAutoProcessing(100);

            // Advance time multiple intervals
            await clock.tickAsync(250);

            expect(processor.callCount).to.be.at.least(2);
        });

        it('should stop when stopAutoProcessing is called', async () => {
            const processor = sandbox.stub().resolves();
            messageQueue.setProcessor(processor);

            messageQueue.enqueue({ id: 'msg1' });
            messageQueue.startAutoProcessing(100);

            await clock.tickAsync(150);
            const callCountAfterFirst = processor.callCount;

            messageQueue.stopAutoProcessing();
            messageQueue.enqueue({ id: 'msg2' });

            await clock.tickAsync(200);

            expect(processor.callCount).to.equal(callCountAfterFirst);
        });
    });

    describe('stopAutoProcessing', () => {
        it('should stop automatic processing', async () => {
            const processor = sandbox.stub().resolves();
            messageQueue.setProcessor(processor);

            messageQueue.startAutoProcessing(100);
            messageQueue.stopAutoProcessing();

            messageQueue.enqueue({ id: 'msg1' });
            await clock.tickAsync(200);

            expect(processor.called).to.be.false;
        });

        it('should be safe to call multiple times', () => {
            messageQueue.startAutoProcessing(100);

            expect(() => {
                messageQueue.stopAutoProcessing();
                messageQueue.stopAutoProcessing();
                messageQueue.stopAutoProcessing();
            }).to.not.throw();
        });
    });

    describe('clear', () => {
        it('should clear all messages from queue', () => {
            messageQueue.enqueue({ id: 'msg1' });
            messageQueue.enqueue({ id: 'msg2' });
            messageQueue.enqueue({ id: 'msg3' });

            messageQueue.clear();

            expect(messageQueue.getQueueLength()).to.equal(0);
        });

        it('should stop auto processing', async () => {
            const processor = sandbox.stub().resolves();
            messageQueue.setProcessor(processor);

            messageQueue.startAutoProcessing(100);
            messageQueue.enqueue({ id: 'msg1' });

            messageQueue.clear();

            await clock.tickAsync(200);

            expect(processor.called).to.be.false;
        });
    });

    describe('getQueueLength', () => {
        it('should return correct queue length', () => {
            expect(messageQueue.getQueueLength()).to.equal(0);

            messageQueue.enqueue({ id: 'msg1' });
            expect(messageQueue.getQueueLength()).to.equal(1);

            messageQueue.enqueue({ id: 'msg2' });
            expect(messageQueue.getQueueLength()).to.equal(2);
        });

        it('should update after processing', async () => {
            const processor = sandbox.stub().resolves();
            messageQueue.setProcessor(processor);

            messageQueue.enqueue({ id: 'msg1' });
            messageQueue.enqueue({ id: 'msg2' });

            expect(messageQueue.getQueueLength()).to.equal(2);

            await messageQueue.processNext();

            expect(messageQueue.getQueueLength()).to.equal(1);
        });
    });

    describe('isCurrentlyProcessing', () => {
        it('should return false when not processing', () => {
            expect(messageQueue.isCurrentlyProcessing()).to.be.false;
        });

        it('should return true during processing', async () => {
            let processingState = false;

            const processor = sandbox.stub().callsFake(async () => {
                processingState = messageQueue.isCurrentlyProcessing();
                await new Promise(resolve => setTimeout(resolve, 10));
            });

            messageQueue.setProcessor(processor);
            messageQueue.enqueue({ id: 'msg1' });

            await messageQueue.processNext();

            expect(processingState).to.be.true;
            expect(messageQueue.isCurrentlyProcessing()).to.be.false;
        });
    });
});
