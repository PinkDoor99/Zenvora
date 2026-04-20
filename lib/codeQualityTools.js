const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const languageDetector = require('./languageDetector');

class CodeQualityTools {
  constructor() {
    this.tools = {
      javascript: {
        linters: ['eslint'],
        formatters: ['prettier'],
        availableCommands: {
          eslint: 'npx eslint',
          prettier: 'npx prettier'
        }
      },
      typescript: {
        linters: ['eslint', 'tsc'],
        formatters: ['prettier'],
        availableCommands: {
          eslint: 'npx eslint',
          tsc: 'npx tsc',
          prettier: 'npx prettier'
        }
      },
      python: {
        linters: ['pylint', 'flake8'],
        formatters: ['black', 'autopep8'],
        availableCommands: {
          pylint: 'python -m pylint',
          flake8: 'python -m flake8',
          black: 'python -m black',
          autopep8: 'python -m autopep8'
        }
      },
      java: {
        linters: ['checkstyle'],
        formatters: ['google-java-format'],
        availableCommands: {
          checkstyle: 'java -jar checkstyle.jar',
          'google-java-format': 'java -jar google-java-format.jar'
        }
      },
      cpp: {
        linters: ['cppcheck', 'clang-tidy'],
        formatters: ['clang-format'],
        availableCommands: {
          cppcheck: 'cppcheck',
          'clang-tidy': 'clang-tidy',
          'clang-format': 'clang-format'
        }
      },
      csharp: {
        linters: ['dotnet-format'],
        formatters: ['dotnet-format'],
        availableCommands: {
          'dotnet-format': 'dotnet format'
        }
      },
      go: {
        linters: ['golint', 'golangci-lint'],
        formatters: ['gofmt', 'goimports'],
        availableCommands: {
          golint: 'golint',
          'golangci-lint': 'golangci-lint',
          gofmt: 'gofmt',
          goimports: 'goimports'
        }
      },
      rust: {
        linters: ['cargo-clippy'],
        formatters: ['rustfmt'],
        availableCommands: {
          'cargo-clippy': 'cargo clippy',
          rustfmt: 'cargo fmt'
        }
      },
      php: {
        linters: ['phpcs'],
        formatters: ['phpcbf'],
        availableCommands: {
          phpcs: 'phpcs',
          phpcbf: 'phpcbf'
        }
      },
      ruby: {
        linters: ['rubocop'],
        formatters: ['rubocop'],
        availableCommands: {
          rubocop: 'rubocop'
        }
      }
    };
  }

  // Check if a tool is available on the system
  async isToolAvailable(toolName, language) {
    return new Promise((resolve) => {
      const command = this.tools[language]?.availableCommands?.[toolName];
      if (!command) {
        resolve(false);
        return;
      }

      // For npx commands, check if the package exists
      if (command.startsWith('npx ')) {
        const packageName = command.split(' ')[1];
        exec(`npm list -g ${packageName}`, (error) => {
          resolve(!error);
        });
      } else {
        exec(`${command} --version`, (error) => {
          resolve(!error);
        });
      }
    });
  }

  // Get available tools for a language
  async getAvailableTools(language) {
    const languageTools = this.tools[language];
    if (!languageTools) {
      return { linters: [], formatters: [] };
    }

    const availableLinters = [];
    const availableFormatters = [];

    // Check linters
    for (const linter of languageTools.linters) {
      if (await this.isToolAvailable(linter, language)) {
        availableLinters.push(linter);
      }
    }

    // Check formatters
    for (const formatter of languageTools.formatters) {
      if (await this.isToolAvailable(formatter, language)) {
        availableFormatters.push(formatter);
      }
    }

    return {
      linters: availableLinters,
      formatters: availableFormatters
    };
  }

