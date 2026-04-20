const axios = require('axios');
const fs = require('fs').promises;
const { VM } = require('vm2');
const indexer = require('./codebaseIndexer');
const hybridAI = require('./hybridAI');

class SimpleAgent {
  constructor() {
    this.tools = {
      read_file: this.readFile.bind(this),
      write_file: this.writeFile.bind(this),
      run_code: this.runCode.bind(this),
      search_codebase: this.searchCodebase.bind(this),
    };
  }

  async readFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return `File content:\n${content}`;
    } catch (error) {
      return `Error reading file: ${error.message}`;
    }
  }

  async writeFile(input) {
    try {
      const { filePath, content } = JSON.parse(input);
      await fs.writeFile(filePath, content, 'utf-8');
      return `Successfully wrote to ${filePath}`;
    } catch (error) {
      return `Error writing file: ${error.message}`;
    }
  }

  async runCode(code) {
    try {
      let output = '';
      const vm = new VM({
        timeout: 5000,
        sandbox: {
          console: {
            log: (...args) => output += args.join(' ') + '\n',
            error: (...args) => output += 'Error: ' + args.join(' ') + '\n',
            warn: (...args) => output += 'Warning: ' + args.join(' ') + '\n'
          }
        }
      });
      vm.run(code);
      return output.trim() || 'Code executed successfully (no output)';
    } catch (error) {
      return `Execution error: ${error.message}`;
    }
  }

  async searchCodebase(query) {
    try {
      const results = await indexer.search(query, 3);
      return results.map(r => `File: ${r.file}\n${r.content}`).join('\n\n');
    } catch (error) {
      return `Search error: ${error.message}`;
    }
  }

  async executeTask(task) {
    const messages = [{
      role: 'system',
      content: `You are an expert coding assistant with access to tools. Your task is: ${task}

Available tools:
- read_file(filePath): Read file contents
- write_file({"filePath": "path", "content": "text"}): Write to file
- run_code(code): Execute JavaScript safely
- search_codebase(query): Search codebase

Format your response as:
Thought: your reasoning
Action: tool_name(arguments)
Observation: tool result

Or Final Answer: your conclusion when done.

Break down complex tasks into steps.`
    }];

    const maxSteps = 10;
    const intermediateSteps = [];

    for (let i = 0; i < maxSteps; i++) {
      try {
        const aiResponse = await hybridAI.chat(messages);
        messages.push({ role: 'assistant', content: aiResponse });

        // Parse for tool call
        const actionMatch = aiResponse.match(/Action:\s*(\w+)\((.*)\)/);
        if (actionMatch) {
          const toolName = actionMatch[1];
          const toolArgs = actionMatch[2].trim();

          if (this.tools[toolName]) {
            const observation = await this.tools[toolName](toolArgs);
            messages.push({ role: 'user', content: `Observation: ${observation}` });
            intermediateSteps.push({
              action: { tool: toolName, toolInput: toolArgs },
              observation
            });
          } else {
            messages.push({ role: 'user', content: `Observation: Unknown tool ${toolName}` });
          }
        } else if (aiResponse.includes('Final Answer:')) {
          return {
            output: aiResponse.split('Final Answer:')[1].trim(),
            intermediateSteps
          };
        } else {
          // Continue thinking
          continue;
        }
      } catch (error) {
        return {
          output: `Error during task execution: ${error.message}`,
          intermediateSteps
        };
      }
    }

    return {
      output: 'Task execution reached maximum steps without completion.',
      intermediateSteps
    };
  }
}

module.exports = new SimpleAgent();
