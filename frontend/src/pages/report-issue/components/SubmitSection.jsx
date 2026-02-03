import React from 'react';
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
  location = null // Add location prop for validation display
}) => {
  const isProcessing = isSubmitting || isUploadingImages;
  
  // Check location accuracy status for display
  const getLocationStatus = () => {
    if (!location) return { status: 'missing', message: 'Location not detected' };
    if (location.source === 'manual') return { status: 'manual', message: 'Manual address entered' };
    if (!location.accuracy) return { status: 'unknown', message: 'GPS location detected' };
    
    if (location.accuracy <= 50) return { status: 'good', message: `GPS accurate to ±${location.accuracy}m` };
    if (location.accuracy <= 100) return { status: 'fair', message: `GPS accurate to ±${location.accuracy}m (fair accuracy)` };
    return { status: 'poor', message: `GPS accurate to ±${location.accuracy}m (poor accuracy)` };
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
              Your Contact Information
            </h3>
            <p className="text-sm text-muted-foreground">
              We need this to keep you updated on your report's progress
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Enter your full name"
              value={citizenName}
              onChange={(e) => onCitizenInfoChange('citizenName', e.target.value)}
              className="w-full"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="Enter your email address"
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
              <p className="text-sm font-medium text-foreground">Location Status</p>
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
                Please fix the following issues:
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
                Ready to Submit?
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isUploadingImages 
                  ? 'Uploading images...' 
                  : isSubmitting 
                    ? 'Creating your report...'
                    : 'Your report will be sent to the relevant authorities for review and action'
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
              ? 'Uploading Images...' 
              : isSubmitting 
                ? 'Submitting Report...' 
                : 'Submit Report'
            }
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Icon name="Shield" size={14} className="flex-shrink-0 mt-0.5" />
            <p>
              Your report will be reviewed by local authorities. You'll receive a confirmation email with a tracking ID to monitor the progress of your issue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitSection;