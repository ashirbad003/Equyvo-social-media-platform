import { showSuccess, showError } from '@/utils/toast';

interface DeleteContentOptions {
  postId: string;
  contentType?: 'post' | 'thought' | 'moment' | 'comment';
  onDeleteComplete?: (postId: string) => void;
}

export const deleteContent = async (options: DeleteContentOptions): Promise<void> => {
  const { postId, contentType = 'post', onDeleteComplete } = options;

  try {
    // Simulate API call to delete content
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    showSuccess(`${contentType.charAt(0).toUpperCase() + contentType.slice(1)} deleted successfully`);
    
    // Notify parent component of successful deletion
    if (onDeleteComplete) {
      onDeleteComplete(postId);
    }
  } catch {
    showError(`Failed to delete ${contentType}. Please try again.`);
    throw error;
  }
};

export const confirmDelete = (contentType: string = 'post'): boolean => {
  const message = `Are you sure you want to delete this ${contentType}? This action cannot be undone.`;
  return window.confirm(message);
};
