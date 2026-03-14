/**
 * @license Discord Manager
 * WarningRepository.test.js - Unit tests for WarningRepository
 *
 * Copyright (c) 2025 - Present Natarizkie
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { WarningRepository } from '../../../src/repositories/WarningRepository.js';
import { FileIOError } from '../../../src/errors/index.js';

describe('WarningRepository', () => {
    let warningRepo;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        warningRepo = new WarningRepository();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('load', () => {
        it('should load warnings from file', async () => {
            const mockWarnings = {
                user1: 3,
                user2: 5,
            };

            sandbox.stub(warningRepo, 'loadFileJson').resolves(mockWarnings);

            await warningRepo.load();

            expect(warningRepo.warnings).to.deep.equal(mockWarnings);
        });

        it('should initialize empty warnings if file does not exist', async () => {
            sandbox.stub(warningRepo, 'loadFileJson').rejects(new Error('File not found'));

            await warningRepo.load();

            expect(warningRepo.warnings).to.deep.equal({});
        });

        it('should handle corrupted file gracefully', async () => {
            sandbox.stub(warningRepo, 'loadFileJson').rejects(new Error('Invalid JSON'));

            await warningRepo.load();

            expect(warningRepo.warnings).to.deep.equal({});
        });
    });

    describe('save', () => {
        it('should save warnings to file', async () => {
            const saveStub = sandbox.stub(warningRepo, 'saveFileJson').resolves();

            warningRepo.warnings = {
                user1: 2,
                user2: 4,
            };

            await warningRepo.save();

            expect(saveStub.calledOnce).to.be.true;
            expect(saveStub.calledWith(warningRepo.warnings)).to.be.true;
        });

        it('should throw FileIOError on save failure', async () => {
            sandbox.stub(warningRepo, 'saveFileJson').rejects(new Error('Permission denied'));

            warningRepo.warnings = { user1: 1 };

            try {
                await warningRepo.save();
                expect.fail('Should have thrown FileIOError');
            } catch (error) {
                expect(error).to.be.instanceOf(FileIOError);
                expect(error.message).to.include('Failed to save warnings');
            }
        });

        it('should create file if it does not exist', async () => {
            const saveStub = sandbox.stub(warningRepo, 'saveFileJson').resolves();

            warningRepo.warnings = { user1: 1 };

            await warningRepo.save();

            expect(saveStub.calledOnce).to.be.true;
        });
    });

    describe('getWarnings', () => {
        beforeEach(async () => {
            sandbox.stub(warningRepo, 'loadFileJson').resolves({
                user1: 3,
                user2: 5,
            });
            await warningRepo.load();
        });

        it('should return warning count for user', () => {
            const warnings = warningRepo.getWarnings('user1');

            expect(warnings).to.equal(3);
        });

        it('should return 0 for user with no warnings', () => {
            const warnings = warningRepo.getWarnings('user3');

            expect(warnings).to.equal(0);
        });

        it('should handle null user ID gracefully', () => {
            const warnings = warningRepo.getWarnings(null);

            expect(warnings).to.equal(0);
        });

        it('should handle undefined user ID gracefully', () => {
            const warnings = warningRepo.getWarnings(undefined);

            expect(warnings).to.equal(0);
        });
    });

    describe('incrementWarning', () => {
        beforeEach(async () => {
            sandbox.stub(warningRepo, 'loadFileJson').resolves({
                user1: 2,
            });
            await warningRepo.load();
        });

        it('should increment existing user warnings', async () => {
            sandbox.stub(warningRepo, 'saveFileJson').resolves();

            const newCount = await warningRepo.incrementWarning('user1');

            expect(newCount).to.equal(3);
            expect(warningRepo.warnings['user1']).to.equal(3);
        });

        it('should create warning for new user', async () => {
            sandbox.stub(warningRepo, 'saveFileJson').resolves();

            const newCount = await warningRepo.incrementWarning('user2');

            expect(newCount).to.equal(1);
            expect(warningRepo.warnings['user2']).to.equal(1);
        });

        it('should save warnings after incrementing', async () => {
            const saveStub = sandbox.stub(warningRepo, 'saveFileJson').resolves();

            await warningRepo.incrementWarning('user1');

            expect(saveStub.calledOnce).to.be.true;
        });

        it('should handle multiple increments', async () => {
            sandbox.stub(warningRepo, 'saveFileJson').resolves();

            await warningRepo.incrementWarning('user3');
            await warningRepo.incrementWarning('user3');
            await warningRepo.incrementWarning('user3');

            expect(warningRepo.warnings['user3']).to.equal(3);
        });

        it('should throw error for invalid user ID', async () => {
            try {
                await warningRepo.incrementWarning(null);
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error).to.exist;
            }
        });
    });

    describe('clearWarnings', () => {
        beforeEach(async () => {
            sandbox.stub(warningRepo, 'loadFileJson').resolves({
                user1: 5,
                user2: 3,
            });
            await warningRepo.load();
        });

        it('should clear warnings for specific user', async () => {
            sandbox.stub(warningRepo, 'saveFileJson').resolves();

            await warningRepo.clearWarnings('user1');

            expect(warningRepo.warnings['user1']).to.be.undefined;
            expect(warningRepo.warnings['user2']).to.equal(3);
        });

        it('should save after clearing warnings', async () => {
            const saveStub = sandbox.stub(warningRepo, 'saveFileJson').resolves();

            await warningRepo.clearWarnings('user1');

            expect(saveStub.calledOnce).to.be.true;
        });

        it('should handle clearing non-existent user gracefully', async () => {
            sandbox.stub(warningRepo, 'saveFileJson').resolves();

            await warningRepo.clearWarnings('user999');

            expect(warningRepo.warnings['user999']).to.be.undefined;
        });

        it('should throw error for invalid user ID', async () => {
            try {
                await warningRepo.clearWarnings(null);
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error).to.exist;
            }
        });
    });

    describe('clearAllWarnings', () => {
        beforeEach(async () => {
            sandbox.stub(warningRepo, 'loadFileJson').resolves({
                user1: 5,
                user2: 3,
                user3: 7,
            });
            await warningRepo.load();
        });

        it('should clear all warnings', async () => {
            sandbox.stub(warningRepo, 'saveFileJson').resolves();

            await warningRepo.clearAllWarnings();

            expect(warningRepo.warnings).to.deep.equal({});
        });

        it('should save after clearing all warnings', async () => {
            const saveStub = sandbox.stub(warningRepo, 'saveFileJson').resolves();

            await warningRepo.clearAllWarnings();

            expect(saveStub.calledOnce).to.be.true;
        });
    });

    describe('getAllWarnings', () => {
        beforeEach(async () => {
            sandbox.stub(warningRepo, 'loadFileJson').resolves({
                user1: 5,
                user2: 3,
            });
            await warningRepo.load();
        });

        it('should return all warnings', () => {
            const allWarnings = warningRepo.getAllWarnings();

            expect(allWarnings).to.deep.equal({
                user1: 5,
                user2: 3,
            });
        });

        it('should return empty object if no warnings', async () => {
            sandbox.restore();
            sandbox = sinon.createSandbox();
            sandbox.stub(warningRepo, 'loadFileJson').resolves({});
            await warningRepo.load();

            const allWarnings = warningRepo.getAllWarnings();

            expect(allWarnings).to.deep.equal({});
        });

        it('should return a copy, not reference', () => {
            const allWarnings = warningRepo.getAllWarnings();

            allWarnings['user3'] = 10;

            expect(warningRepo.warnings['user3']).to.be.undefined;
        });
    });

    describe('getUserCount', () => {
        beforeEach(async () => {
            sandbox.stub(warningRepo, 'loadFileJson').resolves({
                user1: 5,
                user2: 3,
                user3: 1,
            });
            await warningRepo.load();
        });

        it('should return count of users with warnings', () => {
            const count = warningRepo.getUserCount();

            expect(count).to.equal(3);
        });

        it('should return 0 if no users have warnings', async () => {
            sandbox.restore();
            sandbox = sinon.createSandbox();
            sandbox.stub(warningRepo, 'loadFileJson').resolves({});
            await warningRepo.load();

            const count = warningRepo.getUserCount();

            expect(count).to.equal(0);
        });
    });

    describe('getTopOffenders', () => {
        beforeEach(async () => {
            sandbox.stub(warningRepo, 'loadFileJson').resolves({
                user1: 10,
                user2: 5,
                user3: 15,
                user4: 3,
            });
            await warningRepo.load();
        });

        it('should return users sorted by warning count', () => {
            const topOffenders = warningRepo.getTopOffenders(3);

            expect(topOffenders).to.have.lengthOf(3);
            expect(topOffenders[0]).to.deep.equal({ userId: 'user3', warnings: 15 });
            expect(topOffenders[1]).to.deep.equal({ userId: 'user1', warnings: 10 });
            expect(topOffenders[2]).to.deep.equal({ userId: 'user2', warnings: 5 });
        });

        it('should limit results to requested count', () => {
            const topOffenders = warningRepo.getTopOffenders(2);

            expect(topOffenders).to.have.lengthOf(2);
        });

        it('should return all users if count exceeds total', () => {
            const topOffenders = warningRepo.getTopOffenders(10);

            expect(topOffenders).to.have.lengthOf(4);
        });

        it('should handle default limit', () => {
            const topOffenders = warningRepo.getTopOffenders();

            expect(topOffenders).to.be.an('array');
            expect(topOffenders.length).to.be.at.most(10);
        });
    });
});
