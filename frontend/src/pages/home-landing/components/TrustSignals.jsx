import React from 'react';
import Icon from '../../../components/AppIcon';

const TrustSignals = () => {
  const trustBadges = [
    {
      id: 1,
      icon: 'Shield',
      title: 'Government Verified',
      description: 'Official partnership with local authorities'
    },
    {
      id: 2,
      icon: 'Lock',
      title: 'SSL Secured',
      description: 'Bank-level encryption for your data'
    },
    {
      id: 3,
      icon: 'Eye',
      title: 'Transparent Process',
      description: 'Track every step of issue resolution'
    },
    {
      id: 4,
      icon: 'Users',
      title: 'Community Driven',
      description: 'Powered by engaged citizens like you'
    }
  ];

  const partnerLogos = [
    {
      id: 1,
      name: 'City Council',
      icon: 'Building2'
    },
    {
      id: 2,
      name: 'Public Works',
      icon: 'Wrench'
    },
    {
      id: 3,
      name: 'Police Department',
      icon: 'ShieldCheck'
    },
    {
      id: 4,
      name: 'Fire Department',
      icon: 'Flame'
    }
  ];

  return (
    <section className="bg-background py-12 md:py-16 lg:py-20">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 md:mb-4">
            Trusted by Community & Government
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
            Built on transparency, security, and accountability
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
          {trustBadges?.map((badge) => (
            <div
              key={badge?.id}
              className="bg-card rounded-lg border border-border p-4 md:p-6 text-center hover:shadow-elevation-2 transition-smooth"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-primary/10 rounded-full mb-3 md:mb-4">
                <Icon name={badge?.icon} size={24} className="text-primary" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">
                {badge?.title}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                {badge?.description}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-muted/50 rounded-xl border border-border p-6 md:p-8">
          <h3 className="text-lg md:text-xl font-semibold text-foreground text-center mb-6 md:mb-8">
            Official Government Partners
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {partnerLogos?.map((partner) => (
              <div
                key={partner?.id}
                className="flex flex-col items-center justify-center p-4 bg-card rounded-lg border border-border hover:shadow-elevation-1 transition-smooth"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 md:mb-3">
                  <Icon name={partner?.icon} size={24} className="text-primary" />
                </div>
                <span className="text-xs md:text-sm font-medium text-foreground text-center">
                  {partner?.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 md:mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full">
            <Icon name="CheckCircle" size={20} className="text-success" />
            <span className="text-sm md:text-base font-medium text-success-foreground">
              Verified Secure Platform
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSignals;