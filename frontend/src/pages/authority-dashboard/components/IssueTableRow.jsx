import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import IssueStatusIndicator from '../../../components/ui/IssueStatusIndicator';
import { Checkbox } from '../../../components/ui/Checkbox';
import AIClassificationBadge from '../../../components/ui/AIClassificationBadge';

const IssueTableRow = ({ 
  issue, 
  isSelected, 
  onSelect, 
  onStatusChange, 
  onPriorityChange,
  onViewDetails,
  variant = 'desktop'
}) => {
  const { t } = useTranslation();

  const priorityConfig = {
    critical: { color: 'text-red-700', bg: 'bg-red-100', label: t('issueTableRow.critical'), icon: 'AlertOctagon' },
    high: { color: 'text-orange-700', bg: 'bg-orange-100', label: t('issueTableRow.high'), icon: 'AlertTriangle' },
    medium: { color: 'text-yellow-700', bg: 'bg-yellow-100', label: t('issueTableRow.medium'), icon: 'AlertCircle' },
    low: { color: 'text-green-700', bg: 'bg-green-100', label: t('issueTableRow.low'), icon: 'Info' }
  };

  const severityConfig = {
    critical: { color: 'text-red-600', bg: 'bg-red-50', label: t('issueTableRow.critical') },
    high: { color: 'text-orange-600', bg: 'bg-orange-50', label: t('issueTableRow.high') },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: t('issueTableRow.medium') },
    low: { color: 'text-green-600', bg: 'bg-green-50', label: t('issueTableRow.low') }
  };

  const priority = priorityConfig?.[issue?.priority] || priorityConfig?.medium;
  const severity = severityConfig?.[issue?.severityLevel] || severityConfig?.medium;

  const formatDate = (dateString) => {
    if (!dateString) return t('issueTableRow.na');
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getSlaInfo = () => {
    if (!issue?.slaDeadline) return null;
    const now = new Date();
    const deadline = new Date(issue.slaDeadline);
    const isOverdue = deadline < now && !['resolved', 'closed'].includes(issue.status);
    return { isOverdue, deadline };
  };

  const slaInfo = getSlaInfo();

  if (variant === 'mobile') {
    return (
      <div className="bg-card rounded-lg border border-border p-4 mb-4">
        <div className="flex items-start gap-3 mb-3">
          <Checkbox
            checked={isSelected}
            onChange={() => onSelect(issue?.id)}
          />
          <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
            <Image
              src={issue?.image}
              alt={issue?.imageAlt}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground line-clamp-2 mb-1">
              {issue?.description}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <IssueStatusIndicator status={issue?.status} size="sm" />
              {issue?.isDuplicate && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-medium">
                  <Icon name="Copy" size={10} />
                  DUP
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('issueTableRow.categoryLabel')}</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/10 text-secondary text-xs font-medium">
              <Icon name={issue?.categoryIcon} size={12} />
              {issue?.category}
            </span>
          </div>
          
          {/* AI Classification for mobile */}
          {(issue?.verified_category || issue?.confidence_score) && (
            <div className="space-y-1">
              <AIClassificationBadge issue={issue} variant="compact" />
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('issueTableRow.priorityLabel')}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${priority?.bg} ${priority?.color} text-xs font-semibold`}>
              <Icon name={priority?.icon} size={12} />
              {priority?.label}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('issueTableRow.severityLabel')}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${severity?.bg} ${severity?.color} text-xs font-semibold`}>
              {severity?.label}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('issueTableRow.departmentLabel')}</span>
            <span className="text-xs font-medium text-foreground">
              {issue?.assignedDepartment?.name || t('issueTableRow.unassigned')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('issueTableRow.assignedToLabel')}</span>
            <span className="text-xs font-medium text-foreground">
              {issue?.assignedUser?.full_name || t('issueTableRow.unassigned')}
            </span>
          </div>
          {slaInfo && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('issueTableRow.slaLabel')}</span>
              <span className={`text-xs font-semibold ${slaInfo.isOverdue ? 'text-red-600' : 'text-foreground'}`}>
                {slaInfo.isOverdue ? t('issueTableRow.breached') : formatDate(issue.slaDeadline)}
              </span>
            </div>
          )}
          <div className="flex items-start gap-1.5">
            <Icon name="MapPin" size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <span className="text-xs text-muted-foreground line-clamp-2">
              {issue?.location}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('issueTableRow.submittedLabel')}</span>
            <span className="text-xs text-muted-foreground">
              {formatDate(issue?.submittedDate)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(issue?.id)}
            iconName="Eye"
            iconPosition="left"
            iconSize={16}
            fullWidth
          >
            {t('issueTableRow.view')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange(issue?.id)}
            iconName="Edit"
            iconPosition="left"
            iconSize={16}
            fullWidth
          >
            {t('issueTableRow.status')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPriorityChange(issue?.id)}
            iconName="Flag"
            iconSize={16}
          />
        </div>
      </div>
    );
  }

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-smooth">
        <td className="p-3">
          <Checkbox
            checked={isSelected}
            onChange={() => onSelect(issue?.id)}
          />
        </td>
        <td className="p-3">
          <div className="w-14 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
            <Image
              src={issue?.image}
              alt={issue?.imageAlt}
              className="w-full h-full object-cover"
            />
          </div>
        </td>
        <td className="p-3">
          <div className="max-w-[200px]">
            <p className="text-sm font-medium text-foreground line-clamp-2 mb-1">
              {issue?.description}
            </p>
            {issue?.isDuplicate && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-medium">
                <Icon name="Copy" size={10} />
                Duplicate
              </span>
            )}
          </div>
        </td>
        <td className="p-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/10 text-secondary text-xs font-medium">
            <Icon name={issue?.categoryIcon} size={14} />
            {issue?.category}
          </span>
        </td>
        <td className="p-3">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${priority?.bg} ${priority?.color} text-xs font-semibold`}>
            <Icon name={priority?.icon} size={12} />
            {priority?.label}
          </span>
        </td>
        <td className="p-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-md ${severity?.bg} ${severity?.color} text-xs font-semibold`}>
            {severity?.label}
          </span>
        </td>
        <td className="p-3">
          <div className="text-xs">
            <p className="font-medium text-foreground truncate max-w-[120px]">
              {issue?.assignedDepartment?.name || '—'}
            </p>
            <p className="text-muted-foreground truncate max-w-[120px]">
              {issue?.assignedUser?.full_name || t('issueTableRow.unassigned')}
            </p>
          </div>
        </td>
        <td className="p-3">
          {slaInfo ? (
            <span className={`text-xs font-medium ${slaInfo.isOverdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
              {slaInfo.isOverdue ? t('issueTableRow.breachedShort') : formatDate(issue.slaDeadline)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </td>
        <td className="p-3">
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(issue?.submittedDate)}
          </p>
        </td>
        <td className="p-3">
          <IssueStatusIndicator status={issue?.status} size="sm" />
        </td>
        <td className="p-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetails(issue?.id)}
              iconName="Eye"
              iconSize={16}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(issue?.id)}
              iconName="Edit"
              iconSize={16}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPriorityChange(issue?.id)}
              iconName="Flag"
              iconSize={16}
            />
          </div>
        </td>
      </tr>
  );
};

export default IssueTableRow;