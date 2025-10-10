// Jest setup dosyası
// Bu dosya testlerin çalıştırılmadan önce yapılacak genel ayarları içerir

// Global test timeout'u ayarla (30 saniye)
jest.setTimeout(30000);

// Test ortamında console.log'ları gizle (isteğe bağlı)
if (
	process.env.NODE_ENV === 'test' &&
	process.env.HIDE_CONSOLE_LOGS === 'true'
) {
	global.console = {
		...console,
		log: jest.fn(),
		debug: jest.fn(),
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
	};
}

// Test dosyaları için genel mock'lar
global.mockProcessExit = () => {
	const originalExit = process.exit;
	const mockExit = jest.fn((code) => {
		throw new Error(`process.exit(${code})`);
	});
	process.exit = mockExit;

	return {
		restore: () => {
			process.exit = originalExit;
		},
		mock: mockExit,
	};
};

// Test helper fonksiyonları
global.createMockPackage = (overrides = {}) => ({
	name: 'nitrokit-cli',
	version: '1.0.0',
	description: 'A CLI to create Nitrokit projects.',
	...overrides,
});

global.createMockConfig = (overrides = {}) => ({
	geminiApiKey: 'test-api-key',
	...overrides,
});

// Test sonrası temizlik
afterEach(() => {
	jest.clearAllMocks();
});

// Tüm testler bittikten sonra
afterAll(() => {
	// Global temizlik işlemleri
	jest.restoreAllMocks();
});
