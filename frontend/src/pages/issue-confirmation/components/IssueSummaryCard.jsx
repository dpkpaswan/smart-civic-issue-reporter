import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import IssueStatusIndicator from '../../../components/ui/IssueStatusIndicator';

const IssueSummaryCard = ({ issue }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-elevation-1">
      <div className="p-4 md:p-5 lg:p-6 border-b border-border">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-foreground">
            {t('issueSummary.title')}
          </h2>
          <IssueStatusIndicator status="submitted" size="default" />
        </div>
      </div>
      <div className="p-4 md:p-5 lg:p-6 space-y-4 md:space-y-5 lg:space-y-6">
        {issue?.image && (
          <div className="w-full h-48 md:h-56 lg:h-64 rounded-lg overflow-hidden bg-muted">
            <Image
              src={issue?.image}
              alt={issue?.imageAlt}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="space-y-3 md:space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-md flex-shrink-0">
              <Icon name="Tag" size={18} className="text-primary md:w-5 md:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground mb-1">{t('issueSummary.category')}</p>
              <p className="text-sm md:text-base lg:text-lg font-medium text-foreground">
                {issue?.category}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-md flex-shrink-0">
              <Icon name="MapPin" size={18} className="text-primary md:w-5 md:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground mb-1">{t('issueSummary.location')}</p>
              <p className="text-sm md:text-base text-foreground break-words">
                {issue?.location}
              </p>
            </div>
          </div>

          {issue?.description && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-md flex-shrink-0">
                <Icon name="FileText" size={18} className="text-primary md:w-5 md:h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground mb-1">{t('issueSummary.description')}</p>
                <p className="text-sm md:text-base text-foreground break-words">
                  {issue?.description}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-md flex-shrink-0">
              <Icon name="Calendar" size={18} className="text-primary md:w-5 md:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground mb-1">{t('issueSummary.submittedOn')}</p>
              <p className="text-sm md:text-base text-foreground">
                {new Date(issue.submittedDate)?.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueSummaryCard;