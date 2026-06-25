import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, X } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  contentType: 'post' | 'video' | 'thought' | 'moment' | 'comment';
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  contentId,
  contentType
}) => {
  const [reportReason, setReportReason] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = [
    { value: 'spam', label: 'Spam or misleading content' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'copyright', label: 'Copyright infringement' },
    { value: 'violence', label: 'Violent or dangerous content' },
    { value: 'hate', label: 'Hate speech' },
    { value: 'privacy', label: 'Privacy violation' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async () => {
    if (!reportReason) {
      showError('Please select a reason for reporting');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call to submit report
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showSuccess('Report submitted successfully. We will review this content.');
      handleClose();
    } catch {
      showError('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReportReason('');
    setAdditionalInfo('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Report Content
          </DialogTitle>
          <DialogDescription>
            Help us keep the community safe by reporting content that violates our guidelines.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Reason for report</Label>
            <RadioGroup value={reportReason} onValueChange={setReportReason}>
              {reportReasons.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value} className="text-sm cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional-info" className="text-sm font-medium">
              Additional information (optional)
            </Label>
            <Textarea
              id="additional-info"
              placeholder="Provide any additional details that might help us review this content..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!reportReason || isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;