  // Run linting on code
  async lintCode(code, language, filePath = null, options = {}) {
    const availableTools = await this.getAvailableTools(language);
    if (availableTools.linters.length === 0) {
      return {
        success: false,
        tool: null,
        output: `No linters available for ${language}. Please install one of: ${this.tools[language]?.linters?.join(', ') || 'none available'}`
      };
    }

    const linter = availableTools.linters[0]; // Use first available linter
    const command = this.tools[language].availableCommands[linter];

    try {
      // Create temporary file if no file path provided
      let tempFile = filePath;
      let cleanupTemp = false;

      if (!tempFile) {
        const tempDir = require('os').tmpdir();
        const ext = languageDetector.getLanguageInfo(language).extensions[0] || '.txt';
        tempFile = path.join(tempDir, `lint_${Date.now()}${ext}`);
        await fs.writeFile(tempFile, code);
        cleanupTemp = true;
      }

      // Run the linter
      const result = await this.runCommand(`${command} ${tempFile}`, options);

      // Cleanup temp file
      if (cleanupTemp) {
        try {
          await fs.unlink(tempFile);
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      return {
        success: result.code === 0,
        tool: linter,
        output: result.stdout || result.stderr,
        exitCode: result.code
      };

    } catch (error) {
      return {
        success: false,
        tool: linter,
        output: `Error running ${linter}: ${error.message}`,
        exitCode: -1
      };
    }
  }

  // Format code
  async formatCode(code, language, options = {}) {
    const availableTools = await this.getAvailableTools(language);
    if (availableTools.formatters.length === 0) {
      return {
        success: false,
        tool: null,
        formattedCode: code,
        output: `No formatters available for ${language}. Please install one of: ${this.tools[language]?.formatters?.join(', ') || 'none available'}`
      };
    }

    const formatter = availableTools.formatters[0]; // Use first available formatter
    const command = this.tools[language].availableCommands[formatter];

    try {
      // Create temporary file
      const tempDir = require('os').tmpdir();
      const ext = languageDetector.getLanguageInfo(language).extensions[0] || '.txt';
      const tempFile = path.join(tempDir, `format_${Date.now()}${ext}`);
      await fs.writeFile(tempFile, code);

      // Run the formatter
      let formatCommand;
      switch (formatter) {
        case 'prettier':
          formatCommand = `${command} --write ${tempFile}`;
          break;
        case 'black':
          formatCommand = `${command} ${tempFile}`;
          break;
        case 'gofmt':
          formatCommand = `${command} -w ${tempFile}`;
          break;
        case 'rustfmt':
          formatCommand = `${command} ${tempFile}`;
          break;
        case 'clang-format':
          formatCommand = `${command} -i ${tempFile}`;
          break;
        default:
          formatCommand = `${command} ${tempFile}`;
      }

      const result = await this.runCommand(formatCommand, options);

      // Read the formatted code
      const formattedCode = await fs.readFile(tempFile, 'utf8');

      // Cleanup
      try {
        await fs.unlink(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }

      return {
        success: result.code === 0,
        tool: formatter,
        formattedCode,
        output: result.stdout || result.stderr,
        exitCode: result.code
      };

    } catch (error) {
      return {
        success: false,
        tool: formatter,
        formattedCode: code,
        output: `Error running ${formatter}: ${error.message}`,
        exitCode: -1
      };
    }
  }

  // Run static analysis
  async analyzeCode(code, language, filePath = null, options = {}) {
    const availableTools = await this.getAvailableTools(language);
    if (availableTools.linters.length === 0) {
      return {
        success: false,
        tool: null,
        issues: [],
        output: `No analysis tools available for ${language}`
      };
    }

    const result = await this.lintCode(code, language, filePath, options);

    // Parse the output to extract issues
    const issues = this.parseLintOutput(result.output, result.tool, language);

    return {
      success: result.success,
      tool: result.tool,
      issues,
      output: result.output,
      exitCode: result.exitCode
    };
  }

  // Parse linter output to extract structured issues
  parseLintOutput(output, tool, language) {
    const issues = [];

    if (!output) return issues;

    const lines = output.split('\n');

    switch (tool) {
      case 'eslint':
        // Parse ESLint output
        lines.forEach(line => {
          const match = line.match(/(\d+):(\d+)\s+(\w+)\s+(.+)/);
          if (match) {
            issues.push({
              line: parseInt(match[1]),
              column: parseInt(match[2]),
              severity: match[3].toLowerCase(),
              message: match[4],
              rule: match[4].split(' ')[0]
            });
          }
        });
        break;

      case 'pylint':
        // Parse Pylint output
        lines.forEach(line => {
          const match = line.match(/(\w+):(\d+):(\d+):\s*(\w+):\s*(.+)/);
          if (match) {
            issues.push({
              file: match[1],
              line: parseInt(match[2]),
              column: parseInt(match[3]),
              severity: match[4].toLowerCase(),
              message: match[5]
            });
          }
        });
        break;

      case 'flake8':
        // Parse Flake8 output
        lines.forEach(line => {
          const match = line.match(/(.+):(\d+):(\d+):\s*(\w+)\s+(.+)/);
          if (match) {
            issues.push({
              file: match[1],
              line: parseInt(match[2]),
              column: parseInt(match[3]),
              code: match[4],
              message: match[5],
              severity: this.getFlake8Severity(match[4])
            });
          }
        });
        break;

      case 'golint':
        // Parse Golint output
        lines.forEach(line => {
          const match = line.match(/(.+):(\d+):(\d+):\s*(.+)/);
          if (match) {
            issues.push({
              file: match[1],
              line: parseInt(match[2]),
              column: parseInt(match[3]),
              message: match[4],
              severity: 'warning'
            });
          }
        });
        break;

      default:
        // Generic parsing for unknown tools
        lines.forEach(line => {
          if (line.includes('error') || line.includes('warning')) {
            issues.push({
              message: line,
              severity: line.includes('error') ? 'error' : 'warning'
            });
          }
        });
    }

    return issues;
  }

  // Helper to determine Flake8 severity from error code
  getFlake8Severity(code) {
    if (code.startsWith('E')) return 'error';
    if (code.startsWith('W')) return 'warning';
    if (code.startsWith('F')) return 'error';
    return 'info';
  }

  // Run a command and return the result
  runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const timeout = options.timeout || 30000; // 30 second default timeout

      exec(command, { timeout }, (error, stdout, stderr) => {
        resolve({
          code: error ? error.code : 0,
          stdout: stdout,
          stderr: stderr,
          error: error
        });
      });
    });
  }

  // Get supported languages
  getSupportedLanguages() {
    return Object.keys(this.tools);
  }

  // Get tool information for a language
  getLanguageTools(language) {
    return this.tools[language] || { linters: [], formatters: [], availableCommands: {} };
  }
}

module.exports = new CodeQualityTools();