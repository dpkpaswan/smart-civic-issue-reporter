import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';

const ActionButtons = ({ issueId }) => {
  const navigate = useNavigate();

  const handleTrackIssue = () => {
    navigate('/public-transparency', { state: { highlightIssueId: issueId } });
  };

  const handleReportAnother = () => {
    navigate('/report-issue');
  };

  const handleShareProgress = () => {
    const shareUrl = `${window.location?.origin}/public-transparency?issue=${issueId}`;
    const shareText = `I just reported a civic issue (ID: ${issueId}) through Smart Civic Reporter. Track the progress here:`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Smart Civic Reporter - Issue Tracking',
        text: shareText,
        url: shareUrl
      })?.catch(() => {
        navigator.clipboard?.writeText(`${shareText} ${shareUrl}`);
      });
    } else {
      navigator.clipboard?.writeText(`${shareText} ${shareUrl}`);
    }
  };

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <Button
          variant="default"
          size="lg"
          onClick={handleTrackIssue}
          iconName="Eye"
          iconPosition="left"
          iconSize={20}
          fullWidth
        >
          Track This Issue
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={handleReportAnother}
          iconName="Plus"
          iconPosition="left"
          iconSize={20}
          fullWidth
        >
          Report Another Issue
        </Button>
      </div>
      <Button
        variant="secondary"
        size="lg"
        onClick={handleShareProgress}
        iconName="Share2"
        iconPosition="left"
        iconSize={20}
        fullWidth
      >
        Share Progress
      </Button>
    </div>
  );
};

export default ActionButtons;