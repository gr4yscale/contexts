import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Pool } from 'pg';
import { initializeDB, getConnection, closeDB } from './db.mts';

// Mock the pg module
vi.mock('pg', () => {
  const mockQuery = vi.fn();
  const mockRelease = vi.fn();
  const mockClient = {
    query: mockQuery,
    release: mockRelease,
  };
  const mockConnect = vi.fn().mockResolvedValue(mockClient);
  const mockEnd = vi.fn();
  const MockPool = vi.fn(() => ({
    connect: mockConnect,
    end: mockEnd,
  }));
  
  return {
    Pool: MockPool,
  };
});

describe('Database Module', () => {
  let mockPool: any;
  let mockClient: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = { query: vi.fn(), release: vi.fn() };
    mockPool = { connect: vi.fn().mockResolvedValue(mockClient), end: vi.fn() };
    (Pool as any).mockImplementation(() => mockPool);
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initializeDB', () => {
    it('should initialize the database connection', async () => {
      await initializeDB();
      
      expect(Pool).toHaveBeenCalledWith({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'postgres',
        database: 'contexts',
      });
      expect(mockPool.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS migrations')
      );
    });
    
    it('should not reinitialize if already initialized', async () => {
      await initializeDB();
      await initializeDB(); // Second call
      
      expect(mockPool.connect).toHaveBeenCalledTimes(1);
    });
    
    it('should throw an error if connection fails', async () => {
      const error = new Error('Connection error');
      mockPool.connect.mockRejectedValueOnce(error);
      
      await expect(initializeDB()).rejects.toThrow('Connection error');
    });
  });

  describe('getConnection', () => {
    it('should return the client after initializing', async () => {
      const connection = await getConnection();
      
      expect(connection).toBe(mockClient);
      expect(mockPool.connect).toHaveBeenCalledTimes(1);
    });
    
    it('should throw an error if client is not initialized', async () => {
      // Simulate initialization failure
      mockPool.connect.mockRejectedValueOnce(new Error('Init error'));
      
      await expect(getConnection()).rejects.toThrow();
    });
  });

  describe('closeDB', () => {
    it('should release the client and end the pool', async () => {
      await initializeDB();
      await closeDB();
      
      expect(mockClient.release).toHaveBeenCalledTimes(1);
      expect(mockPool.end).toHaveBeenCalledTimes(1);
    });
    
    it('should handle case when client is not initialized', async () => {
      await closeDB();
      
      expect(mockClient.release).not.toHaveBeenCalled();
      expect(mockPool.end).toHaveBeenCalledTimes(1);
    });
    
    it('should throw an error if closing fails', async () => {
      await initializeDB();
      
      const error = new Error('Close error');
      mockClient.release.mockRejectedValueOnce(error);
      
      await expect(closeDB()).rejects.toThrow('Close error');
    });
  });
});
