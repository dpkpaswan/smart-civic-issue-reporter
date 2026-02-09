import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const SubmitSection = ({ 
  onSubmit, 
  isSubmitting,
  isUploadingImages = false,
  canSubmit,
  validationErrors = [],
  citizenName = '',
  citizenEmail = '',
  onCitizenInfoChange,
  location = null
}) => {
  const { t } = useTranslation();
  const isProcessing = isSubmitting || isUploadingImages;
  
  // Check location accuracy status for display
  const getLocationStatus = () => {
    if (!location) return { status: 'missing', message: t('submit.notDetected') };
    if (location.source === 'manual') return { status: 'manual', message: t('submit.manualAddress') };
    if (!location.accuracy) return { status: 'unknown', message: t('submit.gpsDetected') };
    
    if (location.accuracy <= 50) return { status: 'good', message: t('submit.gpsAccurate', { meters: location.accuracy }) };
    if (location.accuracy <= 100) return { status: 'fair', message: `${t('submit.gpsAccurate', { meters: location.accuracy })} ${t('submit.fairAccuracy')}` };
    return { status: 'poor', message: `${t('submit.gpsAccurate', { meters: location.accuracy })} ${t('submit.poorAccuracy')}` };
  };

  const locationStatus = getLocationStatus();
  
  return (
    <div className="w-full space-y-6">
      {/* Citizen Information Section */}
      <div className="bg-card rounded-lg border border-border p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-md">
            <Icon name="User" size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-base lg:text-lg font-semibold text-foreground">
              {t('submit.contactTitle')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('submit.contactSubtitle')}
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('submit.fullName')} <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder={t('submit.namePlaceholder')}
              value={citizenName}
              onChange={(e) => onCitizenInfoChange('citizenName', e.target.value)}
              className="w-full"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('submit.email')} <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder={t('submit.emailPlaceholder')}
              value={citizenEmail}
              onChange={(e) => onCitizenInfoChange('citizenEmail', e.target.value)}
              className="w-full"
              required
            />
          </div>
        </div>
      </div>

      {/* Location Accuracy Status */}
      {location && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-md ${
              locationStatus.status === 'good' ? 'bg-green-50' :
              locationStatus.status === 'fair' ? 'bg-yellow-50' :
              locationStatus.status === 'manual' ? 'bg-blue-50' :
              'bg-red-50'
            }`}>
              <Icon 
                name={location.source === 'gps' ? 'Navigation' : 'MapPin'} 
                size={16} 
                className={
                  locationStatus.status === 'good' ? 'text-green-600' :
                  locationStatus.status === 'fair' ? 'text-yellow-600' :
                  locationStatus.status === 'manual' ? 'text-blue-600' :
                  'text-red-600'
                } 
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{t('submit.locationStatus')}</p>
              <p className="text-xs text-muted-foreground">{locationStatus.message}</p>
            </div>
            {locationStatus.status === 'good' && (
              <Icon name="CheckCircle" size={16} className="text-green-600" />
            )}
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors?.length > 0 && (
        <div className="p-4 rounded-lg bg-error/10 border border-error/20">
          <div className="flex items-start gap-3">
            <Icon name="AlertCircle" size={20} className="text-error flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-error mb-2">
                {t('submit.fixIssues')}
              </h4>
              <ul className="space-y-1">
                {validationErrors?.map((error, index) => (
                  <li key={index} className="text-sm text-error flex items-start gap-2">
                    <span className="text-error mt-1">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Submit Section */}
      <div className="bg-card rounded-lg border border-border p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-md flex-shrink-0">
              <Icon name="Send" size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-foreground">
                {t('submit.readyToSubmit')}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isUploadingImages 
                  ? t('submit.uploadingImages')
                  : isSubmitting 
                    ? t('submit.creatingReport')
                    : t('submit.willBeSent')
                }
              </p>
            </div>
          </div>

          <Button
            variant="default"
            size="lg"
            onClick={onSubmit}
            loading={isProcessing}
            disabled={!canSubmit || isProcessing}
            iconName="Send"
            iconPosition="right"
            iconSize={18}
            className="w-full lg:w-auto lg:min-w-[200px]"
          >
            {isUploadingImages 
              ? t('submit.uploadingBtn')
              : isSubmitting 
                ? t('submit.submittingBtn')
                : t('submit.submitBtn')
            }
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Icon name="Shield" size={14} className="flex-shrink-0 mt-0.5" />
            <p>
              {t('submit.reviewNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitSection;