import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils";

interface DeleteButtonProps {
  onDelete: () => Promise<void> | void;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  confirmationTitle?: string;
  confirmationDescription?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  showIcon?: boolean;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({
  onDelete,
  disabled = false,
  variant = 'ghost',
  size = 'sm',
  className = '',
  children,
  confirmationTitle = 'Delete this post?',
  confirmationDescription = 'This action cannot be undone. This will permanently delete your post and remove it from your profile.',
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
  showIcon = true,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await onDelete();
      setIsOpen(false);
    } catch {
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isDeleting}
          className={cn(
            "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200",
            isDeleting && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          {showIcon && <Trash2 className="h-4 w-4 mr-2" />}
          {isDeleting ? 'Deleting...' : (children || 'Delete')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-left">
              <AlertDialogTitle className="text-lg font-semibold text-foreground">
                {confirmationTitle}
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogDescription className="text-muted-foreground mt-4">
          {confirmationDescription}
        </AlertDialogDescription>
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel 
            disabled={isDeleting}
            className="px-6"
          >
            {cancelButtonText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600 px-6"
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </div>
            ) : (
              confirmButtonText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteButton;
