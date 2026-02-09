import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import IssueStatusIndicator from '../../../components/ui/IssueStatusIndicator';
import LocationDisplay from '../../../components/ui/LocationDisplay';
import AIClassificationBadge from '../../../components/ui/AIClassificationBadge';

const IssueDetailsModal = ({ issue, onClose }) => {
  const { t } = useTranslation();
  if (!issue) return null;

  const priorityBadge = {
    critical: { color: 'text-red-700', bg: 'bg-red-100', label: t('issueDetails.critical') },
    high: { color: 'text-orange-700', bg: 'bg-orange-100', label: t('issueDetails.high') },
    medium: { color: 'text-yellow-700', bg: 'bg-yellow-100', label: t('issueDetails.medium') },
    low: { color: 'text-green-700', bg: 'bg-green-100', label: t('issueDetails.low') }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getResponseTime = () => {
    if (!issue?.resolvedDate) return null;
    const submitted = new Date(issue.submittedDate);
    const resolved = new Date(issue.resolvedDate);
    const diffHours = Math.round(Math.abs(resolved - submitted) / (1000 * 60 * 60));
    if (diffHours < 24) return t('issueDetails.hours', { count: diffHours });
    const diffDays = Math.ceil(diffHours / 24);
    return t(diffDays === 1 ? 'issueDetails.daysSingle' : 'issueDetails.daysPlural', { count: diffDays });
  };

  const responseTime = getResponseTime();
  const prio = priorityBadge[issue?.priority] || priorityBadge.medium;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-card rounded-lg border border-border shadow-elevation-4 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="text-lg lg:text-xl font-semibold text-foreground">{t('issueDetails.title')}</h2>
            <span className="text-sm text-muted-foreground font-mono">#{issue?.id}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md transition-smooth"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="space-y-6">
            {/* Before & After Comparison — shown for resolved issues with resolution images */}
            {issue?.status === 'resolved' && issue?.resolutionImages?.length > 0 && issue?.images?.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Icon name="ArrowLeftRight" size={16} />
                  Before & After Comparison
                </h4>
                <div className="grid grid-cols-2 gap-3 rounded-xl overflow-hidden">
                  {/* Before */}
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg group">
                    <span className="absolute top-2 left-2 z-10 bg-red-500/90 text-white px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase shadow-sm">
                      Before
                    </span>
                    <Image
                      src={issue.images[0]}
                      alt="Before: citizen reported"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  {/* After */}
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg group">
                    <span className="absolute top-2 left-2 z-10 bg-emerald-500/90 text-white px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase shadow-sm">
                      After
                    </span>
                    <Image
                      src={issue.resolutionImages[0]}
                      alt="After: resolution proof"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
              </div>
            ) : issue?.image ? (
              <div className="aspect-[16/9] relative overflow-hidden rounded-lg bg-muted">
                <Image
                  src={issue?.image}
                  alt={issue?.imageAlt}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}

            {/* Title + Badges */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-2">
                  {issue?.title}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-md">
                    <Icon name={issue?.categoryIcon} size={16} />
                    {issue?.category}
                  </span>
                  <IssueStatusIndicator status={issue?.status} />
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${prio.bg} ${prio.color}`}>
                    {prio.label} {t('issueDetails.priority')}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Icon name="FileText" size={16} />
                {t('issueDetails.description')}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {issue?.description}
              </p>
            </div>

            {/* AI Classification Analysis */}
            <AIClassificationBadge issue={issue} variant="full" />

            {/* Location */}
            <LocationDisplay
              address={issue?.location}
              coordinates={issue?.coordinates}
              variant="full"
            />

            {/* Department handling */}
            {issue?.department && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="Building2" size={16} className="text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">{t('issueDetails.handlingDept')}</span>
                </div>
                <p className="text-sm text-blue-600">{issue.department}</p>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Calendar" size={16} className="text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">{t('issueDetails.submitted')}</span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {formatDate(issue?.submittedDate)}
                </p>
              </div>

              {issue?.resolvedDate && (
                <div className="bg-success/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="CheckCircle" size={16} className="text-success" />
                    <span className="text-xs font-medium text-success">{t('issueDetails.resolved')}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatDate(issue?.resolvedDate)}
                  </p>
                </div>
              )}
            </div>

            {/* Response Time */}
            {responseTime && (
              <div className="bg-accent/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Clock" size={16} className="text-accent" />
                  <span className="text-xs font-medium text-accent">{t('issueDetails.responseTime')}</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{responseTime}</p>
              </div>
            )}

            {/* Status History Timeline (public view) */}
            {issue?.statusHistory && issue.statusHistory.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="GitCommit" size={16} className="text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('issueDetails.progressTimeline')}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />
                  <div className="space-y-3">
                    {issue.statusHistory.map((entry, index) => {
                      const label = entry.new_status || entry.status || entry.action;
                      return (
                        <div key={index} className="relative flex items-start gap-3 pl-1">
                          <div className={`relative z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            index === 0 ? 'bg-primary border-primary' : 'bg-card border-border'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-white' : 'bg-muted-foreground'}`} />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-foreground capitalize">
                              {label?.replace(/_/g, ' ')}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(entry.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Authority Response */}
            {issue?.authorityResponse && (
              <div className="border border-border rounded-lg p-4">
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Icon name="MessageSquare" size={16} />
                  {t('issueDetails.authorityResponse')}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {issue?.authorityResponse}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 lg:p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            fullWidth
          >
            {t('issueDetails.close')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailsModal;