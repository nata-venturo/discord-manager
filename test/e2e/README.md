# End-to-End Tests

This directory contains end-to-end (E2E) tests that verify complete user workflows.

## What are E2E Tests?

E2E tests simulate real user interactions and test the entire application flow from start to finish. Unlike unit tests that test individual functions or integration tests that test component interactions, E2E tests verify that the whole system works together correctly.

## Test Structure

Each E2E test file covers a complete workflow:

- **chat-workflow.e2e.test.js**: Tests complete AI chat automation workflow
  - Talk With AI mode from user input to AI response
  - Quote mode from setup to sending/deleting quotes
  - Error handling scenarios

- **moderation-workflow.e2e.test.js**: Tests complete moderation workflow
  - Full moderation cycle: warning → timeout → kick
  - Multi-user moderation tracking
  - Allowed user handling
  - Error recovery

## Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E test
npx mocha test/e2e/chat-workflow.e2e.test.js

# Run with coverage
npm run test:coverage -- test/e2e
```

## Test Helpers

E2E tests use the following helpers from `test/helpers/`:

- **mockDiscordClient.js**: Mock Discord.js client
- **fixtures.js**: Test data and configuration
- **assertions.js**: Custom assertions

## Best Practices

1. **Test Real Scenarios**: Focus on actual user workflows
2. **Use Realistic Data**: Use fixtures that represent real usage
3. **Test Happy and Sad Paths**: Cover both success and error scenarios
4. **Mock External Dependencies**: Discord API, Google AI, etc.
5. **Clean Up After Tests**: Always stop commands and restore stubs
6. **Keep Tests Independent**: Each test should be runnable in isolation

## Writing New E2E Tests

When adding new E2E tests:

1. Create a new file with `.e2e.test.js` suffix
2. Test complete user workflows
3. Mock external API calls
4. Verify end results, not implementation details
5. Add cleanup in `afterEach` hooks
6. Document complex test scenarios

Example:

```javascript
describe('My Workflow E2E', () => {
    let sandbox;
    let command;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        command = new MyCommand();
    });

    afterEach(() => {
        command.stop();
        sandbox.restore();
    });

    it('should complete full workflow', async () => {
        // Setup mocks
        // Execute workflow
        // Verify results
    });
});
```

## Common Gotchas

- **Async Operations**: Always use `async/await` for Discord operations
- **Timers**: Use `sinon.useFakeTimers()` to control time
- **Event Listeners**: Clean up listeners to prevent memory leaks
- **Promises**: Handle rejections properly
- **Cleanup**: Always restore stubs and stop services

## Coverage Goals

E2E tests should cover:

- ✅ Complete user workflows
- ✅ Error handling and recovery
- ✅ Edge cases and boundary conditions
- ✅ Multi-user scenarios
- ✅ Integration with external services
- ✅ Configuration variations
