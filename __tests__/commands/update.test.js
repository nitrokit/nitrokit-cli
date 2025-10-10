const fs = require("fs-extra");
const path = require("path");
const updateCommand = require("../../src/commands/update");

// --- Mock External Dependencies ---
jest.mock("fs-extra");
jest.mock("execa");
jest.mock("ora", () => {
  const mockSpinner = {
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    text: "",
  };
  return jest.fn(() => mockSpinner);
});
jest.mock("chalk", () => ({
  blue: jest.fn((...args) => args.join(" ")),
  green: jest.fn((...args) => args.join(" ")),
  red: jest.fn((...args) => args.join(" ")),
  yellow: jest.fn((...args) => args.join(" ")),
  cyan: jest.fn((...args) => args.join(" ")),
  bold: {
    green: jest.fn((...args) => args.join(" ")),
  },
}));

// Mock the new helper module
jest.mock("../../src/utils/update/helpers");
const {
  detectPackageManager,
  runUpdate,
  runSecurityAudit,
  createBackup,
} = require("../../src/utils/update/helpers");

describe("update command", () => {
  const originalCwd = process.cwd();
  const testProjectRoot = "/mock/project/root";

  let consoleLogSpy;
  let consoleErrorSpy;
  let exitSpy;

  beforeAll(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit called with code ${code}`);
    });
  });

  beforeAll(() => {
    // process.cwd'yi mock'la
    process.cwd = jest.fn(() => testProjectRoot);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Helper mock'larını varsayılan başarılı duruma ayarla
    detectPackageManager.mockResolvedValue("npm");
    runUpdate.mockResolvedValue();
    runSecurityAudit.mockResolvedValue();
    createBackup.mockResolvedValue("/mock/backup/path");

    // Konsol çıktılarını yakala
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  afterAll(() => {
    exitSpy.mockRestore();
    process.cwd = originalCwd;
  });

  afterAll(() => {
    process.cwd = originalCwd;
  });

  // --- Action Logic Tests ---

  describe("updateCommand.action", () => {
    const defaultOptions = { security: true, backup: true, mode: "safe" };

    test("should execute all steps successfully with default options", async () => {
      await updateCommand.action(defaultOptions);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "🚀 Starting Nitrokit Dependency Updater..."
      );
      expect(detectPackageManager).toHaveBeenCalledWith(testProjectRoot);
      expect(createBackup).toHaveBeenCalledWith(testProjectRoot);
      expect(runSecurityAudit).toHaveBeenCalledWith("npm", testProjectRoot);
      expect(runUpdate).toHaveBeenCalledWith(
        "npm",
        "safe",
        testProjectRoot
      );

      // Başarı mesajı kontrolü
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "\n🎉 Dependency update process completed successfully!"
      );
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test("should skip backup when --no-backup is passed", async () => {
      await updateCommand.action({ ...defaultOptions, backup: false });

      expect(createBackup).not.toHaveBeenCalled();
      expect(runSecurityAudit).toHaveBeenCalled();
      expect(runUpdate).toHaveBeenCalled();
    });

    test("should skip security audit when --no-security is passed", async () => {
      await updateCommand.action({ ...defaultOptions, security: false });

      expect(createBackup).toHaveBeenCalled();
      expect(runSecurityAudit).not.toHaveBeenCalled();
      expect(runUpdate).toHaveBeenCalled();
    });

    // --- Hata Yönetimi ---

    test("should throw error if no package manager is detected", async () => {
      detectPackageManager.mockResolvedValue(null);

      await expect(updateCommand.action(defaultOptions)).rejects.toThrow(
        "No package manager detected."
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error: No package manager detected. Make sure a `package.json` file exists."
      );
      expect(createBackup).not.toHaveBeenCalled(); // Akış durmalı
    });

    test("should throw error if backup creation fails", async () => {
      createBackup.mockRejectedValue(new Error("FS ERROR: Failed to write"));

      await expect(updateCommand.action(defaultOptions)).rejects.toThrow(
        "Backup failed."
      );
      expect(consoleErrorSpy).toHaveBeenCalled(); // Hata konsola yazılmalı
      expect(runUpdate).not.toHaveBeenCalled(); // Yedekleme başarısızsa güncelleme yapılmamalı
    });

    test("should throw error if runUpdate fails and report backup path", async () => {
      runUpdate.mockRejectedValue(new Error("NPM install failed"));
      const backupPath = "/mock/backup/path";

      await expect(updateCommand.action(defaultOptions)).rejects.toThrow(
        "Dependency update failed."
      );

      // Hata mesajları kontrolü
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "\nAn error occurred during the update process."
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `A backup was created. You can manually restore files from: ${backupPath}`
      );
    });

    test("should throw error if runUpdate fails but no backup was created", async () => {
      runUpdate.mockRejectedValue(new Error("YARN update failed"));

      // Yedekleme devre dışı
      await expect(
        updateCommand.action({ ...defaultOptions, backup: false })
      ).rejects.toThrow("Dependency update failed.");

      // Yedekleme raporu olmamalı
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("A backup was created.")
      );
    });

    test("should use the correct update mode", async () => {
      await updateCommand.action({ ...defaultOptions, mode: "major" });
      expect(runUpdate).toHaveBeenCalledWith("npm", "major", testProjectRoot);

      await updateCommand.action({ ...defaultOptions, mode: "minor" });
      expect(runUpdate).toHaveBeenCalledWith("npm", "minor", testProjectRoot);

      await updateCommand.action({ ...defaultOptions, mode: "patch" });
      expect(runUpdate).toHaveBeenCalledWith(
        "npm",
        "patch",
        testProjectRoot
      );
    });
  });
});
