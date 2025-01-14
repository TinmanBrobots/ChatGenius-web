import { useEffect, useState } from 'react';
import { ChannelMember, File } from '@/types';
import { useFiles } from '@/hooks/useFiles';
import { useAuth } from '@/hooks/useAuth';
import { FileCard } from './file-card';
import { Button } from './button';
import { Loader2, RefreshCw } from 'lucide-react';
import { FileUploadDialog } from './file-upload-dialog';

interface FileListProps {
  channelId: string;
  currentUserRole?: ChannelMember['role'];
  shouldRefresh: boolean;
  onRefresh: () => void;
}

export function FileList({ channelId, currentUserRole, shouldRefresh, onRefresh }: FileListProps) {
  const { getChannelFiles } = useFiles();
  const { currentUser: user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const limit = 10;

  const loadFiles = async (pageNum: number) => {
    try {
      setIsLoading(true);
      const { files: newFiles, total: totalFiles } = await getChannelFiles(channelId, {
        page: pageNum,
        limit,
      });
      setFiles(newFiles);
      setTotal(totalFiles);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(1);
  }, [channelId, shouldRefresh]);

  const handleDelete = () => {
    loadFiles(page);
    onRefresh?.();
  };

  const canDelete = (file: File) => {
    return (
      file.uploader_id === user?.id ||
      currentUserRole === 'admin' ||
      currentUserRole === 'owner'
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Channel Files</h2>
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => loadFiles(page)}
						disabled={isLoading}
					>
						<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
					</Button>
					<FileUploadDialog
						channelId={channelId}
						onUploadComplete={() => onRefresh?.()}
					/>
				</div>
      </div>

      {isLoading && files.length === 0 ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center p-4 text-muted-foreground">
          No files have been uploaded to this channel yet.
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                canDelete={canDelete(file)}
                onDelete={handleDelete}
              />
            ))}
          </div>
          
          {total > limit && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadFiles(page - 1)}
                disabled={page === 1 || isLoading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadFiles(page + 1)}
                disabled={page * limit >= total || isLoading}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 