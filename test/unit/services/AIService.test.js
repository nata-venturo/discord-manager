/**
 * @license Discord Manager
 * AIService.test.js - Unit tests for AIService
 *
 * Copyright (c) 2025 - Present Natarizkie
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { AIService } from '../../../src/services/AIService.js';
import { AIServiceError, ValidationError } from '../../../src/errors/index.js';

describe('AIService', () => {
    let aiService;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        aiService = new AIService();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('generateResponse', () => {
        it('should generate response successfully', async () => {
            const model = {
                id: 'gemini-1.5-flash',
                name: 'Gemini 1.5 Flash',
                description: 'You are a helpful AI assistant'
            };
            const content = 'Hello, how are you?';
            const language = 'English';

            // Mock Gemini API response
            const mockResult = {
                response: {
                    text: () => 'I am doing well, thank you!'
                }
            };

            // Stub the Gemini model
            sandbox.stub(aiService, 'getGeminiModel').returns({
                generateContent: sandbox.stub().resolves(mockResult)
            });

            const response = await aiService.generateResponse(model, content, language);

            expect(response).to.be.a('string');
            expect(response).to.equal('I am doing well, thank you!');
        });

        it('should throw ValidationError for empty content', async () => {
            const model = { id: 'test', name: 'Test', description: 'Test model' };

            try {
                await aiService.generateResponse(model, '   ', 'English');
                expect.fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).to.be.instanceOf(ValidationError);
                expect(error.message).to.include('Content cannot be empty');
            }
        });

        it('should throw ValidationError for missing model', async () => {
            try {
                await aiService.generateResponse(null, 'Hello', 'English');
                expect.fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).to.be.instanceOf(ValidationError);
                expect(error.message).to.include('Model is required');
            }
        });

        it('should throw AIServiceError on API failure', async () => {
            const model = {
                id: 'gemini-1.5-flash',
                name: 'Gemini 1.5 Flash',
                description: 'Test'
            };

            // Stub to throw error
            sandbox.stub(aiService, 'getGeminiModel').returns({
                generateContent: sandbox.stub().rejects(new Error('API Error'))
            });

            try {
                await aiService.generateResponse(model, 'Hello', 'English');
                expect.fail('Should have thrown AIServiceError');
            } catch (error) {
                expect(error).to.be.instanceOf(AIServiceError);
                expect(error.message).to.include('Failed to generate AI response');
            }
        });

        it('should handle different languages', async () => {
            const model = {
                id: 'gemini-1.5-flash',
                name: 'Gemini 1.5 Flash',
                description: 'You are helpful'
            };
            const content = 'Halo, apa kabar?';
            const language = 'Indonesian';

            const mockResult = {
                response: {
                    text: () => 'Saya baik, terima kasih!'
                }
            };

            sandbox.stub(aiService, 'getGeminiModel').returns({
                generateContent: sandbox.stub().resolves(mockResult)
            });

            const response = await aiService.generateResponse(model, content, language);

            expect(response).to.equal('Saya baik, terima kasih!');
        });

        it('should truncate very long content', async () => {
            const model = {
                id: 'gemini-1.5-flash',
                name: 'Gemini 1.5 Flash',
                description: 'Test'
            };
            const longContent = 'a'.repeat(10000);
            const language = 'English';

            const mockResult = {
                response: {
                    text: () => 'Response to long content'
                }
            };

            const geminiModel = {
                generateContent: sandbox.stub().resolves(mockResult)
            };
            sandbox.stub(aiService, 'getGeminiModel').returns(geminiModel);

            await aiService.generateResponse(model, longContent, language);

            // Should have truncated the content
            const calledPrompt = geminiModel.generateContent.firstCall.args[0];
            expect(calledPrompt.length).to.be.lessThan(longContent.length + 200);
        });
    });

    describe('buildPrompt', () => {
        it('should build prompt with system description', () => {
            const systemDesc = 'You are a helpful assistant';
            const userContent = 'Hello';
            const language = 'English';

            const prompt = aiService.buildPrompt(systemDesc, userContent, language);

            expect(prompt).to.include(systemDesc);
            expect(prompt).to.include(userContent);
            expect(prompt).to.include(language);
        });

        it('should include language in prompt', () => {
            const prompt = aiService.buildPrompt('Assistant', 'Test', 'Spanish');

            expect(prompt).to.include('Spanish');
        });
    });

    describe('getGeminiModel', () => {
        it('should return Gemini model instance', () => {
            const model = aiService.getGeminiModel('gemini-1.5-flash');

            expect(model).to.exist;
            expect(model).to.have.property('generateContent');
        });

        it('should cache model instances', () => {
            const model1 = aiService.getGeminiModel('gemini-1.5-flash');
            const model2 = aiService.getGeminiModel('gemini-1.5-flash');

            expect(model1).to.equal(model2);
        });
    });
});
