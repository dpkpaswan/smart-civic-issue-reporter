import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../../components/ui/Header';
import ConfirmationHeader from './components/ConfirmationHeader';
import IssueSummaryCard from './components/IssueSummaryCard';
import TrackingTimeline from './components/TrackingTimeline';
import ActionButtons from './components/ActionButtons';
import NextStepsGuide from './components/NextStepsGuide';
import HelpfulResources from './components/HelpfulResources';

const IssueConfirmation = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const submittedIssue = location?.state?.issue;

  useEffect(() => {
    document.title = t('confirmation.pageTitle');
    if (!submittedIssue) {
      navigate('/report-issue');
    }
  }, [submittedIssue, navigate]);

  if (!submittedIssue) {
    return null;
  }

  const issueData = {
    id: submittedIssue?.id || `SCR-${Date.now()?.toString()?.slice(-8)}`,
    category: submittedIssue?.category || t('confirmation.generalIssue'),
    location: submittedIssue?.location?.address || submittedIssue?.location || t('confirmation.locationNotSpecified'),
    description: submittedIssue?.description || t('confirmation.issuePending'),
    image: submittedIssue?.images?.[0] || submittedIssue?.image || null,
    imageAlt: `Photo of ${submittedIssue?.category || 'civic issue'} submitted by citizen`,
    submittedDate: submittedIssue?.submittedDate || new Date()?.toISOString(),
    status: submittedIssue?.status || 'submitted',
    priority: submittedIssue?.priority || null,
    severityLevel: submittedIssue?.severityLevel || null,
    assignedDepartment: submittedIssue?.assignedDepartment || null,
    estimatedResolutionDays: 7,
    citizenName: submittedIssue?.citizenName || t('confirmation.citizen'),
    citizenEmail: submittedIssue?.citizenEmail || ''
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={false} />
      <main className="pt-16 sm:pt-20 pb-8 md:pb-12 lg:pb-16">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8">
          <ConfirmationHeader issueId={issueData?.id} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8 mb-6 md:mb-8 lg:mb-10">
            <div className="space-y-4 md:space-y-6">
              <IssueSummaryCard issue={issueData} />
              <ActionButtons issueId={issueData?.id} />
            </div>

            <div className="space-y-4 md:space-y-6">
              <TrackingTimeline estimatedResolutionDays={issueData?.estimatedResolutionDays} />
            </div>
          </div>

          <div className="space-y-4 md:space-y-6 lg:space-y-8">
            <NextStepsGuide />
            <HelpfulResources />
          </div>

          <div className="mt-6 md:mt-8 lg:mt-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-card border border-border rounded-lg">
              <span className="text-xs md:text-sm text-muted-foreground">
                {t('confirmation.appName')}
              </span>
              <span className="text-xs md:text-sm text-muted-foreground">•</span>
              <span className="text-xs md:text-sm text-muted-foreground">
                {t('confirmation.poweredBy')}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IssueConfirmation;