const path = require("path");

// Mock dependencies outside the describe block for consistent mocking
jest.mock("fs-extra");
jest.mock("../src/utils/check-for-updates");
jest.mock("../src/commands/new");
jest.mock("../src/commands/generate");
jest.mock("../src/commands/update");
jest.mock("../src/commands/translate");
jest.mock("../src/commands/config");

let mockProgram;

// Centralized mock for commander to ensure consistency
jest.mock("commander", () => {
  const originalModule = jest.requireActual("commander");
  return {
    ...originalModule,
    Command: jest.fn().mockImplementation(() => {
      mockProgram = {
        name: jest.fn().mockReturnThis(),
        description: jest.fn().mockReturnThis(),
        version: jest.fn().mockReturnThis(),
        command: jest.fn().mockReturnThis(),
        argument: jest.fn().mockReturnThis(),
        action: jest.fn().mockReturnThis(),
        option: jest.fn().mockReturnThis(),
        parseAsync: jest.fn().mockResolvedValue(),
      };
      return mockProgram;
    }),
  };
});

describe("index.js", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Mockları burada, require'dan önce kur
    const fs = require("fs-extra");
    fs.readJsonSync.mockReturnValue({
      name: "nitrokit-cli",
      version: "1.0.0",
    });

    // updateCommand mock'unu, index.js'in beklediği özelliklerle donat
    const updateCommand = require("../src/commands/update");
    updateCommand.command = "update";
    updateCommand.description = "Update project dependencies";
    updateCommand.action = jest.fn();
    updateCommand.options = [
      ["-m, --mode <mode>", "Update strategy", "safe"],
    ];

    // index.js'i mock'lar kurulduktan sonra yükle
    require("../index.js");
  });

  describe("program initialization", () => {
    test("should create Command instance", async () => {
      const { Command } = require("commander");
      expect(Command).toHaveBeenCalledTimes(1);
    });

    test("should set program name, description and version", async () => {
      expect(mockProgram.name).toHaveBeenCalledWith("nitrokit");
      expect(mockProgram.description).toHaveBeenCalledWith(
        "A CLI to help create and manage Nitrokit projects."
      );
      expect(mockProgram.version).toHaveBeenCalledWith("1.0.0");
    });

    test("should read package.json for version", async () => {
      const fs = require("fs-extra");
      expect(fs.readJsonSync).toHaveBeenCalledWith(
        path.join(__dirname, "..", "package.json")
      );
    });
  });

  // Diğer testler (command registration, async execution vb.) aynı mantıkla düzenlenebilir.
});
