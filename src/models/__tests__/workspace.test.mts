import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getAllWorkspaces, 
  createWorkspaceForActivity, 
  updateWorkspace, 
  assignWorkspaceToActivity,
  getWorkspacesForActivity,
  getWorkspaceById,
  deleteWorkspaceById,
  WorkspaceDTO
} from '../workspace.mts';
import { getConnection } from '../../db.mts';

// Mock the database connection
vi.mock('../../db.mts', () => {
  const mockQuery = vi.fn();
  const mockClient = {
    query: mockQuery,
    release: vi.fn(),
  };
  
  return {
    getConnection: vi.fn().mockResolvedValue(mockClient),
    initializeDB: vi.fn(),
    closeDB: vi.fn(),
  };
});

describe('Workspace Model', () => {
  let mockClient: any;
  
  beforeEach(async () => {
    vi.clearAllMocks();
    mockClient = await getConnection();
  });

  describe('getAllWorkspaces', () => {
    it('should return an empty array when no workspaces exist', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      const result = await getAllWorkspaces();
      
      expect(result).toEqual([]);
      expect(mockClient.query).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    });

    it('should return all workspaces', async () => {
      const mockWorkspaces = [
        { id: 1, activityid: 'act1', name: 'Workspace 1', activityname: 'Activity 1' },
        { id: 2, activityid: 'act2', name: 'Workspace 2', activityname: 'Activity 2' }
      ];
      
      mockClient.query.mockResolvedValueOnce({ rows: mockWorkspaces });
      
      const result = await getAllWorkspaces();
      
      expect(result).toEqual([
        { id: 1, activityId: 'act1', name: 'Workspace 1', activityName: 'Activity 1' },
        { id: 2, activityId: 'act2', name: 'Workspace 2', activityName: 'Activity 2' }
      ]);
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('createWorkspaceForActivity', () => {
    it('should create a new workspace for an activity', async () => {
      const mockWorkspace = { id: 1, activityid: 'act1', name: 'New Workspace' };
      mockClient.query.mockResolvedValueOnce({ rows: [mockWorkspace] });
      
      const result = await createWorkspaceForActivity('act1', 'New Workspace');
      
      expect(result).toEqual({
        id: 1,
        activityId: 'act1',
        name: 'New Workspace'
      });
      expect(mockClient.query).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO workspaces'),
        ['act1', 'New Workspace']
      );
    });

    it('should throw an error when maximum workspaces is reached', async () => {
      const error = new Error('relation "workspace_id_seq" does not exist');
      mockClient.query.mockRejectedValueOnce(error);
      
      await expect(createWorkspaceForActivity('act1', 'New Workspace'))
        .rejects.toThrow('Maximum number of workspaces reached');
    });

    it('should throw other errors', async () => {
      const error = new Error('Database error');
      mockClient.query.mockRejectedValueOnce(error);
      
      await expect(createWorkspaceForActivity('act1', 'New Workspace'))
        .rejects.toThrow('Database error');
    });
  });

  describe('updateWorkspace', () => {
    it('should update workspace fields', async () => {
      mockClient.query.mockResolvedValueOnce({});
      
      const workspace: Partial<WorkspaceDTO> = {
        id: 1,
        name: 'Updated Workspace',
        activityId: 'act2'
      };
      
      await updateWorkspace(workspace);
      
      expect(mockClient.query).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE workspaces SET'),
        expect.arrayContaining(['act2', 'Updated Workspace', 1])
      );
    });

    it('should throw an error when no fields to update', async () => {
      const workspace: Partial<WorkspaceDTO> = { id: 1 };
      
      await expect(updateWorkspace(workspace))
        .rejects.toThrow('No fields to update');
      
      expect(mockClient.query).not.toHaveBeenCalled();
    });
  });

  describe('assignWorkspaceToActivity', () => {
    it('should assign a workspace to an activity', async () => {
      mockClient.query.mockResolvedValueOnce({});
      
      await assignWorkspaceToActivity(1, 'act1');
      
      expect(mockClient.query).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE workspaces SET activityId'),
        ['act1', 1]
      );
    });
  });

  describe('getWorkspacesForActivity', () => {
    it('should return workspaces for an activity', async () => {
      const mockWorkspaces = [
        { id: 1, activityid: 'act1', name: 'Workspace 1', activityname: 'Activity 1' },
        { id: 2, activityid: 'act1', name: 'Workspace 2', activityname: 'Activity 1' }
      ];
      
      mockClient.query.mockResolvedValueOnce({ rows: mockWorkspaces });
      
      const result = await getWorkspacesForActivity('act1');
      
      expect(result).toEqual([
        { id: 1, activityId: 'act1', name: 'Workspace 1', activityName: 'Activity 1' },
        { id: 2, activityId: 'act1', name: 'Workspace 2', activityName: 'Activity 1' }
      ]);
      expect(mockClient.query).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE w.activityId = $1'),
        ['act1']
      );
    });

    it('should return an empty array when no workspaces exist for the activity', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      const result = await getWorkspacesForActivity('act1');
      
      expect(result).toEqual([]);
    });
  });

  describe('getWorkspaceById', () => {
    it('should return a workspace by id', async () => {
      const mockWorkspace = { 
        id: 1, 
        activityid: 'act1', 
        name: 'Workspace 1', 
        activityname: 'Activity 1' 
      };
      
      mockClient.query.mockResolvedValueOnce({ rows: [mockWorkspace] });
      
      const result = await getWorkspaceById(1);
      
      expect(result).toEqual({
        id: 1,
        activityId: 'act1',
        name: 'Workspace 1',
        activityName: 'Activity 1'
      });
      expect(mockClient.query).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE w.id = $1'),
        [1]
      );
    });

    it('should throw an error when workspace not found', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      await expect(getWorkspaceById(999))
        .rejects.toThrow('Workspace with id 999 not found');
    });
  });

  describe('deleteWorkspaceById', () => {
    it('should delete a workspace by id', async () => {
      mockClient.query.mockResolvedValueOnce({});
      
      await deleteWorkspaceById(1);
      
      expect(mockClient.query).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM workspaces WHERE id = $1',
        [1]
      );
    });

    it('should throw an error when deletion fails', async () => {
      const error = new Error('Deletion error');
      mockClient.query.mockRejectedValueOnce(error);
      
      await expect(deleteWorkspaceById(1))
        .rejects.toThrow('Deletion error');
    });
  });
});
