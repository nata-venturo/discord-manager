/**
 * @license Discord Manager
 * ConfigRepository.test.js - Unit tests for ConfigRepository
 *
 * Copyright (c) 2025 - Present Natarizkie
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { ConfigRepository } from '../../../src/repositories/ConfigRepository.js';
import { FileIOError } from '../../../src/errors/index.js';

describe('ConfigRepository', () => {
    let configRepo;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        configRepo = new ConfigRepository();
    });

    afterEach(() => {
        sandbox.restore();
        // Clear cache
        configRepo.cache.clear();
    });

    describe('getAIModels', () => {
        it('should load AI models from file', async () => {
            const mockModels = [
                { id: 'model1', name: 'Model 1', description: 'Test model 1' },
                { id: 'model2', name: 'Model 2', description: 'Test model 2' },
            ];

            sandbox.stub(configRepo, 'loadFileJson').resolves(mockModels);

            const models = await configRepo.getAIModels();

            expect(models).to.deep.equal(mockModels);
            expect(models).to.have.lengthOf(2);
        });

        it('should cache AI models', async () => {
            const mockModels = [{ id: 'model1', name: 'Model 1' }];

            const loadStub = sandbox.stub(configRepo, 'loadFileJson').resolves(mockModels);

            // First call
            await configRepo.getAIModels();

            // Second call (should use cache)
            await configRepo.getAIModels();

            expect(loadStub.calledOnce).to.be.true;
        });

        it('should throw FileIOError on load failure', async () => {
            sandbox.stub(configRepo, 'loadFileJson').rejects(new Error('File not found'));

            try {
                await configRepo.getAIModels();
                expect.fail('Should have thrown FileIOError');
            } catch (error) {
                expect(error).to.be.instanceOf(FileIOError);
                expect(error.message).to.include('Failed to load AI models');
            }
        });

        it('should validate model structure', async () => {
            const mockModels = [{ id: 'model1', name: 'Model 1', description: 'Test' }];

            sandbox.stub(configRepo, 'loadFileJson').resolves(mockModels);

            const models = await configRepo.getAIModels();

            models.forEach((model) => {
                expect(model).to.have.property('id');
                expect(model).to.have.property('name');
                expect(model).to.have.property('description');
            });
        });
    });

    describe('getLanguages', () => {
        it('should load languages from file', async () => {
            const mockLanguages = [
                { id: 'en', name: 'English', codes: ['en'] },
                { id: 'id', name: 'Indonesian', codes: ['id'] },
            ];

            sandbox.stub(configRepo, 'loadFileJson').resolves(mockLanguages);

            const languages = await configRepo.getLanguages();

            expect(languages).to.deep.equal(mockLanguages);
            expect(languages).to.have.lengthOf(2);
        });

        it('should cache languages', async () => {
            const mockLanguages = [{ id: 'en', name: 'English', codes: ['en'] }];

            const loadStub = sandbox.stub(configRepo, 'loadFileJson').resolves(mockLanguages);

            // First call
            await configRepo.getLanguages();

            // Second call (should use cache)
            await configRepo.getLanguages();

            expect(loadStub.calledOnce).to.be.true;
        });

        it('should throw FileIOError on load failure', async () => {
            sandbox.stub(configRepo, 'loadFileJson').rejects(new Error('File not found'));

            try {
                await configRepo.getLanguages();
                expect.fail('Should have thrown FileIOError');
            } catch (error) {
                expect(error).to.be.instanceOf(FileIOError);
                expect(error.message).to.include('Failed to load languages');
            }
        });

        it('should validate language structure', async () => {
            const mockLanguages = [{ id: 'en', name: 'English', codes: ['en'] }];

            sandbox.stub(configRepo, 'loadFileJson').resolves(mockLanguages);

            const languages = await configRepo.getLanguages();

            languages.forEach((lang) => {
                expect(lang).to.have.property('id');
                expect(lang).to.have.property('name');
                expect(lang).to.have.property('codes');
                expect(lang.codes).to.be.an('array');
            });
        });
    });

    describe('getBadWords', () => {
        it('should load bad words configuration', async () => {
            const mockBadWords = {
                languages: ['en', 'id'],
                words: ['badword1', 'badword2'],
            };

            sandbox.stub(configRepo, 'loadFileJson').resolves(mockBadWords);

            const badWords = await configRepo.getBadWords();

            expect(badWords).to.deep.equal(mockBadWords);
            expect(badWords.languages).to.be.an('array');
            expect(badWords.words).to.be.an('array');
        });

        it('should cache bad words', async () => {
            const mockBadWords = { languages: ['en'], words: ['badword'] };

            const loadStub = sandbox.stub(configRepo, 'loadFileJson').resolves(mockBadWords);

            // First call
            await configRepo.getBadWords();

            // Second call (should use cache)
            await configRepo.getBadWords();

            expect(loadStub.calledOnce).to.be.true;
        });

        it('should throw FileIOError on load failure', async () => {
            sandbox.stub(configRepo, 'loadFileJson').rejects(new Error('File not found'));

            try {
                await configRepo.getBadWords();
                expect.fail('Should have thrown FileIOError');
            } catch (error) {
                expect(error).to.be.instanceOf(FileIOError);
                expect(error.message).to.include('Failed to load bad words');
            }
        });
    });

    describe('getQuotes', () => {
        it('should load quotes from file', async () => {
            const mockQuotes = [
                { text: 'Quote 1', author: 'Author 1' },
                { text: 'Quote 2', author: 'Author 2' },
            ];

            sandbox.stub(configRepo, 'loadFileJson').resolves(mockQuotes);

            const quotes = await configRepo.getQuotes();

            expect(quotes).to.deep.equal(mockQuotes);
            expect(quotes).to.have.lengthOf(2);
        });

        it('should cache quotes', async () => {
            const mockQuotes = [{ text: 'Quote', author: 'Author' }];

            const loadStub = sandbox.stub(configRepo, 'loadFileJson').resolves(mockQuotes);

            // First call
            await configRepo.getQuotes();

            // Second call (should use cache)
            await configRepo.getQuotes();

            expect(loadStub.calledOnce).to.be.true;
        });

        it('should throw FileIOError on load failure', async () => {
            sandbox.stub(configRepo, 'loadFileJson').rejects(new Error('File not found'));

            try {
                await configRepo.getQuotes();
                expect.fail('Should have thrown FileIOError');
            } catch (error) {
                expect(error).to.be.instanceOf(FileIOError);
                expect(error.message).to.include('Failed to load quotes');
            }
        });

        it('should validate quote structure', async () => {
            const mockQuotes = [{ text: 'Quote 1', author: 'Author 1' }];

            sandbox.stub(configRepo, 'loadFileJson').resolves(mockQuotes);

            const quotes = await configRepo.getQuotes();

            quotes.forEach((quote) => {
                expect(quote).to.have.property('text');
                expect(quote).to.have.property('author');
            });
        });
    });

    describe('getAIModelById', () => {
        it('should return model by ID', async () => {
            const mockModels = [
                { id: 'model1', name: 'Model 1', description: 'Test 1' },
                { id: 'model2', name: 'Model 2', description: 'Test 2' },
            ];

            sandbox.stub(configRepo, 'loadFileJson').resolves(mockModels);

            const model = await configRepo.getAIModelById('model1');

            expect(model).to.deep.equal(mockModels[0]);
        });

        it('should return null for non-existent ID', async () => {
            const mockModels = [{ id: 'model1', name: 'Model 1', description: 'Test 1' }];

            sandbox.stub(configRepo, 'loadFileJson').resolves(mockModels);

            const model = await configRepo.getAIModelById('nonexistent');

            expect(model).to.be.null;
        });

        it('should use cached models', async () => {
            const mockModels = [{ id: 'model1', name: 'Model 1', description: 'Test 1' }];

            const loadStub = sandbox.stub(configRepo, 'loadFileJson').resolves(mockModels);

            // First call loads and caches
            await configRepo.getAIModels();

            // Second call should use cache
            await configRepo.getAIModelById('model1');

            expect(loadStub.calledOnce).to.be.true;
        });
    });

    describe('clearCache', () => {
        it('should clear all cached data', async () => {
            const mockModels = [{ id: 'model1', name: 'Model 1' }];

            const loadStub = sandbox.stub(configRepo, 'loadFileJson').resolves(mockModels);

            // Load and cache
            await configRepo.getAIModels();

            // Clear cache
            configRepo.clearCache();

            // Load again (should hit file system)
            await configRepo.getAIModels();

            expect(loadStub.calledTwice).to.be.true;
        });

        it('should clear specific cache entry', async () => {
            const mockModels = [{ id: 'model1', name: 'Model 1' }];
            const mockLanguages = [{ id: 'en', name: 'English', codes: ['en'] }];

            sandbox
                .stub(configRepo, 'loadFileJson')
                .onFirstCall()
                .resolves(mockModels)
                .onSecondCall()
                .resolves(mockLanguages)
                .onThirdCall()
                .resolves(mockModels);

            // Load and cache both
            await configRepo.getAIModels();
            await configRepo.getLanguages();

            // Clear only models cache
            configRepo.clearCache('models');

            // Reload - models should reload, languages should be cached
            await configRepo.getAIModels();

            expect(configRepo.loadFileJson.callCount).to.equal(3);
        });
    });

    describe('reloadConfig', () => {
        it('should reload all configuration', async () => {
            const mockModels = [{ id: 'model1', name: 'Model 1' }];
            const mockLanguages = [{ id: 'en', name: 'English', codes: ['en'] }];

            const loadStub = sandbox
                .stub(configRepo, 'loadFileJson')
                .onFirstCall()
                .resolves(mockModels)
                .onSecondCall()
                .resolves(mockLanguages)
                .onThirdCall()
                .resolves(mockModels)
                .onCall(3)
                .resolves(mockLanguages);

            // Initial load
            await configRepo.getAIModels();
            await configRepo.getLanguages();

            // Reload
            await configRepo.reloadConfig();

            expect(loadStub.callCount).to.equal(4);
        });
    });
});
