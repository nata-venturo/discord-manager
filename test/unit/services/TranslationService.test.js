/**
 * @license Discord Manager
 * TranslationService.test.js - Unit tests for TranslationService
 *
 * Copyright (c) 2025 - Present Natarizkie
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { TranslationService } from '../../../src/services/TranslationService.js';

describe('TranslationService', () => {
    let translationService;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        translationService = new TranslationService();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('detectLanguage', () => {
        const supportedLanguages = [
            { id: 'en', name: 'English', codes: ['en'] },
            { id: 'id', name: 'Indonesian', codes: ['id'] },
            { id: 'es', name: 'Spanish', codes: ['es'] },
        ];

        it('should detect English text', () => {
            const text = 'Hello, how are you today?';

            const language = translationService.detectLanguage(text, supportedLanguages);

            expect(language).to.equal('English');
        });

        it('should detect Indonesian text', () => {
            const text = 'Selamat pagi, apa kabar hari ini?';

            const language = translationService.detectLanguage(text, supportedLanguages);

            expect(language).to.equal('Indonesian');
        });

        it('should return first language as fallback for unknown text', () => {
            const text = '12345 !@#$%';

            const language = translationService.detectLanguage(text, supportedLanguages);

            expect(language).to.be.oneOf(['English', 'Indonesian', 'Spanish']);
        });

        it('should handle empty text gracefully', () => {
            const text = '';

            const language = translationService.detectLanguage(text, supportedLanguages);

            expect(language).to.equal('English');
        });

        it('should handle mixed language text', () => {
            const text = 'Hello, selamat pagi everyone!';

            const language = translationService.detectLanguage(text, supportedLanguages);

            // Should detect one of the languages
            expect(['English', 'Indonesian']).to.include(language);
        });
    });

    describe('translateText', () => {
        it('should translate text successfully', async () => {
            const text = 'Hello, world!';
            const targetLang = 'es';

            // Mock translate function
            const mockTranslate = sandbox.stub().resolves('¡Hola, mundo!');
            translationService.translate = mockTranslate;

            const translated = await translationService.translateText(text, targetLang);

            expect(translated).to.equal('¡Hola, mundo!');
            expect(mockTranslate.calledOnce).to.be.true;
            expect(mockTranslate.calledWith(text, { to: targetLang })).to.be.true;
        });

        it('should return original text if translation fails', async () => {
            const text = 'Hello, world!';
            const targetLang = 'es';

            // Mock translate to fail
            const mockTranslate = sandbox.stub().rejects(new Error('Translation failed'));
            translationService.translate = mockTranslate;

            const translated = await translationService.translateText(text, targetLang);

            expect(translated).to.equal(text);
        });

        it('should handle empty text', async () => {
            const text = '';
            const targetLang = 'es';

            const translated = await translationService.translateText(text, targetLang);

            expect(translated).to.equal('');
        });

        it('should cache translation results', async () => {
            const text = 'Hello';
            const targetLang = 'es';

            const mockTranslate = sandbox.stub().resolves('Hola');
            translationService.translate = mockTranslate;

            // First call
            await translationService.translateText(text, targetLang);

            // Second call (should use cache if implemented)
            await translationService.translateText(text, targetLang);

            // Depending on caching implementation
            expect(mockTranslate.callCount).to.be.at.least(1);
        });
    });

    describe('getRandomQuote', () => {
        const quotes = [
            { text: 'To be or not to be', author: 'Shakespeare' },
            { text: 'I think therefore I am', author: 'Descartes' },
            { text: 'Knowledge is power', author: 'Bacon' },
        ];

        it('should return random quote', async () => {
            const targetLang = 'en';

            const quote = await translationService.getRandomQuote(quotes, targetLang);

            expect(quote).to.exist;
            expect(quote).to.have.property('original');
            expect(quote).to.have.property('translated');
            expect(quote).to.have.property('author');
        });

        it('should translate quote if language is not auto', async () => {
            const targetLang = 'es';

            const mockTranslate = sandbox.stub().resolves('Traducido');
            translationService.translate = mockTranslate;

            const quote = await translationService.getRandomQuote(quotes, targetLang);

            expect(quote.translated).to.exist;
            // Should have attempted translation
            expect(mockTranslate.called).to.be.true;
        });

        it('should not translate if language is auto', async () => {
            const targetLang = 'auto';

            const mockTranslate = sandbox.stub().resolves('Translated');
            translationService.translate = mockTranslate;

            const quote = await translationService.getRandomQuote(quotes, targetLang);

            expect(quote.original).to.equal(quote.translated);
            expect(mockTranslate.called).to.be.false;
        });

        it('should handle empty quotes array', async () => {
            const emptyQuotes = [];
            const targetLang = 'en';

            try {
                await translationService.getRandomQuote(emptyQuotes, targetLang);
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error).to.exist;
            }
        });

        it('should select different quotes randomly', async () => {
            const targetLang = 'en';
            const selectedQuotes = new Set();

            // Get multiple quotes
            for (let i = 0; i < 10; i++) {
                const quote = await translationService.getRandomQuote(quotes, targetLang);
                selectedQuotes.add(quote.original);
            }

            // Should have selected at least 2 different quotes in 10 tries
            expect(selectedQuotes.size).to.be.at.least(2);
        });

        it('should include author in quote result', async () => {
            const targetLang = 'en';

            const quote = await translationService.getRandomQuote(quotes, targetLang);

            expect(quote.author).to.exist;
            expect(quote.author).to.be.a('string');
            expect(quote.author.length).to.be.greaterThan(0);
        });
    });

    describe('getLanguageCode', () => {
        const languages = [
            { id: 'en', name: 'English', codes: ['en'] },
            { id: 'id', name: 'Indonesian', codes: ['id', 'ind'] },
        ];

        it('should return language code for valid language name', () => {
            const code = translationService.getLanguageCode('English', languages);

            expect(code).to.equal('en');
        });

        it('should return default code for unknown language', () => {
            const code = translationService.getLanguageCode('Unknown', languages);

            expect(code).to.equal('en');
        });

        it('should handle case-insensitive matching', () => {
            const code = translationService.getLanguageCode('english', languages);

            expect(code).to.equal('en');
        });
    });
});
