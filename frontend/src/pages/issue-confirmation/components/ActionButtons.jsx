import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/ui/Button';

const ActionButtons = ({ issueId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleTrackIssue = () => {
    navigate('/public-transparency', { state: { highlightIssueId: issueId } });
  };

  const handleReportAnother = () => {
    navigate('/report-issue');
  };

  const handleShareProgress = () => {
    const shareUrl = `${window.location?.origin}/public-transparency?issue=${issueId}`;
    const shareText = t('actionButtons.shareText') + ` (ID: ${issueId})`;
    
    if (navigator.share) {
      navigator.share({
        title: t('actionButtons.shareTitle'),
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
          {t('actionButtons.trackIssue')}
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
          {t('actionButtons.reportAnother')}
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
        {t('actionButtons.shareProgress')}
      </Button>
    </div>
  );
};

export default ActionButtons;