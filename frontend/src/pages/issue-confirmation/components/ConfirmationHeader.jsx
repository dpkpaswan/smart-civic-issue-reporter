import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';

const ConfirmationHeader = ({ issueId }) => {
  const { t } = useTranslation();

  return (
    <div className="text-center mb-6 md:mb-8 lg:mb-10">
      <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-success/10 rounded-full mb-4 md:mb-5 lg:mb-6">
        <Icon name="CheckCircle" size={40} className="text-success md:w-12 md:h-12 lg:w-14 lg:h-14" />
      </div>
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 md:mb-3">
        {t('confirmHeader.title')}
      </h1>
      <p className="text-sm md:text-base lg:text-lg text-muted-foreground mb-3 md:mb-4">
        {t('confirmHeader.subtitle')}
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 lg:px-6 lg:py-3 bg-card border border-border rounded-lg">
        <Icon name="Hash" size={18} className="text-primary md:w-5 md:h-5 lg:w-6 lg:h-6" />
        <span className="text-sm md:text-base lg:text-lg font-semibold text-foreground">
          {t('confirmHeader.trackingId')}{issueId}
        </span>
      </div>
    </div>
  );
};

export default ConfirmationHeader;