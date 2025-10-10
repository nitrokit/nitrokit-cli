const checkForUpdates = require('../../src/utils/check-for-updates');

// Mock dependencies
jest.mock('chalk', () => ({
	bold: {
		cyan: jest.fn((text) => text),
	},
	dim: jest.fn((text) => text),
	green: jest.fn((text) => text),
}));
jest.mock('boxen', () => jest.fn((text, options) => text));
jest.mock('latest-version');
jest.mock('semver');

const latestVersion = require('latest-version');
const semver = require('semver');

describe('check-for-updates', () => {
	const mockPackage = {
		name: 'nitrokit-cli',
		version: '1.0.0',
	};

	beforeEach(() => {
		jest.clearAllMocks();
		// Mock console.log to prevent actual output during tests
		jest.spyOn(console, 'log').mockImplementation();
	});

	afterEach(() => {
		console.log.mockRestore();
	});

	describe('update available', () => {
		test('should show update message when newer version is available', async () => {
			latestVersion.mockResolvedValue('1.1.0');
			semver.gt.mockReturnValue(true);

			await checkForUpdates(mockPackage);

			expect(latestVersion).toHaveBeenCalledWith('nitrokit-cli');
			expect(semver.gt).toHaveBeenCalledWith('1.1.0', '1.0.0');
			expect(console.log).toHaveBeenCalled();
		});

		test('should show correct update commands in message', async () => {
			latestVersion.mockResolvedValue('2.0.0');
			semver.gt.mockReturnValue(true);

			await checkForUpdates(mockPackage);

			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('npm install -g nitrokit-cli')
			);
			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('pnpm add -g nitrokit-cli')
			);
			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('yarn global add nitrokit-cli')
			);
		});

		test('should show current and latest versions', async () => {
			latestVersion.mockResolvedValue('1.5.0');
			semver.gt.mockReturnValue(true);

			await checkForUpdates(mockPackage);

			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('Current: 1.0.0')
			);
			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('Latest: 1.5.0')
			);
		});
	});

	describe('no update available', () => {
		test('should not show message when current version is latest', async () => {
			latestVersion.mockResolvedValue('1.0.0');
			semver.gt.mockReturnValue(false);

			await checkForUpdates(mockPackage);

			expect(latestVersion).toHaveBeenCalledWith('nitrokit-cli');
			expect(semver.gt).toHaveBeenCalledWith('1.0.0', '1.0.0');
			expect(console.log).not.toHaveBeenCalled();
		});

		test('should not show message when current version is newer', async () => {
			latestVersion.mockResolvedValue('0.9.0');
			semver.gt.mockReturnValue(false);

			await checkForUpdates(mockPackage);

			expect(latestVersion).toHaveBeenCalledWith('nitrokit-cli');
			expect(semver.gt).toHaveBeenCalledWith('0.9.0', '1.0.0');
			expect(console.log).not.toHaveBeenCalled();
		});
	});

	describe('error handling', () => {
		test('should handle latestVersion network error gracefully', async () => {
			latestVersion.mockRejectedValue(new Error('Network error'));

			await checkForUpdates(mockPackage);

			expect(latestVersion).toHaveBeenCalledWith('nitrokit-cli');
			expect(console.log).not.toHaveBeenCalled();
		});

		test('should handle latestVersion timeout error gracefully', async () => {
			latestVersion.mockRejectedValue(new Error('Timeout'));

			await checkForUpdates(mockPackage);

			expect(latestVersion).toHaveBeenCalledWith('nitrokit-cli');
			expect(console.log).not.toHaveBeenCalled();
		});

		test('should handle latestVersion permission error gracefully', async () => {
			latestVersion.mockRejectedValue(new Error('Permission denied'));

			await checkForUpdates(mockPackage);

			expect(latestVersion).toHaveBeenCalledWith('nitrokit-cli');
			expect(console.log).not.toHaveBeenCalled();
		});

		test('should handle latestVersion not found error gracefully', async () => {
			latestVersion.mockRejectedValue(new Error('Package not found'));

			await checkForUpdates(mockPackage);

			expect(latestVersion).toHaveBeenCalledWith('nitrokit-cli');
			expect(console.log).not.toHaveBeenCalled();
		});
	});

	describe('different package versions', () => {
		test('should work with different package names', async () => {
			const customPackage = {
				name: 'custom-cli',
				version: '2.1.0',
			};

			latestVersion.mockResolvedValue('2.2.0');
			semver.gt.mockReturnValue(true);

			await checkForUpdates(customPackage);

			expect(latestVersion).toHaveBeenCalledWith('custom-cli');
			expect(semver.gt).toHaveBeenCalledWith('2.2.0', '2.1.0');
			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('npm install -g custom-cli')
			);
		});

		test('should work with prerelease versions', async () => {
			const prereleasePackage = {
				name: 'nitrokit-cli',
				version: '1.0.0-beta.1',
			};

			latestVersion.mockResolvedValue('1.0.0');
			semver.gt.mockReturnValue(true);

			await checkForUpdates(prereleasePackage);

			expect(latestVersion).toHaveBeenCalledWith('nitrokit-cli');
			expect(semver.gt).toHaveBeenCalledWith('1.0.0', '1.0.0-beta.1');
		});

		test('should work with patch versions', async () => {
			const patchPackage = {
				name: 'nitrokit-cli',
				version: '1.0.1',
			};

			latestVersion.mockResolvedValue('1.0.2');
			semver.gt.mockReturnValue(true);

			await checkForUpdates(patchPackage);

			expect(latestVersion).toHaveBeenCalledWith('nitrokit-cli');
			expect(semver.gt).toHaveBeenCalledWith('1.0.2', '1.0.1');
		});
	});

	describe('edge cases', () => {
		test('should handle empty package object', async () => {
			const emptyPackage = {};

			latestVersion.mockRejectedValue(new Error('Invalid package'));

			await checkForUpdates(emptyPackage);

			expect(latestVersion).toHaveBeenCalledWith(undefined);
			expect(console.log).not.toHaveBeenCalled();
		});

		test('should handle null package', async () => {
			latestVersion.mockRejectedValue(new Error('Invalid package'));

			await checkForUpdates(null);

			// When package is null, latestVersion should not be called
			expect(latestVersion).not.toHaveBeenCalled();
			expect(console.log).not.toHaveBeenCalled();
		});

		test('should handle undefined package', async () => {
			latestVersion.mockRejectedValue(new Error('Invalid package'));

			await checkForUpdates(undefined);

			// When package is undefined, latestVersion should not be called
			expect(latestVersion).not.toHaveBeenCalled();
			expect(console.log).not.toHaveBeenCalled();
		});
	});
});
