import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import IssueStatusIndicator from '../../../components/ui/IssueStatusIndicator';
import LocationDisplay from '../../../components/ui/LocationDisplay';
import AIClassificationBadge from '../../../components/ui/AIClassificationBadge';

const IssueDetailModal = ({ issue, onClose, onStatusChange, onPriorityChange }) => {
  const { t } = useTranslation();

  if (!issue) return null;

  const priorityConfig = {
    critical: { color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300', label: t('issueDetailModal.critical'), icon: 'AlertOctagon' },
    high: { color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-300', label: t('issueDetailModal.high'), icon: 'AlertTriangle' },
    medium: { color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-300', label: t('issueDetailModal.medium'), icon: 'AlertCircle' },
    low: { color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-300', label: t('issueDetailModal.low'), icon: 'Info' }
  };

  const severityConfig = {
    critical: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', label: t('issueDetailModal.critical') },
    high: { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', label: t('issueDetailModal.high') },
    medium: { color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', label: t('issueDetailModal.medium') },
    low: { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', label: t('issueDetailModal.low') }
  };

  const priority = priorityConfig?.[issue?.priority] || priorityConfig?.medium;
  const severity = severityConfig?.[issue?.severityLevel] || severityConfig?.medium;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSlaStatus = () => {
    if (!issue?.slaDeadline) return null;
    const now = new Date();
    const deadline = new Date(issue.slaDeadline);
    const isOverdue = deadline < now && !['resolved', 'closed'].includes(issue.status);
    const hoursRemaining = Math.round((deadline - now) / (1000 * 60 * 60));
    return { isOverdue, hoursRemaining, deadline };
  };

  const slaStatus = getSlaStatus();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card rounded-lg border border-border shadow-elevation-4 w-full max-w-4xl my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 md:p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              {t('issueDetailModal.title')}
            </h2>
            <span className="text-sm text-muted-foreground font-mono">
              #{issue?.id}
            </span>
            {issue?.isDuplicate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium border border-amber-300">
                <Icon name="Copy" size={12} />
                {t('issueDetailModal.duplicate')}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-muted transition-smooth"
            aria-label="Close modal"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Image + Description + Badges */}
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="w-full md:w-56 h-56 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <Image
                src={issue?.image}
                alt={issue?.imageAlt}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">
                  {t('issueDetailModal.description')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {issue?.description}
                </p>
              </div>

              {/* AI Classification Analysis */}
              <AIClassificationBadge issue={issue} variant="full" />

              {/* Status + Priority + Severity + Category Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <IssueStatusIndicator status={issue?.status} />
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${priority?.bg} ${priority?.border} ${priority?.color} text-xs font-semibold`}>
                  <Icon name={priority?.icon} size={14} />
                  {t('issueDetailModal.priorityLabel')}{priority?.label}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${severity?.bg} ${severity?.border} ${severity?.color} text-xs font-semibold`}>
                  <Icon name="Shield" size={14} />
                  {t('issueDetailModal.severityLabel')}{severity?.label}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/10 text-secondary text-xs font-medium">
                  <Icon name={issue?.categoryIcon} size={14} />
                  {issue?.category}
                </span>
              </div>

              {/* Confidence Score */}
              {issue?.confidenceScore > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t('issueDetailModal.aiConfidence')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          issue.confidenceScore >= 0.8 ? 'bg-green-500' : 
                          issue.confidenceScore >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${issue.confidenceScore * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      {(issue.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SLA Deadline Banner */}
          {slaStatus && (
            <div className={`rounded-lg p-3 flex items-center gap-3 border ${
              slaStatus.isOverdue 
                ? 'bg-red-50 border-red-200 text-red-700' 
                : slaStatus.hoursRemaining < 6 
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              <Icon name={slaStatus.isOverdue ? 'AlertOctagon' : 'Clock'} size={18} />
              <div className="flex-1">
                <span className="text-sm font-semibold">
                  {slaStatus.isOverdue ? t('issueDetailModal.slaBreached') : t('issueDetailModal.slaDeadline')}
                </span>
                <span className="text-sm ml-2">
                  {formatDate(issue.slaDeadline)}
                  {!slaStatus.isOverdue && slaStatus.hoursRemaining > 0 && (
                    <span className="ml-1 text-xs opacity-80">
                      ({slaStatus.hoursRemaining}h {t('issueDetailModal.remaining')})
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Duplicate Flag */}
          {issue?.isDuplicate && (
            <div className="rounded-lg p-3 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700">
              <Icon name="Copy" size={18} />
              <div>
                <span className="text-sm font-semibold">{t('issueDetailModal.potentialDuplicate')}</span>
                {issue.duplicateOfIssueId && (
                  <span className="text-sm ml-2">of {issue.duplicateOfIssueId}</span>
                )}
              </div>
            </div>
          )}

          {/* Info Grid: Submission + Assignment + Department */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Submission Details */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Icon name="Calendar" size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {t('issueDetailModal.submission')}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t('issueDetailModal.citizen')}</p>
                  <p className="text-sm text-foreground font-medium">{issue?.citizenName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('issueDetailModal.email')}</p>
                  <p className="text-sm text-foreground font-medium font-mono text-xs">
                    {issue?.reporterId}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('issueDetailModal.submittedLabel')}</p>
                  <p className="text-sm text-foreground font-medium">
                    {formatDate(issue?.submittedDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Department Assignment */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Icon name="Building2" size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {t('issueDetailModal.department')}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t('issueDetailModal.assignedDept')}</p>
                  <p className="text-sm text-foreground font-medium">
                    {issue?.assignedDepartment?.name || t('issueDetailModal.unassigned')}
                  </p>
                </div>
                {issue?.assignedDepartment?.code && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t('issueDetailModal.deptCode')}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono font-semibold">
                      {issue.assignedDepartment.code}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* User Assignment */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Icon name="UserCheck" size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {t('issueDetailModal.assignedTo')}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t('issueDetailModal.officer')}</p>
                  <p className="text-sm text-foreground font-medium">
                    {issue?.assignedUser?.full_name || t('issueDetailModal.notAssigned')}
                  </p>
                </div>
                {issue?.assignedUser?.username && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t('issueDetailModal.usernameLabel')}</p>
                    <p className="text-sm text-foreground font-mono text-xs">
                      @{issue.assignedUser.username}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <LocationDisplay
            address={issue?.location}
            coordinates={issue?.coordinates}
            variant="full"
          />

          {/* Status History Timeline */}
          {issue?.statusHistory && issue.statusHistory.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Icon name="GitCommit" size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {t('issueDetailModal.statusHistory')}
                </span>
                <span className="text-xs bg-muted rounded-full px-2 py-0.5">
                  {issue.statusHistory.length}
                </span>
              </div>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />
                <div className="space-y-4">
                  {issue.statusHistory.map((entry, index) => {
                    const statusLabel = entry.new_status || entry.status || entry.action;
                    return (
                      <div key={index} className="relative flex items-start gap-3 pl-1">
                        <div className={`relative z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          index === 0 ? 'bg-primary border-primary text-white' : 'bg-card border-border'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-white' : 'bg-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground capitalize">
                              {statusLabel?.replace(/_/g, ' ')}
                            </span>
                            {entry.old_status && (
                              <span className="text-xs text-muted-foreground">
                                {t('issueDetailModal.from')} <span className="capitalize">{entry.old_status.replace(/_/g, ' ')}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(entry.timestamp)}
                          </p>
                          {entry.changed_by && (
                            <p className="text-xs text-muted-foreground">
                              {t('issueDetailModal.by')} {entry.changed_by}
                            </p>
                          )}
                          {entry.notes && (
                            <p className="text-xs text-foreground mt-1 bg-card rounded px-2 py-1 border border-border">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Routing Logs */}
          {issue?.routingLogs && issue.routingLogs.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Icon name="Route" size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {t('issueDetailModal.routingLogs')}
                </span>
              </div>
              <div className="space-y-3">
                {issue.routingLogs.map((log, index) => (
                  <div key={index} className="bg-card rounded-lg p-3 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded">
                        <Icon name="Building2" size={12} />
                        {log.department_assigned}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">{t('issueDetailModal.method')}</span>
                        <span className="ml-1 font-medium text-foreground capitalize">{log.assignment_method}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('issueDetailModal.ward')}</span>
                        <span className="ml-1 font-medium text-foreground">{log.ward_area}</span>
                      </div>
                      {log.rule_applied && (
                        <>
                          <div>
                            <span className="text-muted-foreground">{t('issueDetailModal.sla')}</span>
                            <span className="ml-1 font-medium text-foreground">{log.rule_applied.sla}h</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('issueDetailModal.rulePriority')}</span>
                            <span className="ml-1 font-medium text-foreground capitalize">{log.rule_applied.priority}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Classification Metadata */}
          {issue?.aiClassification && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Icon name="Brain" size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {t('issueDetailModal.aiClassification')}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">{t('issueDetailModal.verifiedCategory')}</p>
                  <p className="font-medium text-foreground capitalize">{issue.aiClassification.verified_category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('issueDetailModal.priority')}</p>
                  <p className="font-medium text-foreground capitalize">{issue.aiClassification.priority_level}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('issueDetailModal.severity')}</p>
                  <p className="font-medium text-foreground capitalize">{issue.aiClassification.severity_level}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('issueDetailModal.confidence')}</p>
                  <p className="font-medium text-foreground">{((issue.aiClassification.confidence_score || 0) * 100).toFixed(0)}%</p>
                </div>
                {issue.aiClassification.duplicate_check && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t('issueDetailModal.duplicateCheck')}</p>
                    <p className="font-medium text-foreground">
                      {issue.aiClassification.duplicate_check.is_potential_duplicate ? t('issueDetailModal.potentialDuplicateLabel') : t('issueDetailModal.unique')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resolution Notes */}
          {issue?.notes && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Icon name="FileText" size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {t('issueDetailModal.resolutionNotes')}
                </span>
              </div>
              <p className="text-sm text-foreground">
                {issue?.notes}
              </p>
            </div>
          )}

          {/* Escalation Info */}
          {issue?.autoEscalated && (
            <div className="rounded-lg p-3 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700">
              <Icon name="TrendingUp" size={18} />
              <div>
                <span className="text-sm font-semibold">{t('issueDetailModal.autoEscalated')}</span>
                {issue.escalationReason && (
                  <span className="text-sm ml-2">{issue.escalationReason}</span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                // Use setTimeout so close state settles before opening status modal
                setTimeout(() => onStatusChange(issue?.id), 50);
              }}
              iconName="Edit"
              iconPosition="left"
              iconSize={18}
              fullWidth
            >
              {t('issueDetailModal.updateStatus')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                setTimeout(() => onPriorityChange(issue?.id), 50);
              }}
              iconName="Flag"
              iconPosition="left"
              iconSize={18}
              fullWidth
            >
              {t('issueDetailModal.changePriority')}
            </Button>
            <Button
              variant="default"
              onClick={onClose}
              fullWidth
            >
              {t('issueDetailModal.close')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailModal;