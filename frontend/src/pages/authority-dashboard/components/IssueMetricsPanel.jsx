import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';

const IssueMetricsPanel = ({ metrics }) => {
  const { t } = useTranslation();

  const metricCards = [
    {
      id: 'total',
      label: t('metrics.totalIssues'),
      value: metrics?.total || 0,
      icon: 'LayoutList',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-500/20'
    },
    {
      id: 'submitted',
      label: t('metrics.pendingAssigned'),
      value: metrics?.pending || 0,
      icon: 'Clock',
      bgColor: 'bg-warning/10',
      iconColor: 'text-warning',
      borderColor: 'border-warning/20'
    },
    {
      id: 'inProgress',
      label: t('metrics.inProgress'),
      value: metrics?.inProgress || 0,
      icon: 'RefreshCw',
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary',
      borderColor: 'border-primary/20'
    },
    {
      id: 'resolved',
      label: t('metrics.resolvedToday'),
      value: metrics?.resolvedToday || 0,
      icon: 'CheckCircle',
      bgColor: 'bg-success/10',
      iconColor: 'text-success',
      borderColor: 'border-success/20'
    },
    {
      id: 'avgTime',
      label: t('metrics.avgResolution'),
      value: metrics?.avgResolutionTime || 'N/A',
      icon: 'Timer',
      bgColor: 'bg-secondary/10',
      iconColor: 'text-secondary',
      borderColor: 'border-secondary/20'
    },
    {
      id: 'slaBreach',
      label: t('metrics.slaBreached'),
      value: metrics?.slaBreached || 0,
      icon: 'AlertOctagon',
      bgColor: metrics?.slaBreached > 0 ? 'bg-red-500/10' : 'bg-green-500/10',
      iconColor: metrics?.slaBreached > 0 ? 'text-red-500' : 'text-green-500',
      borderColor: metrics?.slaBreached > 0 ? 'border-red-500/20' : 'border-green-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
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