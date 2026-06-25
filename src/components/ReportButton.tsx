import React, { useState } from 'react';
import { Flag, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import ReportModal from '@/components/ReportModal';
import { showSuccess } from '@/utils/toast';

interface ReportButtonProps {
  contentId: string;
  contentType: 'post' | 'video' | 'thought' | 'moment' | 'comment';
  variant?: 'icon' | 'button' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

const ReportButton: React.FC<ReportButtonProps> = ({
  contentId,
  contentType,
  variant = 'icon',
  size = 'sm',
  className = '',
  showLabel = false
}) => {
  const [showReportModal, setShowReportModal] = useState(false);

  const handleReport = () => {
    setShowReportModal(true);
  };

  const handleQuickReport = (reason: string) => {
    showSuccess(`Report submitted for ${contentType}: ${reason}`);
    setShowReportModal(false);
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'h-8 w-8 p-0';
      case 'md': return 'h-10 w-10 p-0';
      case 'lg': return 'h-12 w-12 p-0';
      default: return 'h-8 w-8 p-0';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4';
      case 'md': return 'h-5 w-5';
      case 'lg': return 'h-6 w-6';
      default: return 'h-4 w-4';
    }
  };

  if (variant === 'dropdown') {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${className}`}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleReport}>
              <Flag className="h-4 w-4 mr-2" />
              Report {contentType}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleQuickReport('spam')}>
              Report as spam
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleQuickReport('inappropriate')}>
              Report as inappropriate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          contentId={contentId}
          contentType={contentType}
        />
      </>
    );
  }

  if (variant === 'button') {
    return (
      <>
        <Button
          variant="outline"
          size={size === 'md' ? 'default' : size}
          onClick={handleReport}
          className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${className}`}
        >
          <Flag className={getIconSize()} />
          {showLabel && <span className="ml-2">Report</span>}
        </Button>
        
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          contentId={contentId}
          contentType={contentType}
        />
      </>
    );
  }

  // Default icon variant
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReport}
        className={`${getButtonSize()} text-muted-foreground hover:text-red-600 hover:bg-red-50 ${className}`}
        title={`Report this ${contentType}`}
      >
        <Flag className={getIconSize()} />
      </Button>
      
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentId={contentId}
        contentType={contentType}
      />
    </>
  );
};

export default ReportButton;
