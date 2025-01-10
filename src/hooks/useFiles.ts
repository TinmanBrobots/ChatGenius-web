import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import axios from '@/lib/axios';
import { File as DatabaseFile } from '@/types';

interface FileUploadOptions {
  onProgress?: (progress: number) => void;
  onSuccess?: (file: DatabaseFile) => void;
  onError?: (error: Error) => void;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ProgressEvent {
  loaded: number;
  total?: number;
}

export function useFiles() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const uploadFile = useCallback(async (
    channelId: string,
    file: globalThis.File,
    options: FileUploadOptions = {}
  ) => {
    const { onProgress, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsLoading(true);
      const { data } = await axios.post(`/channels/${channelId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: ProgressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress?.(progress);
          }
        },
      });

      onSuccess?.(data);
      toast({
        title: 'File uploaded successfully',
        description: `${file.name} has been uploaded to the channel.`,
      });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
      onError?.(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getFileUrl = useCallback(async (fileId: string): Promise<string> => {
    try {
      const { data } = await axios.get(`/files/${fileId}/url`);
      return data.url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get file URL';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const getChannelFiles = useCallback(async (
    channelId: string,
    options: PaginationOptions = {}
  ): Promise<{ files: DatabaseFile[]; total: number }> => {
    try {
      setIsLoading(true);
      const { data } = await axios.get(`/channels/${channelId}/files`, {
        params: options,
      });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch files';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      setIsLoading(true);
      await axios.delete(`/files/${fileId}`);
      toast({
        title: 'File deleted',
        description: 'The file has been deleted successfully.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete file';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateFileMetadata = useCallback(async (
    fileId: string,
    metadata: Partial<DatabaseFile>
  ): Promise<DatabaseFile> => {
    try {
      setIsLoading(true);
      const { data } = await axios.patch(`/files/${fileId}`, metadata);
      toast({
        title: 'File updated',
        description: 'File information has been updated successfully.',
      });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update file';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    isLoading,
    uploadFile,
    getFileUrl,
    getChannelFiles,
    deleteFile,
    updateFileMetadata,
  };
} 