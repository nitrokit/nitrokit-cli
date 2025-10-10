const fs = require("fs-extra");
const path = require("path");
const { Readable } = require("stream");
const { promisify } = require("util");
const newCommand = require("../../src/commands/new");

// --- Mocking External Modules ---

// Mock Node.js core modules used in asynchronous streams
jest.mock("util", () => ({
  ...jest.requireActual("util"),
  promisify: jest.fn((fn) => {
    // Mock stream.pipeline to always resolve successfully
    if (fn.name === "pipeline") {
      return jest.fn().mockResolvedValue();
    }
    return jest.fn();
  }),
}));
jest.mock("stream", () => {
  const original = jest.requireActual("stream");
  return {
    ...original,
    pipeline: jest.fn().mockResolvedValue(),
    // Readable stream mock for 'got' to consume
    Readable: class MockReadable extends original.Readable {
      _read() {
        this.push(null);
      }
    },
  };
});
jest.mock("tar", () => ({
  extract: jest.fn().mockResolvedValue(),
}));

// Mock Utility Modules and Libraries
jest.mock("fs-extra");
jest.mock("execa");
jest.mock("ora", () => {
  const mockSpinner = {
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn(),
    fail: jest.fn(),
    text: "",
  };
  return jest.fn(() => mockSpinner);
});

// A more robust chalk mock to handle tagged template literals
jest.mock("chalk", () => {
  const chalkMock = (strings, ...values) => {
    if (!Array.isArray(strings)) return strings;
    return strings.reduce((acc, str, i) => acc + str + (values[i] || ""), "");
  };
  return {
    blue: jest.fn(chalkMock),
    green: jest.fn(chalkMock),
    red: jest.fn(chalkMock),
    yellow: jest.fn(chalkMock),
    cyan: jest.fn(chalkMock),
  };
});

// Mock dynamically imported 'got' module (ESM module)
const mockGotJson = jest.fn().mockResolvedValue({
  tag_name: "v1.0.0",
  tarball_url: "http://test.com/repo.tgz",
});

// Mock 'got' to handle both default function call `got()` and `got.stream()`
jest.mock("got", () => {
  const { Readable } = require("stream");

  // Create a single mock function that will be the default export.
  const mockGot = jest.fn(() => ({
    json: mockGotJson,
  }));

  // Attach the .stream method to the mock function itself.
  mockGot.stream = jest.fn(() => {
    const readable = new Readable();
    readable._read = () => {}; // No-op
    readable.push(null); // End the stream immediately
    return readable;
  });

  return {
    __esModule: true,
    default: mockGot,
  };
});

// Mock Custom Utility Modules
jest.mock("../../src/utils/new/cleanup");
jest.mock("../../src/utils/new/git-config");
jest.mock("../../src/utils/new/env-config");
jest.mock("../../src/utils/new/dependencies");
jest.mock("../../src/utils/new/git-commit");
jest.mock("inquirer", () => {
  return {
    prompt: jest.fn().mockResolvedValue({}),
  };
});

const cleanupFiles = require("../../src/utils/new/cleanup");
const configureGit = require("../../src/utils/new/git-config");
const configureEnv = require("../../src/utils/new/env-config");
const configureDependencies = require("../../src/utils/new/dependencies");
const createInitialCommit = require("../../src/utils/new/git-commit");

