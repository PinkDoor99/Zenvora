/**
 * Performance monitoring and profiling system
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.timings = new Map();
    this.startTime = Date.now();
    this.memorySnapshots = [];
  }

  /**
   * Start timing an operation
   */
  startTimer(label) {
    if (!this.timings.has(label)) {
      this.timings.set(label, []);
    }
    return {
      label,
      startTime: process.hrtime.bigint(),
      start: Date.now()
    };
  }

  /**
   * End timing and record
   */
  endTimer(timer) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - timer.startTime) / 1000000; // Convert to milliseconds

    const timings = this.timings.get(timer.label);
    timings.push(duration);

    return {
      label: timer.label,
      duration: duration.toFixed(3),
      unit: 'ms'
    };
  }

  /**
   * Record a metric
   */
  recordMetric(name, value, metadata = {}) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name).push({
      value,
      timestamp: Date.now(),
      metadata
    });
  }

  /**
   * Get timing statistics
   */
  getTimingStats(label) {
    const timings = this.timings.get(label) || [];

    if (timings.length === 0) {
      return null;
    }

    const sorted = timings.sort((a, b) => a - b);
    const avg = timings.reduce((a, b) => a + b) / timings.length;
    const median = sorted[Math.floor(sorted.length / 2)];

    return {
      label,
      count: timings.length,
      avg: avg.toFixed(3),
      min: sorted[0].toFixed(3),
      max: sorted[sorted.length - 1].toFixed(3),
      median: median.toFixed(3),
      p95: sorted[Math.floor(sorted.length * 0.95)].toFixed(3),
      p99: sorted[Math.floor(sorted.length * 0.99)].toFixed(3),
      unit: 'ms'
    };
  }

  /**
   * Get all timing statistics
   */
  getAllTimingStats() {
    const stats = {};

    for (const [label] of this.timings.entries()) {
      stats[label] = this.getTimingStats(label);
    }

    return stats;
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();

    return {
      rss: (usage.rss / 1024 / 1024).toFixed(2), // MB
      heapTotal: (usage.heapTotal / 1024 / 1024).toFixed(2),
      heapUsed: (usage.heapUsed / 1024 / 1024).toFixed(2),
      external: (usage.external / 1024 / 1024).toFixed(2),
      arrayBuffers: (usage.arrayBuffers / 1024 / 1024).toFixed(2),
      unit: 'MB'
    };
  }

  /**
   * Snapshot memory at a point in time
   */
  snapshotMemory(label) {
    this.memorySnapshots.push({
      label,
      timestamp: Date.now(),
      memory: this.getMemoryUsage()
    });
  }

  /**
   * Get memory growth between snapshots
   */
  getMemoryGrowth(label1, label2) {
    const snap1 = this.memorySnapshots.find(s => s.label === label1);
    const snap2 = this.memorySnapshots.find(s => s.label === label2);

    if (!snap1 || !snap2) {
      return null;
    }

    return {
      label1,
      label2,
      timeElapsed: snap2.timestamp - snap1.timestamp,
      heapDelta: (parseFloat(snap2.memory.heapUsed) - parseFloat(snap1.memory.heapUsed)).toFixed(2),
      rssDelta: (parseFloat(snap2.memory.rss) - parseFloat(snap1.memory.rss)).toFixed(2),
      unit: 'MB'
    };
  }

  /**
   * Get comprehensive performance report
   */
  getReport() {
    return {
      uptime: Date.now() - this.startTime,
      memory: this.getMemoryUsage(),
      timings: this.getAllTimingStats(),
      metrics: Object.fromEntries(this.metrics),
      memorySnapshots: this.memorySnapshots
    };
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
    this.timings.clear();
    this.memorySnapshots = [];
    this.startTime = Date.now();
  }

  /**
   * Export report as JSON
   */
  exportReport() {
    return JSON.stringify(this.getReport(), null, 2);
  }
}

/**
 * Profiler for function execution
 */
class FunctionProfiler {
  constructor() {
    this.profiles = new Map();
  }

  /**
   * Profile a function
   */
  profile(fn, name = fn.name) {
    const profiler = this;

    return async function (...args) {
      if (!profiler.profiles.has(name)) {
        profiler.profiles.set(name, []);
      }

      const start = process.hrtime.bigint();
      const startMemory = process.memoryUsage().heapUsed;

      try {
        const result = await fn.apply(this, args);

        const end = process.hrtime.bigint();
        const endMemory = process.memoryUsage().heapUsed;

        profiler.profiles.get(name).push({
          duration: Number(end - start) / 1000000,
          memoryDelta: (endMemory - startMemory) / 1024,
          timestamp: Date.now(),
          success: true
        });

        return result;
      } catch (error) {
        const end = process.hrtime.bigint();
        const endMemory = process.memoryUsage().heapUsed;

        profiler.profiles.get(name).push({
          duration: Number(end - start) / 1000000,
          memoryDelta: (endMemory - startMemory) / 1024,
          timestamp: Date.now(),
          success: false,
          error: error.message
        });

        throw error;
      }
    };
  }

  /**
   * Get profile statistics
   */
  getProfileStats(name) {
    const profile = this.profiles.get(name);

    if (!profile || profile.length === 0) {
      return null;
    }

    const durations = profile.map(p => p.duration);
    const sorted = durations.sort((a, b) => a - b);
    const avg = durations.reduce((a, b) => a + b) / durations.length;

    return {
      name,
      calls: profile.length,
      avgDuration: avg.toFixed(3),
      minDuration: sorted[0].toFixed(3),
      maxDuration: sorted[sorted.length - 1].toFixed(3),
      successRate: (profile.filter(p => p.success).length / profile.length * 100).toFixed(1),
      unit: 'ms'
    };
  }

  /**
   * Get all profile statistics
   */
  getAllStats() {
    const stats = {};

    for (const name of this.profiles.keys()) {
      stats[name] = this.getProfileStats(name);
    }

    return stats;
  }

  /**
   * Clear profiles
   */
  clear() {
    this.profiles.clear();
  }
}

module.exports = {
  PerformanceMonitor,
  FunctionProfiler,
  monitor: new PerformanceMonitor(),
  profiler: new FunctionProfiler()
};
