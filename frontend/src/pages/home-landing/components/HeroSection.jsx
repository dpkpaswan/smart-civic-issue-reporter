import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const HeroSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Animated floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-accent/10 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-primary/5 rounded-full animate-float"></div>
      </div>
      
      <div className="relative max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full mb-4 md:mb-6 animate-slide-in-left">
              <Icon name="Award" size={16} className="text-primary" />
              <span className="text-xs md:text-sm font-medium text-primary">{t('hero.trusted')}</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 md:mb-6 leading-tight animate-fade-in-up">
              {t('hero.titleLine1')}<br />
              <span className="text-primary animate-slide-in-right">{t('hero.titleLine2')}</span>
            </h1>

            <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto lg:mx-0 animate-fade-in-up animate-stagger-1">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start animate-bounce-in animate-stagger-2">
              <Button
                variant="default"
                size="lg"
                onClick={() => navigate('/report-issue')}
                iconName="Camera"
                iconPosition="left"
                iconSize={20}
                className="shadow-elevation-2 hover:shadow-elevation-3 hover-lift button-ripple"
              >
                {t('hero.reportBtn')}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/public-transparency')}
                iconName="Eye"
                iconPosition="left"
                iconSize={20}
                className="hover-scale"
              >
                {t('hero.viewIssues')}
              </Button>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-4 md:gap-6 mt-6 md:mt-8 animate-fade-in-up animate-stagger-3">
              <div className="flex items-center gap-2 hover-glow">
                <Icon name="Shield" size={20} className="text-success" />
                <span className="text-xs md:text-sm text-muted-foreground">{t('hero.secure')}</span>
              </div>
              <div className="flex items-center gap-2 hover-glow">
                <Icon name="Zap" size={20} className="text-warning" />
                <span className="text-xs md:text-sm text-muted-foreground">{t('hero.fastResponse')}</span>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block animate-scale-in animate-stagger-4">
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl transform rotate-6 animate-float"></div>
              <div className="absolute inset-0 bg-card rounded-3xl shadow-elevation-4 p-6 md:p-8 flex items-center justify-center hover-lift">
                <div className="text-center">
                  <Icon name="MapPin" size={80} className="text-primary mx-auto mb-4 animate-pulse-slow" />
                  <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
                    {t('hero.communityDriven')}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {t('hero.empowering')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;