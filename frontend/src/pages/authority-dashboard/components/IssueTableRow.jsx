import React from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import IssueStatusIndicator from '../../../components/ui/IssueStatusIndicator';
import { Checkbox } from '../../../components/ui/Checkbox';

const IssueTableRow = ({ 
  issue, 
  isSelected, 
  onSelect, 
  onStatusChange, 
  onPriorityChange,
  onViewDetails,
  variant = 'desktop' // 'desktop' or 'mobile'
}) => {
  const priorityConfig = {
    high: { color: 'text-error', bg: 'bg-error/10', label: 'High' },
    medium: { color: 'text-warning', bg: 'bg-warning/10', label: 'Medium' },
    low: { color: 'text-success', bg: 'bg-success/10', label: 'Low' }
  };

  const priority = priorityConfig?.[issue?.priority] || priorityConfig?.medium;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

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
            <p className="text-sm font-medium text-foreground line-clamp-2 mb-2">
              {issue?.description}
            </p>
            <IssueStatusIndicator status={issue?.status} size="sm" />
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Category:</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/10 text-secondary text-xs font-medium">
              <Icon name={issue?.categoryIcon} size={12} />
              {issue?.category}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Priority:</span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${priority?.bg} ${priority?.color} text-xs font-medium`}>
              <Icon name="AlertCircle" size={12} />
              {priority?.label}
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <Icon name="MapPin" size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <span className="text-xs text-muted-foreground line-clamp-2">
              {issue?.location}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Submitted:</span>
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
            View
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
            Status
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
        <td className="p-4">
          <Checkbox
            checked={isSelected}
            onChange={() => onSelect(issue?.id)}
          />
        </td>
        <td className="p-4">
          <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
            <Image
              src={issue?.image}
              alt={issue?.imageAlt}
              className="w-full h-full object-cover"
            />
          </div>
        </td>
        <td className="p-4">
          <div className="max-w-xs">
            <p className="text-sm font-medium text-foreground line-clamp-2">
              {issue?.description}
            </p>
          </div>
        </td>
        <td className="p-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/10 text-secondary text-xs font-medium">
            <Icon name={issue?.categoryIcon} size={14} />
            {issue?.category}
          </span>
        </td>
        <td className="p-4">
          <div className="flex items-start gap-1.5 max-w-xs">
            <Icon name="MapPin" size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground line-clamp-2">
              {issue?.location}
            </p>
          </div>
        </td>
        <td className="p-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${priority?.bg} ${priority?.color} text-xs font-medium`}>
            <Icon name="AlertCircle" size={14} />
            {priority?.label}
          </span>
        </td>
        <td className="p-4">
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDate(issue?.submittedDate)}
          </p>
        </td>
        <td className="p-4">
          <IssueStatusIndicator status={issue?.status} size="sm" />
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
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