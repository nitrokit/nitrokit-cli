const fs = require('fs-extra');
const os = require('os');
const path = require('path');

// Mock dependencies
jest.mock('fs-extra');
jest.mock('os');

// Mock os.homedir before requiring the config utility
const mockHomeDir = '/home/user';
os.homedir.mockReturnValue(mockHomeDir);

const { getConfig, setConfig } = require('../../src/utils/config');

describe('config utils', () => {
	const mockConfigDir = path.join(mockHomeDir, '.config', 'nitrokit-cli');
	const mockConfigPath = path.join(mockConfigDir, 'config.json');

	beforeEach(() => {
		jest.clearAllMocks();
		os.homedir.mockReturnValue(mockHomeDir);
	});

	describe('getConfig', () => {
		test('should return empty object when config file does not exist', async () => {
			fs.pathExists.mockResolvedValue(false);

			const result = await getConfig();

			expect(result).toEqual({});
			expect(fs.pathExists).toHaveBeenCalledWith(mockConfigPath);
			expect(fs.readJson).not.toHaveBeenCalled();
		});

		test('should return config object when file exists', async () => {
			const mockConfig = {
				geminiApiKey: 'test-api-key',
				someOtherSetting: 'value',
			};

			fs.pathExists.mockResolvedValue(true);
			fs.readJson.mockResolvedValue(mockConfig);

			const result = await getConfig();

			expect(result).toEqual(mockConfig);
			expect(fs.pathExists).toHaveBeenCalledWith(mockConfigPath);
			expect(fs.readJson).toHaveBeenCalledWith(mockConfigPath);
		});

		test('should return empty object when readJson fails', async () => {
			fs.pathExists.mockResolvedValue(true);
			fs.readJson.mockRejectedValue(new Error('Read error'));

			const result = await getConfig();

			expect(result).toEqual({});
			expect(fs.pathExists).toHaveBeenCalledWith(mockConfigPath);
			expect(fs.readJson).toHaveBeenCalledWith(mockConfigPath);
		});

		test('should return empty object when pathExists fails', async () => {
			fs.pathExists.mockRejectedValue(new Error('Path check error'));

			const result = await getConfig();

			expect(result).toEqual({});
			expect(fs.pathExists).toHaveBeenCalledWith(mockConfigPath);
			expect(fs.readJson).not.toHaveBeenCalled();
		});

		test('should handle malformed JSON gracefully', async () => {
			fs.pathExists.mockResolvedValue(true);
			fs.readJson.mockRejectedValue(new SyntaxError('Unexpected token'));

			const result = await getConfig();

			expect(result).toEqual({});
			expect(fs.pathExists).toHaveBeenCalledWith(mockConfigPath);
			expect(fs.readJson).toHaveBeenCalledWith(mockConfigPath);
		});
	});

	describe('setConfig', () => {
		test('should create config directory and save new config', async () => {
			fs.pathExists.mockResolvedValue(false);
			// When file doesn't exist, readJson shouldn't be called.
			fs.writeJson.mockResolvedValue();

			await setConfig('geminiApiKey', 'new-api-key');

			expect(fs.ensureDir).toHaveBeenCalledWith(mockConfigDir);
			expect(fs.readJson).not.toHaveBeenCalled();
			expect(fs.writeJson).toHaveBeenCalledWith(
				mockConfigPath,
				{ geminiApiKey: 'new-api-key' },
				{ spaces: 2 }
			);
		});

		test('should update existing config', async () => {
			const existingConfig = {
				geminiApiKey: 'old-api-key',
				otherSetting: 'value',
			};

			fs.pathExists.mockResolvedValue(true);
			fs.readJson.mockResolvedValue(existingConfig);
			fs.writeJson.mockResolvedValue();

			await setConfig('geminiApiKey', 'new-api-key');

			expect(fs.ensureDir).toHaveBeenCalledWith(mockConfigDir);
			expect(fs.readJson).toHaveBeenCalledWith(mockConfigPath);
			expect(fs.writeJson).toHaveBeenCalledWith(
				mockConfigPath,
				{
					geminiApiKey: 'new-api-key',
					otherSetting: 'value',
				},
				{ spaces: 2 }
			);
		});

		test('should add new key to existing config', async () => {
			const existingConfig = {
				geminiApiKey: 'existing-key',
			};

			fs.pathExists.mockResolvedValue(true);
			fs.readJson.mockResolvedValue(existingConfig);
			fs.writeJson.mockResolvedValue();

			await setConfig('newSetting', 'new-value');

			expect(fs.ensureDir).toHaveBeenCalledWith(mockConfigDir);
			expect(fs.readJson).toHaveBeenCalledWith(mockConfigPath);
			expect(fs.writeJson).toHaveBeenCalledWith(
				mockConfigPath,
				{
					geminiApiKey: 'existing-key',
					newSetting: 'new-value',
				},
				{ spaces: 2 }
			);
		});

		test('should handle ensureDir failure', async () => {
			fs.ensureDir.mockRejectedValue(
				new Error('Directory creation failed')
			);

			await expect(setConfig('geminiApiKey', 'test-key')).rejects.toThrow(
				'Directory creation failed'
			);

			expect(fs.ensureDir).toHaveBeenCalledWith(mockConfigDir);
			expect(fs.readJson).not.toHaveBeenCalled();
			expect(fs.writeJson).not.toHaveBeenCalled();
		});

		test('should handle readJson failure during setConfig', async () => {
			fs.ensureDir.mockResolvedValue();
			// pathExists is true, but readJson fails.
			fs.pathExists.mockResolvedValue(true);
			fs.readJson.mockRejectedValue(new Error('Read failed'));

			// If read fails, it should proceed as if the config was empty
			await setConfig('geminiApiKey', 'test-key');

			expect(fs.ensureDir).toHaveBeenCalledWith(mockConfigDir);
			expect(fs.readJson).toHaveBeenCalledWith(mockConfigPath);
			// It should still write the new value
			expect(fs.writeJson).toHaveBeenCalledWith(
				mockConfigPath,
				{ geminiApiKey: 'test-key' },
				{ spaces: 2 }
			);
		});

		test('should handle writeJson failure', async () => {
			fs.ensureDir.mockResolvedValue();
			fs.readJson.mockResolvedValue({});
			fs.writeJson.mockRejectedValue(new Error('Write failed'));

			await expect(setConfig('geminiApiKey', 'test-key')).rejects.toThrow(
				'Write failed'
			);

			expect(fs.ensureDir).toHaveBeenCalledWith(mockConfigDir);
			expect(fs.readJson).toHaveBeenCalledWith(mockConfigPath);
			expect(fs.writeJson).toHaveBeenCalledWith(
				mockConfigPath,
				{ geminiApiKey: 'test-key' },
				{ spaces: 2 }
			);
		});

		test('should handle null and undefined values', async () => {
			fs.ensureDir.mockResolvedValue();
			fs.readJson.mockResolvedValue({});
			fs.writeJson.mockResolvedValue();

			await setConfig('nullValue', null);

			expect(fs.writeJson).toHaveBeenCalledWith(
				mockConfigPath,
				{ nullValue: null },
				{ spaces: 2 }
			);

			await setConfig('undefinedValue', undefined);

			expect(fs.writeJson).toHaveBeenCalledWith(
				mockConfigPath,
				{ nullValue: null, undefinedValue: undefined },
				{ spaces: 2 }
			);
		});

		test('should handle complex values', async () => {
			fs.ensureDir.mockResolvedValue();
			fs.readJson.mockResolvedValue({});
			fs.writeJson.mockResolvedValue();

			const complexValue = {
				nested: {
					key: 'value',
					array: [1, 2, 3],
				},
			};

			await setConfig('complexKey', complexValue);

			expect(fs.writeJson).toHaveBeenCalledWith(
				mockConfigPath,
				{ complexKey: complexValue },
				{ spaces: 2 }
			);
		});
	});

	describe('integration scenarios', () => {
		test('should handle full config lifecycle', async () => {
			// First call - no config exists
			fs.pathExists.mockResolvedValue(false);
			let result = await getConfig();
			expect(result).toEqual({});

			// Set first config
			fs.ensureDir.mockResolvedValue();
			fs.readJson.mockResolvedValue({});
			fs.writeJson.mockResolvedValue();
			await setConfig('geminiApiKey', 'first-key');

			// Second call - config exists
			fs.pathExists.mockResolvedValue(true);
			fs.readJson.mockResolvedValue({ geminiApiKey: 'first-key' });
			result = await getConfig();
			expect(result).toEqual({ geminiApiKey: 'first-key' });

			// Update config
			fs.readJson.mockResolvedValue({ geminiApiKey: 'first-key' });
			await setConfig('geminiApiKey', 'updated-key');

			// Third call - updated config
			fs.readJson.mockResolvedValue({ geminiApiKey: 'updated-key' });
			result = await getConfig();
			expect(result).toEqual({ geminiApiKey: 'updated-key' });
		});

		test('should handle multiple concurrent setConfig calls', async () => {
			fs.ensureDir.mockResolvedValue();
			fs.readJson.mockResolvedValue({});
			fs.writeJson.mockResolvedValue();

			// Simulate concurrent calls
			const promises = [
				setConfig('key1', 'value1'),
				setConfig('key2', 'value2'),
				setConfig('key3', 'value3'),
			];

			await Promise.all(promises);

			expect(fs.ensureDir).toHaveBeenCalledTimes(3);
			expect(fs.writeJson).toHaveBeenCalledTimes(3);
		});
	});
});
