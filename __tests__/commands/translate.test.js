const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const translateCommand = require('../../src/commands/translate');

// Mock dependencies
jest.mock('fs-extra');
jest.mock('inquirer');
jest.mock('@google/generative-ai');
jest.mock('ora', () => {
	const mockSpinner = {
		start: jest.fn().mockReturnThis(),
		succeed: jest.fn(),
		fail: jest.fn(),
		text: '',
	};
	return jest.fn(() => mockSpinner);
});
jest.mock('chalk', () => ({
	red: jest.fn((text) => text),
	yellow: jest.fn((text) => text),
	cyan: jest.fn((text) => text),
	green: jest.fn((text) => text),
}));

jest.mock('../../src/utils/config');
jest.mock('../../src/constants/languages', () => [
	{ name: 'Turkish', value: 'tr', nativeName: 'Türkçe', flag: 'tr.svg' },
	{ name: 'English', value: 'en', nativeName: 'English', flag: 'us.svg' },
]);

const { getConfig, setConfig } = require('../../src/utils/config');

describe('translate command', () => {
	const originalCwd = process.cwd();
	const testProjectRoot = '/test/project';
	const messagesPath = path.join(testProjectRoot, 'messages');
	const baseLangPath = path.join(messagesPath, 'en');

	beforeEach(() => {
		jest.clearAllMocks();
		process.cwd = jest.fn(() => testProjectRoot);

		// Default environment
		delete process.env.GEMINI_API_KEY;
	});

	afterEach(() => {
		process.cwd = originalCwd;
	});

	describe('command structure', () => {
		test('should have correct command name', () => {
			expect(translateCommand.command).toBe('translate');
		});

		test('should have correct description', () => {
			expect(translateCommand.description).toBe(
				'Automatically translate language files using AI (Gemini).'
			);
		});

		test('should have action function', () => {
			expect(typeof translateCommand.action).toBe('function');
		});
	});

	describe('project validation', () => {
		test('should exit when messages/en directory does not exist', async () => {
			fs.pathExists.mockResolvedValue(false);

			const exitSpy = jest
				.spyOn(process, 'exit')
				.mockImplementation(() => {
					throw new Error('process.exit called');
				});
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();

			await expect(translateCommand.action()).rejects.toThrow(
				'process.exit called'
			);

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				expect.arrayContaining(["Error: 'messages/en' directory not found."])
			);
			expect(exitSpy).toHaveBeenCalledWith(1);

			exitSpy.mockRestore();
			consoleErrorSpy.mockRestore();
		});

		test('should continue when messages/en directory exists', async () => {
			fs.pathExists.mockResolvedValue(true);
			fs.readdir.mockResolvedValue(['tr']);
			fs.lstatSync.mockReturnValue({ isDirectory: () => true });
			fs.readJson.mockResolvedValue({ hello: 'world' });
			fs.writeJson.mockResolvedValue();

			const mockModel = {
				generateContent: jest.fn().mockResolvedValue({
					response: {
						text: () => JSON.stringify({ hello: 'dünya' }),
					},
				}),
			};
			const mockGenAI = {
				getGenerativeModel: jest.fn().mockReturnValue(mockModel),
			};
			GoogleGenerativeAI.mockImplementation(() => mockGenAI);

			getConfig.mockResolvedValue({ geminiApiKey: 'test-key' });
			inquirer.prompt.mockResolvedValue({
				languagesToTranslate: ['tr'],
			});

			await translateCommand.action();

			expect(fs.pathExists).toHaveBeenCalledWith(baseLangPath);
		});
	});

	describe('API key handling', () => {
		test('should use API key from environment variable', async () => {
			process.env.GEMINI_API_KEY = 'env-api-key';
			fs.pathExists.mockResolvedValue(true);
			fs.readdir.mockResolvedValue(['tr']);
			fs.lstatSync.mockReturnValue({ isDirectory: () => true });
			fs.readJson.mockResolvedValue({ hello: 'world' });
			fs.writeJson.mockResolvedValue();

			const mockModel = {
				generateContent: jest.fn().mockResolvedValue({
					response: {
						text: () => JSON.stringify({ hello: 'dünya' }),
					},
				}),
			};
			const mockGenAI = {
				getGenerativeModel: jest.fn().mockReturnValue(mockModel),
			};
			GoogleGenerativeAI.mockImplementation(() => mockGenAI);
			inquirer.prompt.mockResolvedValue({
				languagesToTranslate: ['tr'],
			});

			await translateCommand.action();

			expect(GoogleGenerativeAI).toHaveBeenCalledWith('env-api-key');
		});

		test('should use API key from config when environment variable is not set', async () => {
			fs.pathExists.mockResolvedValue(true);
			fs.readdir.mockResolvedValue(['tr']);
			fs.lstatSync.mockReturnValue({ isDirectory: () => true });
			fs.readJson.mockResolvedValue({ hello: 'world' });
			fs.writeJson.mockResolvedValue();

			const mockModel = {
				generateContent: jest.fn().mockResolvedValue({
					response: {
						text: () => JSON.stringify({ hello: 'dünya' }),
					},
				}),
			};
			const mockGenAI = {
				getGenerativeModel: jest.fn().mockReturnValue(mockModel),
			};
			GoogleGenerativeAI.mockImplementation(() => mockGenAI);

			getConfig.mockResolvedValue({ geminiApiKey: 'config-api-key' });
			inquirer.prompt.mockResolvedValue({
				languagesToTranslate: ['tr'],
			});

			await translateCommand.action();

			expect(GoogleGenerativeAI).toHaveBeenCalledWith('config-api-key');
		});

		test('should prompt for API key when not available', async () => {
			fs.pathExists.mockResolvedValue(true);
			fs.readdir.mockResolvedValue(['tr']);
			fs.lstatSync.mockReturnValue({ isDirectory: () => true });
			fs.readJson.mockResolvedValue({ hello: 'world' });
			fs.writeJson.mockResolvedValue();

			const mockModel = {
				generateContent: jest.fn().mockResolvedValue({
					response: {
						text: () => JSON.stringify({ hello: 'dünya' }),
					},
				}),
			};
			const mockGenAI = {
				getGenerativeModel: jest.fn().mockReturnValue(mockModel),
			};
			GoogleGenerativeAI.mockImplementation(() => mockGenAI);

			getConfig.mockResolvedValue({});
			inquirer.prompt
				.mockResolvedValueOnce({
					apiKey: 'prompted-api-key',
					saveKey: false,
				})
				.mockResolvedValueOnce({
					languagesToTranslate: ['tr'],
				});

			await translateCommand.action();

			expect(inquirer.prompt).toHaveBeenCalledWith([
				{
					type: 'password',
					name: 'apiKey',
					message: 'Enter your Google Gemini API key:',
					mask: '*',
					validate: expect.any(Function),
				},
				{
					type: 'confirm',
					name: 'saveKey',
					message:
						'Save this API key for future use? (stored in ~/.config/nitrokit-cli/config.json)',
					default: true,
				},
			]);
			expect(GoogleGenerativeAI).toHaveBeenCalledWith('prompted-api-key');
		});

		test('should save API key when user confirms', async () => {
			fs.pathExists.mockResolvedValue(true);
			fs.readdir.mockResolvedValue(['tr']);
			fs.lstatSync.mockReturnValue({ isDirectory: () => true });
			fs.readJson.mockResolvedValue({ hello: 'world' });
			fs.writeJson.mockResolvedValue();

			const mockModel = {
				generateContent: jest.fn().mockResolvedValue({
					response: {
						text: () => JSON.stringify({ hello: 'dünya' }),
					},
				}),
			};
			const mockGenAI = {
				getGenerativeModel: jest.fn().mockReturnValue(mockModel),
			};
			GoogleGenerativeAI.mockImplementation(() => mockGenAI);

			getConfig.mockResolvedValue({});
			inquirer.prompt
				.mockResolvedValueOnce({
					apiKey: 'prompted-api-key',
					saveKey: true,
				})
				.mockResolvedValueOnce({
					languagesToTranslate: ['tr'],
				});

			const consoleLogSpy = jest
				.spyOn(console, 'log')
				.mockImplementation();

			await translateCommand.action();

			expect(setConfig).toHaveBeenCalledWith(
				'geminiApiKey',
				'prompted-api-key'
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				'API key saved successfully!'
			);

			consoleLogSpy.mockRestore();
		});
	});

	describe('language selection', () => {
		test('should show message when no other languages found', async () => {
			fs.pathExists.mockResolvedValue(true);
			fs.readdir.mockResolvedValue(['en']); // Only English directory
			getConfig.mockResolvedValue({ geminiApiKey: 'test-key' });

			const consoleLogSpy = jest
				.spyOn(console, 'log')
				.mockImplementation();

			await translateCommand.action();

			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining('No other languages found to translate')
			);

			consoleLogSpy.mockRestore();
		});

		test('should prompt for language selection when multiple languages available', async () => {
			fs.pathExists.mockResolvedValue(true);
			fs.readdir.mockResolvedValue(['en', 'tr', 'fr']);
			fs.lstatSync.mockReturnValue({ isDirectory: () => true });
			fs.readJson.mockResolvedValue({ hello: 'world' });
			fs.writeJson.mockResolvedValue();

			const mockModel = {
				generateContent: jest.fn().mockResolvedValue({
					response: {
						text: () => JSON.stringify({ hello: 'dünya' }),
					},
				}),
			};
			const mockGenAI = {
				getGenerativeModel: jest.fn().mockReturnValue(mockModel),
			};
			GoogleGenerativeAI.mockImplementation(() => mockGenAI);

			getConfig.mockResolvedValue({ geminiApiKey: 'test-key' });
			inquirer.prompt.mockResolvedValue({
				languagesToTranslate: ['tr', 'fr'],
			});

			await translateCommand.action();

			expect(inquirer.prompt).toHaveBeenCalledWith([
				{
					type: 'checkbox',
					name: 'languagesToTranslate',
					message: 'Which language(s) would you like to translate?',
					choices: ['tr', 'fr'],
					validate: expect.any(Function),
				},
			]);
		});

		test('should exit when no languages selected', async () => {
			fs.pathExists.mockResolvedValue(true);
			fs.readdir.mockResolvedValue(['en', 'tr']);
			fs.lstatSync.mockReturnValue({ isDirectory: () => true });
			getConfig.mockResolvedValue({ geminiApiKey: 'test-key' });
			inquirer.prompt.mockResolvedValue({
				languagesToTranslate: [],
			});

			const consoleLogSpy = jest
				.spyOn(console, 'log')
				.mockImplementation();

			await translateCommand.action();

			expect(consoleLogSpy).toHaveBeenCalledWith(
				'No languages selected. Exiting.'
			);

			consoleLogSpy.mockRestore();
		});
	});

	describe('translation process', () => {
		test('should translate files successfully', async () => {
			fs.pathExists.mockResolvedValue(true);
			fs.readdir.mockResolvedValueOnce(['en', 'tr']); // Available languages
			fs.readdir.mockResolvedValueOnce(['common.json', 'auth.json']); // Source files
			fs.lstatSync.mockReturnValue({ isDirectory: () => true });
			fs.readJson.mockResolvedValue({ hello: 'world' });
			fs.writeJson.mockResolvedValue();

			const mockModel = {
				generateContent: jest.fn().mockResolvedValue({
					response: {
						text: () => JSON.stringify({ hello: 'dünya' }),
					},
				}),
			};
			const mockGenAI = {
				getGenerativeModel: jest.fn().mockReturnValue(mockModel),
			};
			GoogleGenerativeAI.mockImplementation(() => mockGenAI);

			getConfig.mockResolvedValue({ geminiApiKey: 'test-key' });
			inquirer.prompt.mockResolvedValue({
				languagesToTranslate: ['tr'],
			});

			await translateCommand.action();

			expect(fs.readJson).toHaveBeenCalledWith(
				path.join(baseLangPath, 'common.json')
			);
			expect(fs.readJson).toHaveBeenCalledWith(
				path.join(baseLangPath, 'auth.json')
			);
			expect(fs.writeJson).toHaveBeenCalledWith(
				path.join(messagesPath, 'tr', 'common.json'),
				{ hello: 'dünya' },
				{ spaces: 2 }
			);
			expect(fs.writeJson).toHaveBeenCalledWith(
				path.join(messagesPath, 'tr', 'auth.json'),
				{ hello: 'dünya' },
				{ spaces: 2 }
			);
		});

		test('should handle translation error', async () => {
			fs.pathExists.mockResolvedValue(true);
			fs.readdir.mockResolvedValueOnce(['en', 'tr']);
			fs.readdir.mockResolvedValueOnce(['common.json']);
			fs.lstatSync.mockReturnValue({ isDirectory: () => true });
			fs.readJson.mockResolvedValue({ hello: 'world' });

			const mockModel = {
				generateContent: jest
					.fn()
					.mockRejectedValue(new Error('API key not valid')),
			};
			const mockGenAI = {
				getGenerativeModel: jest.fn().mockReturnValue(mockModel),
			};
			GoogleGenerativeAI.mockImplementation(() => mockGenAI);

			getConfig.mockResolvedValue({ geminiApiKey: 'test-key' });
			inquirer.prompt.mockResolvedValue({
				languagesToTranslate: ['tr'],
			});

			const exitSpy = jest
				.spyOn(process, 'exit')
				.mockImplementation(() => {
					throw new Error('process.exit called');
				});
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();

			await expect(translateCommand.action()).rejects.toThrow(
				'process.exit called'
			);

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				expect.arrayContaining(["\n[Authentication Error] Your Google Gemini API key is not valid. Please check your key and try again."])
			);

			exitSpy.mockRestore();
			consoleErrorSpy.mockRestore();
		});

		test('should handle model not found error', async () => {
			fs.pathExists.mockResolvedValue(true);
			fs.readdir.mockResolvedValueOnce(['en', 'tr']);
			fs.readdir.mockResolvedValueOnce(['common.json']);
			fs.lstatSync.mockReturnValue({ isDirectory: () => true });
			fs.readJson.mockResolvedValue({ hello: 'world' });

			const mockModel = {
				generateContent: jest
					.fn()
					.mockRejectedValue(new Error('404 Not Found')),
			};
			const mockGenAI = {
				getGenerativeModel: jest.fn().mockReturnValue(mockModel),
			};
			GoogleGenerativeAI.mockImplementation(() => mockGenAI);

			getConfig.mockResolvedValue({ geminiApiKey: 'test-key' });
			inquirer.prompt.mockResolvedValue({
				languagesToTranslate: ['tr'],
			});

			const exitSpy = jest
				.spyOn(process, 'exit')
				.mockImplementation(() => {
					throw new Error('process.exit called');
				});
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();

			await expect(translateCommand.action()).rejects.toThrow(
				'process.exit called'
			);

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				expect.arrayContaining(["\n[Model Not Found] The Gemini models are not accessible with this API key."])
			);

			exitSpy.mockRestore();
			consoleErrorSpy.mockRestore();
		});
	});

	describe('model fallback', () => {
		test('should fallback to gemini-pro when gemini-1.5-flash-latest fails', async () => {
			fs.pathExists.mockResolvedValue(true);
			fs.readdir.mockResolvedValueOnce(['en', 'tr']);
			fs.readdir.mockResolvedValueOnce(['common.json']);
			fs.lstatSync.mockReturnValue({ isDirectory: () => true });
			fs.readJson.mockResolvedValue({ hello: 'world' });
			fs.writeJson.mockResolvedValue();

			const mockFlashModel = {
				countTokens: jest
					.fn()
					.mockRejectedValue(new Error('Model not available')),
			};
			const mockProModel = {
				generateContent: jest.fn().mockResolvedValue({
					response: {
						text: () => JSON.stringify({ hello: 'dünya' }),
					},
				}),
			};
			const mockGenAI = {
				getGenerativeModel: jest
					.fn()
					.mockReturnValueOnce(mockFlashModel)
					.mockReturnValueOnce(mockProModel),
			};
			GoogleGenerativeAI.mockImplementation(() => mockGenAI);

			getConfig.mockResolvedValue({ geminiApiKey: 'test-key' });
			inquirer.prompt.mockResolvedValue({
				languagesToTranslate: ['tr'],
			});

			await translateCommand.action();

			expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({
				model: 'gemini-1.5-flash-latest',
			});
			expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({
				model: 'gemini-pro',
			});
		});
	});
});
