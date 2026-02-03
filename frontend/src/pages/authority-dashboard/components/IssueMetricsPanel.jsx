import React from 'react';
import Icon from '../../../components/AppIcon';

const IssueMetricsPanel = ({ metrics }) => {
  const metricCards = [
    {
      id: 'submitted',
      label: 'Submitted Issues',
      value: metrics?.pending,
      icon: 'Clock',
      bgColor: 'bg-warning/10',
      iconColor: 'text-warning',
      borderColor: 'border-warning/20'
    },
    {
      id: 'inProgress',
      label: 'In Progress',
      value: metrics?.inProgress,
      icon: 'RefreshCw',
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary',
      borderColor: 'border-primary/20'
    },
    {
      id: 'resolved',
      label: 'Resolved Today',
      value: metrics?.resolvedToday,
      icon: 'CheckCircle',
      bgColor: 'bg-success/10',
      iconColor: 'text-success',
      borderColor: 'border-success/20'
    },
    {
      id: 'avgTime',
      label: 'Avg Resolution Time',
      value: metrics?.avgResolutionTime,
      icon: 'Timer',
      bgColor: 'bg-secondary/10',
      iconColor: 'text-secondary',
      borderColor: 'border-secondary/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {metricCards?.map((metric) => (
        <div
          key={metric?.id}
          className={`
            bg-card rounded-lg border ${metric?.borderColor}
            p-4 md:p-6 transition-smooth hover:shadow-elevation-2
          `}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 md:p-3 rounded-md ${metric?.bgColor}`}>
              <Icon name={metric?.icon} size={20} className={metric?.iconColor} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
              {metric?.value}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">
              {metric?.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default IssueMetricsPanel;