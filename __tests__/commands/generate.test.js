const generateCommand = require("../../src/commands/generate");

// --- Mock Dependencies ---
jest.mock("chalk", () => {
  // Create a mock that is an object with methods for each color.
  const createTag = jest.fn((strings, ...values) => {
    let str = strings[0];
    for (let i = 0; i < values.length; i++) {
      str += values[i] + strings[i + 1];
    }
    return str;
  });

  const chalkMock = {
    red: createTag,
    yellow: createTag,
    cyan: createTag,
    blue: createTag,
    green: createTag,
  };
  return chalkMock;
});

// Utility modüllerini mock'la
jest.mock("../../src/utils/generate/add-languages");
jest.mock("../../src/utils/generate/set-default-language");

const addLanguages = require("../../src/utils/generate/add-languages");
const setDefaultLanguage = require("../../src/utils/generate/set-default-language");

describe("generate command", () => {
  // Orijinal console.error'ı sakla
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    // Hata çıktısını testler sırasında mock'la (hata mesajlarının yakalanması için)
    console.error = jest.fn();
  });

  afterEach(() => {
    // Hata çıktısını geri yükle
    console.error = originalConsoleError;
  });

  describe("command structure", () => {
    test("should have correct command name", () => {
      expect(generateCommand.command).toBe("generate");
    });

    test("should have correct description", () => {
      expect(generateCommand.description).toBe(
        "Generates and/or modifies files based on a schematic."
      );
    });

    test("should have correct argument structure", () => {
      expect(generateCommand.argument).toEqual([
        "<schematic>",
        "The schematic to generate. Currently only 'language' is supported.",
      ]);
    });

    test("should have action function", () => {
      expect(typeof generateCommand.action).toBe("function");
    });
  });

  describe("language schematic", () => {
    test("should execute language generation successfully", async () => {
      const consoleLogSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      addLanguages.mockResolvedValue();
      setDefaultLanguage.mockResolvedValue();

      await generateCommand.action("language");

      expect(addLanguages).toHaveBeenCalled();
      expect(setDefaultLanguage).toHaveBeenCalled();
      // Çıktı mesajlarını kontrol et
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Next steps:")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("- Translate the JSON files in the new")
      );

      consoleLogSpy.mockRestore();
    });

    // Hata akışı: Artık process.exit(1) yerine throw Error kullanılıyor
    test("should throw error if addLanguages fails", async () => {
      const testError = new Error("Failed to add languages");
      addLanguages.mockRejectedValue(testError);
      setDefaultLanguage.mockResolvedValue();

      // Komutun fırlattığı genel hata mesajını yakala
      await expect(generateCommand.action("language")).rejects.toThrow(
        "Language generation failed."
      );

      // Orijinal hatanın konsola yazıldığını kontrol et
      expect(console.error).toHaveBeenCalledWith(testError);
      expect(setDefaultLanguage).not.toHaveBeenCalled();
    });

    // Hata akışı: Artık process.exit(1) yerine throw Error kullanılıyor
    test("should throw error if setDefaultLanguage fails", async () => {
      const testError = new Error("Failed to set default language");
      addLanguages.mockResolvedValue();
      setDefaultLanguage.mockRejectedValue(testError);

      await expect(generateCommand.action("language")).rejects.toThrow(
        "Language generation failed."
      );

      // Orijinal hatanın konsola yazıldığını kontrol et
      expect(console.error).toHaveBeenCalledWith(testError);
    });
  });

  describe("unknown schematic", () => {
    let consoleErrorSpy;
    let consoleLogSpy;

    beforeEach(() => {
      // console.error/log'u sadece bu blokta casusla, böylece diğer testleri etkilemez
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    test("should show error for unknown schematic", async () => {
      await generateCommand.action("unknown-schematic");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Unknown schematic: "unknown-schematic".'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Available schematics: language")
      );
    });

    test("should not call utility functions for unknown schematic", async () => {
      await generateCommand.action("unknown-schematic");

      expect(addLanguages).not.toHaveBeenCalled();
      expect(setDefaultLanguage).not.toHaveBeenCalled();
    });
  });
});
