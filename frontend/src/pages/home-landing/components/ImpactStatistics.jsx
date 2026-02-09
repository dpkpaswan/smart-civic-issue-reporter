import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';

const ImpactStatistics = ({ statistics }) => {
  const { t } = useTranslation();
  // Use real data if available, otherwise fall back to defaults
  const getStatistics = () => {
    if (!statistics) {
      return [
        {
          id: 1,
          icon: 'FileText',
          label: t('impact.totalIssues'),
          value: t('impact.loading'),
          change: t('impact.fetchingData'),
          changeType: 'neutral',
          color: 'primary',
          progress: 0
        },
        {
          id: 2,
          icon: 'CheckCircle',
          label: t('impact.issuesResolved'),
          value: t('impact.loading'),
          change: t('impact.calculatingRate'),
          changeType: 'neutral', 
          color: 'success',
          progress: 0
        },
        {
          id: 3,
          icon: 'Clock',
          label: t('impact.avgResolution'),
          value: t('impact.loading'),
          change: t('impact.analyzingData'),
          changeType: 'neutral',
          color: 'accent',
          progress: 0
        },
        {
          id: 4,
          icon: 'Users',
          label: t('impact.activeCitizens'),
          value: t('impact.loading'),
          change: t('impact.countingUsers'),
          changeType: 'neutral',
          color: 'secondary',
          progress: 0
        }
      ];
    }

    return [
      {
        id: 1,
        icon: 'FileText',
        label: t('impact.totalIssues'),
        value: statistics.totalIssues?.toLocaleString() || '0',
        change: statistics.totalIssues > 50 ? t('impact.communityEngaged') : t('impact.growingPlatform'),
        changeType: 'positive',
        color: 'primary',
        progress: Math.min(85, (statistics.totalIssues || 0) * 2)
      },
      {
        id: 2,
        icon: 'CheckCircle',
        label: t('impact.issuesResolved'),
        value: statistics.resolvedIssues?.toLocaleString() || '0',
        change: `${statistics.resolutionRate || 0}% ${t('impact.resolutionRate')}`,
        changeType: 'positive',
        color: 'success',
        progress: statistics.resolutionRate || 0
      },
      {
        id: 3,
        icon: 'Clock',
        label: t('impact.avgResolution'),
        value: statistics.avgResolutionTime || '0 days',
        change: statistics.avgResolutionTime !== '0 days' ? t('impact.efficientResponse') : t('impact.buildingHistory'),
        changeType: 'positive',
        color: 'accent',
        progress: statistics.avgResolutionTime === '0 days' ? 0 : Math.max(20, 100 - (parseInt(statistics.avgResolutionTime) || 0) * 10)
      },
      {
        id: 4,
        icon: 'Users',
        label: t('impact.activeCitizens'),
        value: statistics.activeCitizens?.toLocaleString() || '0',
        change: statistics.activeCitizens > 10 ? t('impact.growingCommunity') : t('impact.joinMovement'),
        changeType: 'positive',
        color: 'secondary',
        progress: Math.min(92, (statistics.activeCitizens || 0) * 5)
      }
    ];
  };

  const statsData = getStatistics();

  const getColorClasses = (color) => {
    const colors = {
      primary: {
        bg: 'bg-primary/10',
        text: 'text-primary',
        progress: 'bg-primary'
      },
      success: {
        bg: 'bg-success/10',
        text: 'text-success',
        progress: 'bg-success'
      },
      accent: {
        bg: 'bg-accent/10',
        text: 'text-accent',
        progress: 'bg-accent'
      },
      secondary: {
        bg: 'bg-secondary/10',
        text: 'text-secondary',
        progress: 'bg-secondary'
      }
    };
    return colors?.[color] || colors?.primary;
  };

  return (
    <section className="bg-background py-12 md:py-16 lg:py-20">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12 animate-fade-in-up">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 md:mb-4">
            {t('impact.title')}
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('impact.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statsData?.map((stat, index) => {
            const colorClasses = getColorClasses(stat?.color);
            
            return (
              <div
                key={stat?.id}
                className={`bg-card rounded-lg border border-border p-4 md:p-6 shadow-elevation-1 hover:shadow-elevation-2 transition-smooth hover-lift animate-scale-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 md:p-3 rounded-lg ${colorClasses?.bg} animate-bounce-in`}>
                    <Icon name={stat?.icon} size={24} className={colorClasses?.text} />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-success animate-slide-in-left">
                    <Icon name="TrendingUp" size={14} />
                    <span>{stat?.change}</span>
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">
                    {stat?.label}
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground animate-count-up">
                    {stat?.value}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t('impact.progress')}</span>
                    <span className="font-medium animate-count-up">{stat?.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colorClasses?.progress} rounded-full transition-smooth animate-progress-fill`}
                      style={{ 
                        width: `${stat?.progress}%`,
                        animationDelay: `${index * 0.2 + 0.5}s`
                      }}
                      role="progressbar"
                      aria-valuenow={stat?.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ImpactStatistics;