import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';

const StatsHeader = ({ stats }) => {
  const { t } = useTranslation();

  const statCards = [
    { label: t('statsHeader.totalIssues'), value: stats?.totalIssues, icon: 'FileText', color: 'text-primary', bgColor: 'bg-primary/10' },
    { label: t('statsHeader.resolved'), value: stats?.resolvedIssues, icon: 'CheckCircle', color: 'text-success', bgColor: 'bg-success/10' },
    { label: t('statsHeader.inProgress'), value: stats?.inProgressIssues, icon: 'RefreshCw', color: 'text-warning', bgColor: 'bg-warning/10' },
    { label: t('statsHeader.avgResponse'), value: `${stats?.avgResponseTime}${t('statsHeader.days')}`, icon: 'Clock', color: 'text-accent', bgColor: 'bg-accent/10' }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
      {statCards?.map((stat, index) => (
        <div
          key={index}
          className="bg-card rounded-lg border border-border p-4 lg:p-5 hover:shadow-elevation-2 transition-smooth"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 lg:p-2.5 ${stat?.bgColor} rounded-md`}>
              <Icon name={stat?.icon} size={20} className={stat?.color} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl lg:text-3xl font-bold text-foreground">
              {stat?.value}
            </p>
            <p className="text-xs lg:text-sm text-muted-foreground">
              {stat?.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsHeader;