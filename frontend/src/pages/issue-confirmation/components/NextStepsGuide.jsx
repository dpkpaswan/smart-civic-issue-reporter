import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';

const NextStepsGuide = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: 'Bell',
      title: t('nextSteps.monitor'),
      description: t('nextSteps.monitorDesc')
    },
    {
      icon: 'MessageSquare',
      title: t('nextSteps.stayInformed'),
      description: t('nextSteps.stayInformedDesc')
    },
    {
      icon: 'Users',
      title: t('nextSteps.engage'),
      description: t('nextSteps.engageDesc')
    },
    {
      icon: 'ThumbsUp',
      title: t('nextSteps.provideFeedback'),
      description: t('nextSteps.provideFeedbackDesc')
    }
  ];

  return (
    <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20 p-4 md:p-5 lg:p-6">
      <div className="flex items-center gap-2 mb-4 md:mb-5 lg:mb-6">
        <Icon name="Lightbulb" size={20} className="text-primary md:w-6 md:h-6" />
        <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-foreground">
          {t('nextSteps.title')}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 lg:gap-6">
        {steps?.map((step, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-full flex-shrink-0">
              <Icon name={step?.icon} size={16} className="text-primary md:w-5 md:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm md:text-base font-semibold text-foreground mb-1">
                {step?.title}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                {step?.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NextStepsGuide;