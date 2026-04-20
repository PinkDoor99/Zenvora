const fs = require('fs');
const path = require('path');
const { pipeline } = require('@xenova/transformers');

// Simple in-memory vector store
class VectorStore {
  constructor() {
    this.vectors = [];
    this.metadata = [];
  }

  add(vector, meta) {
    this.vectors.push(vector);
    this.metadata.push(meta);
  }

  search(queryVector, topK = 5) {
    const similarities = this.vectors.map((vec, i) => ({
      similarity: this.cosineSimilarity(queryVector, vec),
      index: i
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, topK).map(s => this.metadata[s.index]);
  }

  cosineSimilarity(a, b) {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (normA * normB);
  }
}

class CodebaseIndexer {
  constructor() {
    this.store = new VectorStore();
    this.extractor = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    this.initialized = true;
  }

  async embedText(text) {
    await this.init();
    const output = await this.extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  async indexDirectory(dirPath, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
    await this.init();
    const files = this.getFilesRecursively(dirPath, extensions);

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const chunks = this.chunkText(content, 500);

        for (const chunk of chunks) {
          const embedding = await this.embedText(chunk);
          this.store.add(embedding, {
            file: path.relative(dirPath, file),
            content: chunk,
            type: 'code'
          });
        }
      } catch (error) {
        console.error(`Error indexing ${file}:`, error.message);
      }
    }
  }

  getFilesRecursively(dir, extensions) {
    const files = [];

    function traverse(currentDir) {
      const items = fs.readdirSync(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          traverse(fullPath);
        } else if (stat.isFile() && extensions.includes(path.extname(item))) {
          files.push(fullPath);
        }
      }
    }

    traverse(dir);
    return files;
  }

  chunkText(text, chunkSize) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }

  async search(query, topK = 5) {
    await this.init();
    const queryEmbedding = await this.embedText(query);
    return this.store.search(queryEmbedding, topK);
  }
}

module.exports = new CodebaseIndexer();