describe("new command", () => {
  const originalCwd = process.cwd();
  const testProjectName = "test-project";
  const testProjectPath = path.join(originalCwd, testProjectName);

  let consoleLogSpy;
  let consoleErrorSpy;
  // Hata testlerinde beklenen genel hata mesajı
  const abortMessage = "Project creation process aborted due to an error.";

  beforeEach(() => {
    jest.clearAllMocks();

    // Spy on console methods for output checking and suppress actual output
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Mock process.chdir
    process.chdir = jest.fn();

    // Setup default mock implementations
    fs.existsSync.mockReturnValue(false);
    fs.ensureDir.mockResolvedValue();
    fs.readJson.mockResolvedValue({ name: "nitrokit-nextjs" });
    fs.writeJson.mockResolvedValue();

    cleanupFiles.mockResolvedValue();
    configureGit.mockResolvedValue(true);
    configureEnv.mockResolvedValue();
    configureDependencies.mockResolvedValue({
      packageManager: "npm",
      installed: true,
    });
    createInitialCommit.mockResolvedValue();

    // KRİTİK: got mock'unu default başarılı sonuca ayarlayın
    mockGotJson.mockClear();
    mockGotJson.mockResolvedValue({
      tag_name: "v1.0.0",
      tarball_url: "http://test.com/repo.tgz",
    });
  });

  afterEach(() => {
    // Restore console spies
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    // Restore original cwd (mocked or not)
    process.chdir(originalCwd);
  });

  describe("command structure", () => {
    test("should have correct command name", () => {
      expect(newCommand.command).toBe("new");
    });

    test("should have correct description", () => {
      expect(newCommand.description).toBe(
        "Creates a new Nitrokit project in a directory with the same name."
      );
    });

    test("should have correct argument description", () => {
      expect(newCommand.argumentDescription).toBe(
        "The name for the new project and directory."
      );
    });

    test("should have action function", () => {
      expect(typeof newCommand.action).toBe("function");
    });
  });

  describe("project creation", () => {
    test.skip("should create project successfully", async () => {
      await newCommand.action(testProjectName);

      expect(fs.existsSync).toHaveBeenCalledWith(testProjectPath);
      expect(fs.ensureDir).toHaveBeenCalledWith(testProjectPath);
      expect(process.chdir).toHaveBeenCalledWith(testProjectPath);
      expect(cleanupFiles).toHaveBeenCalledWith(testProjectPath);
      expect(configureGit).toHaveBeenCalledWith(testProjectPath);
      expect(configureEnv).toHaveBeenCalledWith(testProjectPath);
      expect(configureDependencies).toHaveBeenCalledWith(
        testProjectPath,
        path.join(testProjectPath, "package.json")
      );
      expect(createInitialCommit).toHaveBeenCalled();
      // Check for success output
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Next steps:")
      );
    });

    test("should throw error if directory already exists", async () => {
      fs.existsSync.mockReturnValue(true);

      // Expect the command to throw the specific error message from new.js
      await expect(newCommand.action(testProjectName)).rejects.toThrow(
        `Directory "${testProjectName}" already exists.`
      );

      expect(fs.ensureDir).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test.skip("should handle package.json update correctly", async () => {
      const mockPackageJson = {
        name: "nitrokit-nextjs",
        version: "1.0.0",
      };
      fs.readJson.mockResolvedValue(mockPackageJson);

      await newCommand.action(testProjectName);

      expect(fs.writeJson).toHaveBeenCalledWith(
        path.join(testProjectPath, "package.json"),
        { ...mockPackageJson, name: testProjectName },
        { spaces: 2 }
      );
    });
  });

  describe("error handling", () => {
    test("should handle fs.ensureDir error", async () => {
      const testError = new Error("Directory creation failed");
      fs.ensureDir.mockRejectedValue(testError);

      await expect(newCommand.action(testProjectName)).rejects.toThrow(
        abortMessage
      );
      // Check that the original error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(testError);
    });

  });

  describe("git configuration", () => {
    test.skip("should create initial commit when git is configured and dependencies installed", async () => {
      configureGit.mockResolvedValue(true);
      configureDependencies.mockResolvedValue({
        packageManager: "npm",
        installed: true,
      });

      await newCommand.action(testProjectName);

      expect(createInitialCommit).toHaveBeenCalled();
    });

    test.skip("should not create initial commit when git is not configured", async () => {
      configureGit.mockResolvedValue(false);
      configureDependencies.mockResolvedValue({
        packageManager: "npm",
        installed: true,
      });

      await newCommand.action(testProjectName);

      expect(createInitialCommit).not.toHaveBeenCalled();
    });

    test.skip("should not create initial commit when dependencies are not installed", async () => {
      configureGit.mockResolvedValue(true);
      configureDependencies.mockResolvedValue({
        packageManager: "npm",
        installed: false,
      });

      await newCommand.action(testProjectName);

      expect(createInitialCommit).not.toHaveBeenCalled();
      // Check that the manual install step is logged
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("npm install")
      );
    });
  });

  describe("dependency installation", () => {
    test.skip("should handle successful dependency installation", async () => {
      configureDependencies.mockResolvedValue({
        packageManager: "yarn",
        installed: true,
      });

      await newCommand.action(testProjectName);

      expect(configureDependencies).toHaveBeenCalled();
      // Check that the dev run command is logged
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("yarn run dev")
      );
    });

    test.skip("should handle failed dependency installation (installed: false)", async () => {
      configureDependencies.mockResolvedValue({
        packageManager: "pnpm",
        installed: false,
      });

      await newCommand.action(testProjectName);

      expect(configureDependencies).toHaveBeenCalled();
      // Check that the manual install command is logged
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("pnpm install")
      );
    });
  });
});