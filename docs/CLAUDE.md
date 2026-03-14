# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Discord Manager is a Discord automation bot built with Node.js that provides various automation features for Discord self-bots. The project uses `discord.js-selfbot-v13` for Discord integration and Google's Generative AI (Gemini) for intelligent chat responses.

**IMPORTANT**: This is a Discord self-bot implementation. Be aware that Discord's Terms of Service prohibit the use of self-bots. This project is intended for educational purposes and authorized testing environments only.

## Core Commands

### Development Commands
```bash
# Install dependencies
npm install

# Linting and formatting
npm run lint              # Check code style
npm run format            # Format code with Prettier
npm run lint:fix          # Auto-fix ESLint issues and format

# Testing
npm run test              # Run Mocha tests (note: test directory doesn't exist yet)
```

### Running Features
Each automation feature runs as a standalone script:

```bash
npm run discordAutoChat              # AI-powered auto-chat responses
npm run discordAutoForbiddenWords    # Filter and moderate forbidden words
npm run discordAutoGmGn              # Scheduled GM/GN messages (08:00/22:00 UTC)
npm run discordAutoReaction          # Automated emoji reactions
npm run discordAutoTyping            # Typing indicator simulation
npm run discordAutoFaucetMango       # Mango Network faucet automation
```

## Architecture

### Project Structure
```
discord-manager/
├── src/                          # Source files for all automation features
│   ├── autoChat.js              # AI chat automation using Gemini API
│   ├── autoForbiddenWords.js    # Message filtering and moderation
│   ├── autoGmGn.js              # Scheduled greetings using node-schedule
│   ├── autoReaction.js          # Automated emoji reactions
│   ├── autoTyping.js            # Typing indicator simulation
│   └── airdrop/
│       └── autoFaucetMango.js   # Mango Network faucet claims
├── assets/                       # JSON configuration files
│   ├── listBadWord.json         # Forbidden words list
│   ├── listModelAI.json         # Available AI model configurations
│   ├── listLanguage.json        # Supported languages
│   ├── listQuotesEn.json        # English quotes database
│   └── listUserWarning.json     # User warning tracking
├── index.js                      # Minimal entry point (currently just Hello World)
└── package.json                  # Dependencies and npm scripts
```

### Key Dependencies
- **discord.js-selfbot-v13**: Discord self-bot client implementation
- **@google/generative-ai**: Google Gemini API for AI chat responses
- **prompts**: Interactive CLI prompts for configuration
- **ora**: Terminal spinner for better UX
- **node-schedule**: Cron-like job scheduler for timed messages
- **languagedetect**: Detect message language for auto-translation
- **translate-google**: Translation service integration
- **delay**: Promise-based delay utility

### Code Patterns

#### Interactive Prompts
All scripts use the `prompts` library for interactive CLI configuration:
```javascript
const { tokenId } = await prompts({
    type: 'text',
    name: 'tokenId',
    message: 'Enter discord token',
    validate: (value) => (value.trim() === '' ? 'Discord token is required' : true)
}, { onCancel });
```

#### Common Utilities
Each script implements similar utility functions:
- `onCancel()`: Handles prompt cancellation
- `formatTime(ms)`: Formats milliseconds to human-readable time
- `loadFileJson(path, type)`: Loads JSON files as arrays or maps

#### Message Processing
The `autoChat.js` implements a queue-based message processing system:
- Uses a `messageQueue` to handle multiple messages
- `isProcessing` flag prevents concurrent processing
- `lastMessage` tracking to avoid duplicate responses
- Language detection and auto-translation support

## Environment Configuration

Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

Required environment variable:
- `GEMINI_API_KEY`: Google Generative AI API key for chat automation

Runtime configuration is done via interactive prompts, including:
- Discord token (required for all features)
- Discord channel ID (required for all features)
- Feature-specific settings (AI models, languages, delays, etc.)

## Development Guidelines

### Code Style
- ES6 modules (`"type": "module"` in package.json)
- Use ESLint with `@eslint/js` recommended config
- Prettier for code formatting
- Always run `npm run lint:fix` before committing

### File Organization
- All automation features live in `src/`
- Configuration JSON files in `assets/`
- Each feature is self-contained in a single JavaScript file
- No shared utility module currently exists

### Adding New Features
1. Create new script file in `src/` directory
2. Follow existing pattern: imports, client setup, prompts, event handlers
3. Add npm script to `package.json` under `scripts` section
4. Update README.md with usage instructions
5. Run `npm run lint:fix` before committing

### Common Discord Client Setup
```javascript
import { Client } from 'discord.js-selfbot-v13';
const client = new Client({ checkUpdate: false });

// Login and ready handler
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.login(tokenId);
```

### JSON Asset Files
Configuration files in `assets/` use specific structures:
- `listModelAI.json`: Array of AI model configurations with prompts
- `listLanguage.json`: Array of supported language options
- `listBadWord.json`: Array of forbidden words for moderation
- Load using the `loadFileJson()` utility function

## Testing

The project is configured for Mocha/Chai testing but test files don't exist yet. When writing tests:
- Test files should go in a `test/` directory
- Use Mocha's describe/it syntax
- Use Chai for assertions
- Run with `npm run test`

## Contribution Workflow

1. Create feature branch: `git checkout -b my-new-feature`
2. Run linting: `npm run lint:fix`
3. Commit with conventional commits: `git commit -m 'feat: add some new feature'`
4. Push and create PR: `git push origin my-new-feature`

All changes should be made in `src/` folder. Don't commit generated files from `dist/` or `node_modules/`.

## Important Notes

- This project uses ES6 modules, not CommonJS
- All scripts use interactive CLI prompts for configuration (no command-line arguments)
- Discord tokens and channel IDs are entered at runtime, not stored in `.env`
- The project targets self-bot usage which violates Discord ToS
- Language detection happens automatically in `autoChat.js` using the `languagedetect` library
- Scheduled messages in `autoGmGn.js` use UTC timezone (08:00 and 22:00)
