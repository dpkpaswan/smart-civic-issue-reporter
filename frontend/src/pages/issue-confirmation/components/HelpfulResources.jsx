import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';

const HelpfulResources = () => {
  const { t } = useTranslation();

  const resources = [
    {
      icon: 'Phone',
      title: t('helpfulResources.directContact'),
      description: t('helpfulResources.directContactDesc'),
      action: t('helpfulResources.phone'),
      link: 'tel:1-800-242-4243'
    },
    {
      icon: 'Mail',
      title: t('helpfulResources.emailSupport'),
      description: t('helpfulResources.emailSupportDesc'),
      action: t('helpfulResources.emailAddress'),
      link: 'mailto:support@smartcivicreporter.gov'
    },
    {
      icon: 'AlertCircle',
      title: t('helpfulResources.escalation'),
      description: t('helpfulResources.escalationDesc'),
      action: t('helpfulResources.viewGuidelines'),
      link: '#'
    },
    {
      icon: 'BookOpen',
      title: t('helpfulResources.faq'),
      description: t('helpfulResources.faqDesc'),
      action: t('helpfulResources.browseResources'),
      link: '#'
    }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-5 lg:p-6 shadow-elevation-1">
      <div className="flex items-center gap-2 mb-4 md:mb-5 lg:mb-6">
        <Icon name="HelpCircle" size={20} className="text-primary md:w-6 md:h-6" />
        <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-foreground">
          {t('helpfulResources.title')}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {resources?.map((resource, index) => (
          <a
            key={index}
            href={resource?.link}
            className="flex items-start gap-3 p-3 md:p-4 bg-muted/50 hover:bg-muted rounded-lg border border-border transition-smooth group"
          >
            <div className="p-2 bg-primary/10 rounded-md flex-shrink-0 group-hover:bg-primary/20 transition-smooth">
              <Icon name={resource?.icon} size={18} className="text-primary md:w-5 md:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm md:text-base font-semibold text-foreground mb-1">
                {resource?.title}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-2">
                {resource?.description}
              </p>
              <span className="text-xs md:text-sm text-primary font-medium group-hover:underline">
                {resource?.action}
              </span>
            </div>
          </a>
        ))}
      </div>
      <div className="mt-4 md:mt-5 lg:mt-6 p-3 md:p-4 bg-warning/5 rounded-lg border border-warning/20">
        <div className="flex items-start gap-2">
          <Icon name="AlertTriangle" size={18} className="text-warning flex-shrink-0 mt-0.5 md:w-5 md:h-5" />
          <div className="flex-1">
            <p className="text-xs md:text-sm font-semibold text-foreground mb-1">
              {t('helpfulResources.emergencyTitle')}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">
              {t('helpfulResources.emergencyDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpfulResources;