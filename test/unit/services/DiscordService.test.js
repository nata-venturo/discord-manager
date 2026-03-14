/**
 * @license Discord Manager
 * DiscordService.test.js - Unit tests for DiscordService
 *
 * Copyright (c) 2025 - Present Natarizkie
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { DiscordService } from '../../../src/services/DiscordService.js';
import { DiscordAPIError, ValidationError } from '../../../src/errors/index.js';

describe('DiscordService', () => {
    let discordService;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        discordService = new DiscordService();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('initialize', () => {
        it('should successfully initialize with valid token', async () => {
            const token = 'valid.discord.token.here';

            // Mock successful login
            sandbox.stub(discordService.client, 'login').resolves();
            sandbox.stub(discordService.client, 'user').value({ id: '123', tag: 'User#1234' });

            await discordService.initialize(token);

            expect(discordService.client.login.calledOnce).to.be.true;
            expect(discordService.client.login.calledWith(token)).to.be.true;
        });

        it('should throw ValidationError for invalid token', async () => {
            const invalidToken = 'short';

            try {
                await discordService.initialize(invalidToken);
                expect.fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).to.be.instanceOf(ValidationError);
                expect(error.message).to.include('Invalid Discord token');
            }
        });

        it('should throw DiscordAPIError on login failure', async () => {
            const token = 'valid.discord.token.here';
            const loginError = new Error('Invalid token');

            sandbox.stub(discordService.client, 'login').rejects(loginError);

            try {
                await discordService.initialize(token);
                expect.fail('Should have thrown DiscordAPIError');
            } catch (error) {
                expect(error).to.be.instanceOf(DiscordAPIError);
                expect(error.message).to.include('Failed to login');
            }
        });
    });

    describe('getChannel', () => {
        beforeEach(async () => {
            // Initialize service
            sandbox.stub(discordService.client, 'login').resolves();
            sandbox.stub(discordService.client, 'user').value({ id: '123', tag: 'User#1234' });
            await discordService.initialize('valid.token.here');
        });

        it('should return channel from cache if available', async () => {
            const mockChannel = { id: '123', name: 'test-channel', type: 0 };
            discordService.client.channels.cache.get.returns(mockChannel);

            const channel = await discordService.getChannel('123');

            expect(channel).to.equal(mockChannel);
            expect(discordService.client.channels.cache.get.calledWith('123')).to.be.true;
        });

        it('should fetch channel if not in cache', async () => {
            const mockChannel = { id: '456', name: 'fetched-channel', type: 0 };
            discordService.client.channels.cache.get.returns(null);
            discordService.client.channels.fetch.resolves(mockChannel);

            const channel = await discordService.getChannel('456');

            expect(channel).to.equal(mockChannel);
            expect(discordService.client.channels.fetch.calledWith('456')).to.be.true;
        });

        it('should throw ValidationError for invalid channel ID', async () => {
            try {
                await discordService.getChannel('invalid');
                expect.fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).to.be.instanceOf(ValidationError);
                expect(error.message).to.include('Invalid channel ID');
            }
        });

        it('should throw DiscordAPIError if channel not found', async () => {
            discordService.client.channels.cache.get.returns(null);
            discordService.client.channels.fetch.rejects(new Error('Unknown Channel'));

            try {
                await discordService.getChannel('999999999999999999');
                expect.fail('Should have thrown DiscordAPIError');
            } catch (error) {
                expect(error).to.be.instanceOf(DiscordAPIError);
                expect(error.message).to.include('Failed to fetch channel');
            }
        });
    });

    describe('sendMessage', () => {
        let mockChannel;

        beforeEach(async () => {
            // Initialize service
            sandbox.stub(discordService.client, 'login').resolves();
            sandbox.stub(discordService.client, 'user').value({ id: '123', tag: 'User#1234' });
            await discordService.initialize('valid.token.here');

            mockChannel = {
                id: '123',
                send: sandbox.stub().resolves({ id: 'msg123', content: 'Hello' }),
            };
            discordService.client.channels.cache.get.returns(mockChannel);
        });

        it('should send message successfully', async () => {
            const channelId = '123';
            const content = 'Hello, world!';

            const message = await discordService.sendMessage(channelId, content);

            expect(mockChannel.send.calledOnce).to.be.true;
            expect(mockChannel.send.calledWith(content)).to.be.true;
            expect(message.content).to.equal('Hello');
        });

        it('should sanitize message content before sending', async () => {
            const channelId = '123';
            const content = '@everyone Check this out ```code```';

            await discordService.sendMessage(channelId, content);

            const sentContent = mockChannel.send.firstCall.args[0];
            expect(sentContent).to.not.include('```');
            expect(sentContent).to.include('@\u200beveryone');
        });

        it('should throw ValidationError for empty message', async () => {
            try {
                await discordService.sendMessage('123', '   ');
                expect.fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).to.be.instanceOf(ValidationError);
                expect(error.message).to.include('Message content cannot be empty');
            }
        });

        it('should throw DiscordAPIError on send failure', async () => {
            mockChannel.send.rejects(new Error('Missing Permissions'));

            try {
                await discordService.sendMessage('123', 'Hello');
                expect.fail('Should have thrown DiscordAPIError');
            } catch (error) {
                expect(error).to.be.instanceOf(DiscordAPIError);
                expect(error.message).to.include('Failed to send message');
            }
        });
    });

    describe('deleteMessage', () => {
        it('should delete message successfully', async () => {
            const mockMessage = {
                id: 'msg123',
                delete: sandbox.stub().resolves(),
            };

            await discordService.deleteMessage(mockMessage);

            expect(mockMessage.delete.calledOnce).to.be.true;
        });

        it('should throw DiscordAPIError on delete failure', async () => {
            const mockMessage = {
                id: 'msg123',
                delete: sandbox.stub().rejects(new Error('Missing Permissions')),
            };

            try {
                await discordService.deleteMessage(mockMessage);
                expect.fail('Should have thrown DiscordAPIError');
            } catch (error) {
                expect(error).to.be.instanceOf(DiscordAPIError);
                expect(error.message).to.include('Failed to delete message');
            }
        });
    });

    describe('addReaction', () => {
        it('should add reaction successfully', async () => {
            const mockMessage = {
                id: 'msg123',
                react: sandbox.stub().resolves(),
            };
            const emoji = '👍';

            await discordService.addReaction(mockMessage, emoji);

            expect(mockMessage.react.calledOnce).to.be.true;
            expect(mockMessage.react.calledWith(emoji)).to.be.true;
        });

        it('should throw DiscordAPIError on reaction failure', async () => {
            const mockMessage = {
                id: 'msg123',
                react: sandbox.stub().rejects(new Error('Unknown Emoji')),
            };

            try {
                await discordService.addReaction(mockMessage, 'invalid_emoji');
                expect.fail('Should have thrown DiscordAPIError');
            } catch (error) {
                expect(error).to.be.instanceOf(DiscordAPIError);
                expect(error.message).to.include('Failed to add reaction');
            }
        });
    });

    describe('sendTyping', () => {
        let mockChannel;

        beforeEach(async () => {
            // Initialize service
            sandbox.stub(discordService.client, 'login').resolves();
            sandbox.stub(discordService.client, 'user').value({ id: '123', tag: 'User#1234' });
            await discordService.initialize('valid.token.here');

            mockChannel = {
                id: '123',
                sendTyping: sandbox.stub().resolves(),
            };
            discordService.client.channels.cache.get.returns(mockChannel);
        });

        it('should send typing indicator successfully', async () => {
            await discordService.sendTyping('123');

            expect(mockChannel.sendTyping.calledOnce).to.be.true;
        });

        it('should throw DiscordAPIError on typing failure', async () => {
            mockChannel.sendTyping.rejects(new Error('Missing Access'));

            try {
                await discordService.sendTyping('123');
                expect.fail('Should have thrown DiscordAPIError');
            } catch (error) {
                expect(error).to.be.instanceOf(DiscordAPIError);
                expect(error.message).to.include('Failed to send typing indicator');
            }
        });
    });

    describe('replyToMessage', () => {
        it('should reply to message successfully', async () => {
            const mockMessage = {
                id: 'msg123',
                reply: sandbox.stub().resolves({ id: 'reply123', content: 'Reply' }),
            };
            const content = 'This is a reply';

            const reply = await discordService.replyToMessage(mockMessage, content);

            expect(mockMessage.reply.calledOnce).to.be.true;
            expect(mockMessage.reply.calledWith(content)).to.be.true;
            expect(reply.content).to.equal('Reply');
        });

        it('should sanitize reply content', async () => {
            const mockMessage = {
                id: 'msg123',
                reply: sandbox.stub().resolves({ id: 'reply123', content: 'Reply' }),
            };
            const content = '@everyone ```code```';

            await discordService.replyToMessage(mockMessage, content);

            const sentContent = mockMessage.reply.firstCall.args[0];
            expect(sentContent).to.not.include('```');
        });

        it('should throw DiscordAPIError on reply failure', async () => {
            const mockMessage = {
                id: 'msg123',
                reply: sandbox.stub().rejects(new Error('Channel not found')),
            };

            try {
                await discordService.replyToMessage(mockMessage, 'Reply');
                expect.fail('Should have thrown DiscordAPIError');
            } catch (error) {
                expect(error).to.be.instanceOf(DiscordAPIError);
                expect(error.message).to.include('Failed to reply to message');
            }
        });
    });

    describe('getCurrentUser', () => {
        it('should return current user', async () => {
            sandbox.stub(discordService.client, 'login').resolves();
            const mockUser = { id: '123', tag: 'User#1234' };
            sandbox.stub(discordService.client, 'user').value(mockUser);

            await discordService.initialize('valid.token.here');

            const user = discordService.getCurrentUser();
            expect(user).to.equal(mockUser);
        });
    });

    describe('destroy', () => {
        it('should destroy client connection', async () => {
            sandbox.stub(discordService.client, 'login').resolves();
            sandbox.stub(discordService.client, 'user').value({ id: '123', tag: 'User#1234' });
            sandbox.stub(discordService.client, 'destroy').resolves();

            await discordService.initialize('valid.token.here');
            discordService.destroy();

            expect(discordService.client.destroy.calledOnce).to.be.true;
        });
    });
});
