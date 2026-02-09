import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CallToAction = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="bg-gradient-to-br from-primary to-primary/80 py-12 md:py-16 lg:py-20">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full mb-4 md:mb-6">
            <Icon name="Sparkles" size={16} className="text-primary-foreground" />
            <span className="text-xs md:text-sm font-medium text-primary-foreground">
              {t('cta.makeADifference')}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground mb-4 md:mb-6">
            {t('cta.readyToReport')}
          </h2>

          <p className="text-base md:text-lg lg:text-xl text-primary-foreground/90 mb-8 md:mb-10 max-w-2xl mx-auto">
            {t('cta.joinThousands')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-8 md:mb-10">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/report-issue')}
              iconName="Camera"
              iconPosition="left"
              iconSize={20}
              className="shadow-elevation-3"
            >
              {t('cta.reportNow')}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/public-transparency')}
              iconName="BarChart3"
              iconPosition="left"
              iconSize={20}
              className="bg-white/10 border-white/30 text-primary-foreground hover:bg-white/20"
            >
              {t('cta.viewDashboard')}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-white/20">
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full mx-auto mb-3">
                <Icon name="Zap" size={24} className="text-primary-foreground" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-primary-foreground mb-2">
                {t('cta.quickEasy')}
              </h3>
              <p className="text-xs md:text-sm text-primary-foreground/80">
                {t('cta.quickEasyDesc')}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-white/20">
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full mx-auto mb-3">
                <Icon name="Eye" size={24} className="text-primary-foreground" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-primary-foreground mb-2">
                {t('cta.fullTransparency')}
              </h3>
              <p className="text-xs md:text-sm text-primary-foreground/80">
                {t('cta.fullTransparencyDesc')}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-white/20">
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full mx-auto mb-3">
                <Icon name="CheckCircle" size={24} className="text-primary-foreground" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-primary-foreground mb-2">
                {t('cta.realResults')}
              </h3>
              <p className="text-xs md:text-sm text-primary-foreground/80">
                {t('cta.realResultsDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;