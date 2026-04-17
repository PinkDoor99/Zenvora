/**
 * Batch processing system for Zenvora
 * Enables efficient processing of multiple files/tasks in parallel
 */

const pLimit = require('p-limit');

class BatchProcessor {
  constructor(options = {}) {
    this.concurrency = options.concurrency || 4; // Process 4 items concurrently
    this.batchSize = options.batchSize || 10; // Batch size for grouping
    this.timeout = options.timeout || 30000; // 30 second timeout per item
    this.retries = options.retries || 2; // Retry failed items
  }

  /**
   * Process batch of items with concurrency control
   */
  async processBatch(items, processor) {
    const limit = pLimit(this.concurrency);

    const promises = items.map(item =>
      limit(() => this.processWithRetry(item, processor))
    );

    return Promise.all(promises);
  }

  /**
   * Process item with retry logic
   */
  async processWithRetry(item, processor, attemptNumber = 0) {
    try {
      return await Promise.race([
        processor(item),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Processing timeout')), this.timeout)
        )
      ]);
    } catch (error) {
      if (attemptNumber < this.retries) {
        // Exponential backoff
        const delay = Math.pow(2, attemptNumber) * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.processWithRetry(item, processor, attemptNumber + 1);
      }
      return { item, error: error.message, attempts: attemptNumber + 1 };
    }
  }

  /**
   * Process files in batches (useful for large file sets)
   */
  async processBatches(items, processor, onBatchComplete) {
    const results = [];
    const batches = [];

    // Create batches
    for (let i = 0; i < items.length; i += this.batchSize) {
      batches.push(items.slice(i, i + this.batchSize));
    }

    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchResults = await this.processBatch(batch, processor);
      results.push(...batchResults);

      // Call progress callback
      if (onBatchComplete) {
        onBatchComplete({
          batchNumber: i + 1,
          totalBatches: batches.length,
          itemsProcessed: results.length,
          totalItems: items.length
        });
      }
    }

    return results;
  }

  /**
   * Parallel map operation
   */
  async map(items, mapper) {
    return this.processBatch(items, mapper);
  }

  /**
   * Parallel filter operation
   */
  async filter(items, predicate) {
    const results = await this.processBatch(items, predicate);
    return items.filter((_, i) => results[i]);
  }

  /**
   * Parallel reduce operation
   */
  async reduce(items, reducer, initialValue) {
    const limit = pLimit(this.concurrency);
    let accumulator = initialValue;

    for (const item of items) {
      accumulator = await limit(() => reducer(accumulator, item));
    }

    return accumulator;
  }

  /**
   * Queue-based processing (useful for long-running tasks)
   */
  createQueue() {
    return new BatchQueue(this.concurrency);
  }
}

/**
 * Queue for handling streaming/long-running tasks
 */
class BatchQueue {
  constructor(concurrency = 4) {
    this.concurrency = concurrency;
    this.queue = [];
    this.running = 0;
    this.limit = pLimit(concurrency);
    this.stats = {
      added: 0,
      completed: 0,
      failed: 0,
      startTime: Date.now()
    };
  }

  /**
   * Add task to queue
   */
  add(task) {
    this.queue.push(task);
    this.stats.added++;
    this.process();
  }

  /**
   * Add multiple tasks
   */
  addBatch(tasks) {
    this.queue.push(...tasks);
    this.stats.added += tasks.length;
    this.process();
  }

  /**
   * Process queue
   */
  async process() {
    if (this.running >= this.concurrency) return;

    while (this.queue.length > 0 && this.running < this.concurrency) {
      this.running++;
      const task = this.queue.shift();

      try {
        await this.limit(async () => {
          await task();
          this.stats.completed++;
        });
      } catch (error) {
        this.stats.failed++;
        console.error('Queue task error:', error);
      } finally {
        this.running--;
        this.process(); // Continue processing
      }
    }
  }

  /**
   * Wait for queue to empty
   */
  async drain() {
    return new Promise((resolve) => {
      const check = () => {
        if (this.queue.length === 0 && this.running === 0) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      ...this.stats,
      queueLength: this.queue.length,
      running: this.running,
      elapsedTime: Date.now() - this.stats.startTime,
      successRate: this.stats.completed / this.stats.added * 100 || 0
    };
  }
}

module.exports = {
  BatchProcessor,
  BatchQueue
};
