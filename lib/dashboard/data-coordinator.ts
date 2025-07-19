import { QueryClient } from '@tanstack/react-query';

type UpdateSource = 'manual' | 'poll' | 'cache';

interface UpdateMetadata {
  source: UpdateSource;
  timestamp: number;
  version: number;
}

interface DataUpdate<T> {
  key: string;
  data: T;
  metadata: UpdateMetadata;
}

export class DataCoordinator {
  private queryClient: QueryClient;
  private versions: Map<string, number> = new Map();
  private lastUpdate: Map<string, UpdateMetadata> = new Map();
  private updateQueue: DataUpdate<any>[] = [];
  private isProcessing = false;
  private debouncers: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEBOUNCE_DELAY: number;

  constructor(queryClient: QueryClient, options?: { debounceDelay?: number }) {
    this.queryClient = queryClient;
    this.DEBOUNCE_DELAY = options?.debounceDelay ?? 1000;
  }

  /**
   * Get the current version for a query key
   */
  private getVersion(key: string): number {
    return this.versions.get(key) || 0;
  }

  /**
   * Increment and return the new version for a query key
   */
  private incrementVersion(key: string): number {
    const newVersion = this.getVersion(key) + 1;
    this.versions.set(key, newVersion);
    return newVersion;
  }

  /**
   * Process queued updates
   */
  private async processQueue() {
    if (this.isProcessing || this.updateQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.updateQueue.length > 0) {
        const update = this.updateQueue.shift()!;
        
        // Check if this update should be applied based on conflict resolution
        if (this.shouldApplyUpdate(update)) {
          try {
            this.queryClient.setQueryData([update.key], update.data);
            this.lastUpdate.set(update.key, update.metadata);
          } catch (error) {
            console.error(`Failed to apply update for key ${update.key}:`, error);
            // Optionally, you could re-queue the update or emit an error event
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Determine if an update should be applied based on conflict resolution rules
   */
  private shouldApplyUpdate(update: DataUpdate<any>): boolean {
    const lastUpdate = this.lastUpdate.get(update.key);
    
    if (!lastUpdate) {
      // No previous update, apply this one
      return true;
    }

    // Conflict resolution priority: manual > poll > cache
    const sourcePriority: Record<UpdateSource, number> = {
      manual: 3,
      poll: 2,
      cache: 1,
    };

    const currentPriority = sourcePriority[update.metadata.source];
    const lastPriority = sourcePriority[lastUpdate.source];

    // If the new update has higher priority, apply it
    if (currentPriority > lastPriority) {
      return true;
    }

    // If same priority, use version to determine
    if (currentPriority === lastPriority) {
      return update.metadata.version > lastUpdate.version;
    }

    // Otherwise, skip this update
    return false;
  }

  /**
   * Update data from a manual action (highest priority)
   */
  updateFromManual<T>(key: string, data: T) {
    const update: DataUpdate<T> = {
      key,
      data,
      metadata: {
        source: 'manual',
        timestamp: Date.now(),
        version: this.incrementVersion(key),
      },
    };

    // Manual updates bypass the queue and are applied immediately
    this.queryClient.setQueryData([key], data);
    this.lastUpdate.set(key, update.metadata);
  }

  /**
   * Update data from polling (medium priority, debounced)
   */
  updateFromPoll<T>(key: string, data: T) {
    // Clear existing debouncer for this key
    const existingDebouncer = this.debouncers.get(key);
    if (existingDebouncer) {
      clearTimeout(existingDebouncer);
    }

    // Set up new debouncer
    const debouncer = setTimeout(() => {
      const update: DataUpdate<T> = {
        key,
        data,
        metadata: {
          source: 'poll',
          timestamp: Date.now(),
          version: this.incrementVersion(key),
        },
      };

      this.updateQueue.push(update);
      this.processQueue();
      this.debouncers.delete(key);
    }, this.DEBOUNCE_DELAY);

    this.debouncers.set(key, debouncer);
  }

  /**
   * Update data from cache (lowest priority)
   */
  updateFromCache<T>(key: string, data: T) {
    const update: DataUpdate<T> = {
      key,
      data,
      metadata: {
        source: 'cache',
        timestamp: Date.now(),
        version: this.incrementVersion(key),
      },
    };

    this.updateQueue.push(update);
    this.processQueue();
  }

  /**
   * Get metadata about the last update for a key
   */
  getLastUpdateMetadata(key: string): UpdateMetadata | undefined {
    return this.lastUpdate.get(key);
  }

  /**
   * Clear all data and reset state
   */
  clear() {
    this.versions.clear();
    this.lastUpdate.clear();
    this.updateQueue = [];
    this.debouncers.forEach(debouncer => clearTimeout(debouncer));
    this.debouncers.clear();
  }

  /**
   * Get debug information about the current state
   */
  getDebugInfo() {
    return {
      versions: Object.fromEntries(this.versions),
      lastUpdates: Object.fromEntries(this.lastUpdate),
      queueLength: this.updateQueue.length,
      isProcessing: this.isProcessing,
      activeDebouncers: Array.from(this.debouncers.keys()),
    };
  }
}