const configCommand = require('../../src/commands/config');

// Mock dependencies
jest.mock('chalk', () => ({
	red: jest.fn((text) => text),
	green: jest.fn((text) => text),
	cyan: jest.fn((text) => text),
	yellow: jest.fn((text) => text),
}));

jest.mock('../../src/utils/config');
const { setConfig } = require('../../src/utils/config');

describe('config command', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('command structure', () => {
		test('should have correct command name', () => {
			expect(configCommand.command).toBe('config <action> [key] [value]');
		});

		test('should have correct description', () => {
			expect(configCommand.description).toBe(
				'Manage CLI configuration (e.g., API keys).'
			);
		});

		test('should have action function', () => {
			expect(typeof configCommand.action).toBe('function');
		});
	});

	describe('set action', () => {
		test('should set gemini.apiKey successfully', async () => {
			const consoleLogSpy = jest
				.spyOn(console, 'log')
				.mockImplementation();
			setConfig.mockResolvedValue();

			await configCommand.action('set', 'gemini.apiKey', 'test-api-key');

			expect(setConfig).toHaveBeenCalledWith(
				'geminiApiKey',
				'test-api-key'
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				'Google Gemini API key has been updated successfully!'
			);

			consoleLogSpy.mockRestore();
		});

		test('should show error when no API key provided', async () => {
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();
			const consoleLogSpy = jest
				.spyOn(console, 'log')
				.mockImplementation();

			await configCommand.action('set', 'gemini.apiKey', '');

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Please provide an API key.'
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				'\nUsage: nitrokit config set gemini.apiKey <YOUR_API_KEY>'
			);

			consoleErrorSpy.mockRestore();
			consoleLogSpy.mockRestore();
		});

		test('should show error when no API key provided (null)', async () => {
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();
			const consoleLogSpy = jest
				.spyOn(console, 'log')
				.mockImplementation();

			await configCommand.action('set', 'gemini.apiKey', null);

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Please provide an API key.'
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				'\nUsage: nitrokit config set gemini.apiKey <YOUR_API_KEY>'
			);

			consoleErrorSpy.mockRestore();
			consoleLogSpy.mockRestore();
		});

		test('should show error when no API key provided (undefined)', async () => {
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();
			const consoleLogSpy = jest
				.spyOn(console, 'log')
				.mockImplementation();

			await configCommand.action('set', 'gemini.apiKey', undefined);

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Please provide an API key.'
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				'\nUsage: nitrokit config set gemini.apiKey <YOUR_API_KEY>'
			);

			consoleErrorSpy.mockRestore();
			consoleLogSpy.mockRestore();
		});

		test('should show error for unknown config key', async () => {
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();
			const consoleLogSpy = jest
				.spyOn(console, 'log')
				.mockImplementation();

			await configCommand.action('set', 'unknown.key', 'value');

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Unknown config key: "unknown.key"'
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				'Available keys: gemini.apiKey'
			);

			consoleErrorSpy.mockRestore();
			consoleLogSpy.mockRestore();
		});

		test('should show error for empty config key', async () => {
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();
			const consoleLogSpy = jest
				.spyOn(console, 'log')
				.mockImplementation();

			await configCommand.action('set', '', 'value');

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Unknown config key: ""'
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				'Available keys: gemini.apiKey'
			);

			consoleErrorSpy.mockRestore();
			consoleLogSpy.mockRestore();
		});

		test('should show error for null config key', async () => {
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();
			const consoleLogSpy = jest
				.spyOn(console, 'log')
				.mockImplementation();

			await configCommand.action('set', null, 'value');

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Unknown config key: "null"'
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				'Available keys: gemini.apiKey'
			);

			consoleErrorSpy.mockRestore();
			consoleLogSpy.mockRestore();
		});

		test('should show error for undefined config key', async () => {
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();
			const consoleLogSpy = jest
				.spyOn(console, 'log')
				.mockImplementation();

			await configCommand.action('set', undefined, 'value');

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Unknown config key: "undefined"'
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				'Available keys: gemini.apiKey'
			);

			consoleErrorSpy.mockRestore();
			consoleLogSpy.mockRestore();
		});
	});

	describe('unknown action', () => {
		test('should show error for unknown action', async () => {
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();

			await configCommand.action('unknown-action', 'key', 'value');

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Unknown action: "unknown-action". Available actions: set'
			);

			consoleErrorSpy.mockRestore();
		});

		test('should show error for empty action', async () => {
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();

			await configCommand.action('', 'key', 'value');

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Unknown action: "". Available actions: set'
			);

			consoleErrorSpy.mockRestore();
		});

		test('should show error for null action', async () => {
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();

			await configCommand.action(null, 'key', 'value');

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Unknown action: "null". Available actions: set'
			);

			consoleErrorSpy.mockRestore();
		});

		test('should show error for undefined action', async () => {
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();

			await configCommand.action(undefined, 'key', 'value');

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Unknown action: "undefined". Available actions: set'
			);

			consoleErrorSpy.mockRestore();
		});
	});

	describe('case sensitivity', () => {
		test('should be case sensitive for action names', async () => {
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();

			await configCommand.action('Set', 'gemini.apiKey', 'value');

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Unknown action: "Set". Available actions: set'
			);

			consoleErrorSpy.mockRestore();
		});

		test('should be case sensitive for config keys', async () => {
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();
			const consoleLogSpy = jest
				.spyOn(console, 'log')
				.mockImplementation();

			await configCommand.action('set', 'Gemini.ApiKey', 'value');

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Unknown config key: "Gemini.ApiKey"'
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				'Available keys: gemini.apiKey'
			);

			consoleErrorSpy.mockRestore();
			consoleLogSpy.mockRestore();
		});
	});

	describe('setConfig error handling', () => {
		test('should handle setConfig errors gracefully', async () => {
			const consoleLogSpy = jest
				.spyOn(console, 'log')
				.mockImplementation();
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();

			setConfig.mockRejectedValue(new Error('Config save failed'));

			// The function should throw an error when setConfig fails
			await expect(configCommand.action('set', 'gemini.apiKey', 'test-api-key'))
				.rejects.toThrow('Config save failed');

			// The function should still call setConfig
			expect(setConfig).toHaveBeenCalledWith(
				'geminiApiKey',
				'test-api-key'
			);

			consoleLogSpy.mockRestore();
			consoleErrorSpy.mockRestore();
		});
	});

	describe('parameter validation', () => {
		test('should handle missing key parameter', async () => {
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();

			await configCommand.action('set');

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Unknown config key: "undefined"'
			);

			consoleErrorSpy.mockRestore();
		});

		test('should handle missing value parameter', async () => {
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();
			const consoleLogSpy = jest
				.spyOn(console, 'log')
				.mockImplementation();

			await configCommand.action('set', 'gemini.apiKey');

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Please provide an API key.'
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				'\nUsage: nitrokit config set gemini.apiKey <YOUR_API_KEY>'
			);

			consoleErrorSpy.mockRestore();
			consoleLogSpy.mockRestore();
		});

		test('should handle all parameters missing', async () => {
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();

			await configCommand.action();

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Unknown action: "undefined". Available actions: set'
			);

			consoleErrorSpy.mockRestore();
		});
	});
});
