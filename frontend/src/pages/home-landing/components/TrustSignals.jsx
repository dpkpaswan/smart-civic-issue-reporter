import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';

const TrustSignals = () => {
  const { t } = useTranslation();

  const trustBadges = [
    {
      id: 1,
      icon: 'Shield',
      title: t('trust.govVerified'),
      description: t('trust.govVerifiedDesc'),
      color: 'bg-blue-50 text-blue-600',
      ring: 'ring-blue-100'
    },
    {
      id: 2,
      icon: 'Lock',
      title: t('trust.sslSecured'),
      description: t('trust.sslSecuredDesc'),
      color: 'bg-emerald-50 text-emerald-600',
      ring: 'ring-emerald-100'
    },
    {
      id: 3,
      icon: 'Eye',
      title: t('trust.transparent'),
      description: t('trust.transparentDesc'),
      color: 'bg-amber-50 text-amber-600',
      ring: 'ring-amber-100'
    },
    {
      id: 4,
      icon: 'Users',
      title: t('trust.communityDriven'),
      description: t('trust.communityDrivenDesc'),
      color: 'bg-purple-50 text-purple-600',
      ring: 'ring-purple-100'
    }
  ];

  const partnerLogos = [
    { id: 1, name: t('trust.cityCouncil'), icon: 'Building2' },
    { id: 2, name: t('trust.publicWorks'), icon: 'Wrench' },
    { id: 3, name: t('trust.policeDept'), icon: 'ShieldCheck' },
    { id: 4, name: t('trust.fireDept'), icon: 'Flame' }
  ];

  return (
    <section className="bg-slate-50 py-14 md:py-20">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <p className="text-sm font-semibold tracking-wide uppercase text-blue-600 mb-2">
            {t('trust.whyTrust')}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            {t('trust.title')}
          </h2>
          <p className="text-sm md:text-base text-gray-500 max-w-xl mx-auto">
            {t('trust.subtitle')}
          </p>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-14">
          {trustBadges.map((badge) => (
            <div
              key={badge.id}
              className="bg-white rounded-xl border border-gray-200 p-5 md:p-6 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`inline-flex items-center justify-center w-11 h-11 rounded-lg ${badge.color} ring-1 ${badge.ring} mb-4`}>
                <Icon name={badge.icon} size={20} />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-1.5">
                {badge.title}
              </h3>
              <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                {badge.description}
              </p>
            </div>
          ))}
        </div>

        {/* Government partners */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 text-center mb-6">
            {t('trust.officialPartners')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {partnerLogos.map((partner) => (
              <div
                key={partner.id}
                className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors duration-200"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                  <Icon name={partner.icon} size={20} />
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-700 text-center">
                  {partner.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Verified badge */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
            <Icon name="CheckCircle" size={16} className="text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">
              {t('trust.verifiedSecure')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSignals;