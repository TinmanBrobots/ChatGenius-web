import { useState } from 'react';
import { File } from '@/types';
import { formatFileSize } from '@/lib/utils';
import { useFiles } from '@/hooks/useFiles';
import { useToast } from './use-toast';
import { Button } from './button';
import { Loader2, Download, Trash2, FileIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';

interface FileCardProps {
  file: File;
  canDelete: boolean;
  onDelete?: () => void;
}

export function FileCard({ file, canDelete, onDelete }: FileCardProps) {
  const { getFileUrl, deleteFile } = useFiles();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      const url = await getFileUrl(file.id);
      // Open in new tab or download directly
      window.open(url, '_blank');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteFile(file.id);
      onDelete?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <FileIcon className="h-4 w-4" />
          {file.name}
        </CardTitle>
        <CardDescription className="text-sm">
          {formatFileSize(file.size)} • Uploaded by {file.uploader?.username || 'Unknown'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          {new Date(file.created_at).toLocaleDateString()}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 grid grid-rows-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="ml-2">Download</span>
        </Button>
        {canDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="ml-2">Delete</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 