import { QueryClient } from '@tanstack/react-query';
import { DataCoordinator } from '@/lib/dashboard/data-coordinator';

describe('DataCoordinator', () => {
  let queryClient: QueryClient;
  let coordinator: DataCoordinator;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    coordinator = new DataCoordinator(queryClient);
  });

  afterEach(() => {
    coordinator.clear();
  });

  describe('Manual Updates', () => {
    it('should apply manual updates immediately', () => {
      const testData = { count: 42 };
      coordinator.updateFromManual('stats', testData);

      const storedData = queryClient.getQueryData(['stats']);
      expect(storedData).toEqual(testData);
    });

    it('should always override previous updates with manual updates', async () => {
      // First set data from poll
      coordinator.updateFromPoll('stats', { count: 10 });
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Then update manually
      coordinator.updateFromManual('stats', { count: 20 });

      const storedData = queryClient.getQueryData(['stats']);
      expect(storedData).toEqual({ count: 20 });
    });
  });

  describe('Poll Updates', () => {
    it('should debounce poll updates', async () => {
      coordinator.updateFromPoll('stats', { count: 1 });
      coordinator.updateFromPoll('stats', { count: 2 });
      coordinator.updateFromPoll('stats', { count: 3 });

      // Data should not be updated immediately
      expect(queryClient.getQueryData(['stats'])).toBeUndefined();

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Only the last update should be applied
      const storedData = queryClient.getQueryData(['stats']);
      expect(storedData).toEqual({ count: 3 });
    });

    it('should not override manual updates with poll updates', async () => {
      // First set data manually
      coordinator.updateFromManual('stats', { count: 100 });

      // Then try to update from poll
      coordinator.updateFromPoll('stats', { count: 50 });
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Manual update should still be in place
      const storedData = queryClient.getQueryData(['stats']);
      expect(storedData).toEqual({ count: 100 });
    });
  });

  describe('Cache Updates', () => {
    it('should apply cache updates with lowest priority', () => {
      coordinator.updateFromCache('stats', { count: 5 });
      
      // Cache updates are processed asynchronously but quickly
      setTimeout(() => {
        const storedData = queryClient.getQueryData(['stats']);
        expect(storedData).toEqual({ count: 5 });
      }, 10);
    });

    it('should not override poll or manual updates with cache updates', async () => {
      // Set data from poll
      coordinator.updateFromPoll('stats', { count: 20 });
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Try to update from cache
      coordinator.updateFromCache('stats', { count: 10 });

      // Give time for processing
      await new Promise(resolve => setTimeout(resolve, 50));

      // Poll update should still be in place
      const storedData = queryClient.getQueryData(['stats']);
      expect(storedData).toEqual({ count: 20 });
    });
  });

  describe('Version Tracking', () => {
    it('should increment versions for each update', () => {
      coordinator.updateFromManual('stats', { count: 1 });
      const metadata1 = coordinator.getLastUpdateMetadata('stats');
      expect(metadata1?.version).toBe(1);

      coordinator.updateFromManual('stats', { count: 2 });
      const metadata2 = coordinator.getLastUpdateMetadata('stats');
      expect(metadata2?.version).toBe(2);
    });

    it('should track versions independently for different keys', () => {
      coordinator.updateFromManual('stats', { count: 1 });
      coordinator.updateFromManual('calls', { total: 10 });
      coordinator.updateFromManual('stats', { count: 2 });

      const statsMetadata = coordinator.getLastUpdateMetadata('stats');
      const callsMetadata = coordinator.getLastUpdateMetadata('calls');

      expect(statsMetadata?.version).toBe(2);
      expect(callsMetadata?.version).toBe(1);
    });
  });

  describe('Debug Information', () => {
    it('should provide debug information', async () => {
      coordinator.updateFromManual('stats', { count: 1 });
      coordinator.updateFromPoll('calls', { total: 10 });

      const debugInfo = coordinator.getDebugInfo();

      expect(debugInfo.versions).toHaveProperty('stats', 1);
      expect(debugInfo.versions).toHaveProperty('calls', 1);
      expect(debugInfo.lastUpdates).toHaveProperty('stats');
      expect(debugInfo.activeDebouncers).toContain('calls');

      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 1100));

      const debugInfoAfter = coordinator.getDebugInfo();
      expect(debugInfoAfter.activeDebouncers).not.toContain('calls');
    });
  });

  describe('Clear Functionality', () => {
    it('should clear all state', async () => {
      coordinator.updateFromManual('stats', { count: 1 });
      coordinator.updateFromPoll('calls', { total: 10 });

      coordinator.clear();

      const debugInfo = coordinator.getDebugInfo();
      expect(debugInfo.versions).toEqual({});
      expect(debugInfo.lastUpdates).toEqual({});
      expect(debugInfo.queueLength).toBe(0);
      expect(debugInfo.activeDebouncers).toEqual([]);
    });
  });
});