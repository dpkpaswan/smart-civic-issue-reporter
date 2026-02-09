import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import IssueStatusIndicator from '../../../components/ui/IssueStatusIndicator';
import LocationDisplay from '../../../components/ui/LocationDisplay';
import AIClassificationBadge from '../../../components/ui/AIClassificationBadge';

const IssueCard = ({ issue, onViewDetails }) => {
  const { t } = useTranslation();

  const priorityBadge = {
    critical: { color: 'text-red-700', bg: 'bg-red-100', label: t('issueCard.critical') },
    high: { color: 'text-orange-700', bg: 'bg-orange-100', label: t('issueCard.high') },
    medium: { color: 'text-yellow-700', bg: 'bg-yellow-100', label: t('issueCard.medium') },
    low: { color: 'text-green-700', bg: 'bg-green-100', label: t('issueCard.low') }
  };
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDaysAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 1) return t('issueCard.justNow');
    if (diffMinutes < 60) return t('issueCard.minAgo', { count: diffMinutes });
    if (diffHours < 24) return t('issueCard.hrsAgo', { count: diffHours });
    if (diffDays === 1) return t('issueCard.yesterday');
    if (diffDays < 7) return t('issueCard.daysAgo', { count: diffDays });
    if (diffDays < 30) return t('issueCard.weeksAgo', { count: Math.floor(diffDays / 7) });
    return t('issueCard.monthsAgo', { count: Math.floor(diffDays / 30) });
  };

  const prio = priorityBadge[issue?.priority] || priorityBadge.medium;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-elevation-2 transition-smooth hover-lift animate-fade-in-up animate-gpu">
      {issue?.image ? (
        <div className="aspect-[16/9] relative overflow-hidden bg-muted">
          <Image
            src={issue?.image}
            alt={issue?.imageAlt}
            className="w-full h-full object-cover hover-scale transition-all duration-500"
          />
          <div className="absolute top-3 right-3 animate-slide-in-right">
            <IssueStatusIndicator status={issue?.status} size="sm" />
          </div>
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${prio.bg} ${prio.color}`}>
              {prio.label}
            </span>
          </div>
        </div>
      ) : (
        <div className="aspect-[16/9] relative bg-muted flex items-center justify-center">
          <Icon name={issue?.categoryIcon || 'AlertTriangle'} size={48} className="text-muted-foreground/30" />
          <div className="absolute top-3 right-3">
            <IssueStatusIndicator status={issue?.status} size="sm" />
          </div>
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${prio.bg} ${prio.color}`}>
              {prio.label}
            </span>
          </div>
        </div>
      )}
      <div className="p-4 lg:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base lg:text-lg font-semibold text-foreground mb-1 line-clamp-2">
              {issue?.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md">
                <Icon name={issue?.categoryIcon} size={14} />
                {issue?.category}
              </span>
              <span className="text-xs text-muted-foreground">
                {getDaysAgo(issue?.submittedDate)}
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
          {issue?.description}
        </p>

        {/* AI Classification Badge */}
        <div className="mb-3">
          <AIClassificationBadge issue={issue} variant="compact" />
        </div>

        {/* Department badge */}
        {issue?.department && (
          <div className="flex items-center gap-1.5 mb-3">
            <Icon name="Building2" size={12} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {t('issueCard.handledBy')}<span className="font-medium text-foreground">{issue.department}</span>
            </span>
          </div>
        )}

        <LocationDisplay
          address={issue?.location}
          coordinates={issue?.coordinates}
          variant="compact"
          className="mb-3"
        />

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t('issueCard.submitted')}</span>
            <span className="text-sm font-medium text-foreground">
              {formatDate(issue?.submittedDate)}
            </span>
          </div>
          
          {issue?.resolvedDate && (
            <div className="flex flex-col gap-1 text-right">
              <span className="text-xs text-muted-foreground">{t('issueCard.resolved')}</span>
              <span className="text-sm font-medium text-success">
                {formatDate(issue?.resolvedDate)}
              </span>
            </div>
          )}
          
          <button
            onClick={() => onViewDetails(issue)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-smooth"
          >
            {t('issueCard.viewDetails')}
            <Icon name="ChevronRight" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueCard;