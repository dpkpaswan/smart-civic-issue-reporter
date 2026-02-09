import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../../components/ui/Header';
import ProgressWorkflowIndicator from '../../components/ui/ProgressWorkflowIndicator';
import { LoadingButton } from '../../components/ui/Loading';
import { toast } from '../../utils/toast';
import { issuesApi, uploadApi } from '../../utils/api';
import ImageUploadZone from './components/ImageUploadZone';
import CategorySelector from './components/CategorySelector';
import FreeLocationPicker from './components/FreeLocationPicker';
import DescriptionInput from './components/DescriptionInput';
import SubmitSection from './components/SubmitSection';
import Icon from '../../components/AppIcon';

const ReportIssue = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  
  const [formData, setFormData] = useState({
    images: [], // Will store uploaded image URLs
    imageFiles: [], // Will store actual File objects for upload
    category: '',
    location: null,
    description: '',
    citizenName: '',
    citizenEmail: ''
  });

  const [aiPrediction, setAiPrediction] = useState(null);
  const [isAIClassifying, setIsAIClassifying] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    document.title = t('reportIssue.pageTitle');
    window.scrollTo(0, 0);
  }, []);

  const workflowSteps = [
    { label: t('reportIssue.stepCapture'), icon: 'Camera', description: t('reportIssue.stepCaptureDesc') },
    { label: t('reportIssue.stepCategorize'), icon: 'Tag', description: t('reportIssue.stepCategorizeDesc') },
    { label: t('reportIssue.stepSubmit'), icon: 'Send', description: t('reportIssue.stepSubmitDesc') }
  ];

  const validateForm = () => {
    const errors = [];

    if (formData?.imageFiles?.length === 0) {
      errors?.push(t('reportIssue.photoRequired'));
    }

    if (!formData?.category) {
      errors?.push(t('reportIssue.categoryRequired'));
    }

    // Free location validation with OpenStreetMap integration
    if (!formData?.location) {
      errors?.push(t('reportIssue.locationRequired'));
    } else {
      // Check if location has coordinates (GPS) or manual address
      const hasGPSLocation = formData?.location?.coordinates && 
                            formData?.location?.coordinates?.latitude && 
                            formData?.location?.coordinates?.longitude;
      const hasManualAddress = formData?.location?.address && 
                              formData?.location?.addressSource === 'manual';
      
      if (!hasGPSLocation && !hasManualAddress) {
        errors?.push(t('reportIssue.validLocationRequired'));
      }
      
      // Accuracy is informational only — never blocks submission
      // Desktop browsers use IP/WiFi geolocation (can be 100-50000m+)
      // Mobile devices have actual GPS (~5-50m)
      // As long as we have coordinates + a reverse-geocoded address, that's enough
      
      if (!formData?.location?.address) {
        errors?.push(t('reportIssue.addressMissing'));
      }
    }

    if (!formData?.citizenName?.trim()) {
      errors?.push(t('reportIssue.nameRequired'));
    }

    if (!formData?.citizenEmail?.trim()) {
      errors?.push(t('reportIssue.emailRequired'));
    } else if (!/\S+@\S+\.\S+/.test(formData?.citizenEmail)) {
      errors?.push(t('reportIssue.validEmail'));
    }

    setValidationErrors(errors);
    return errors?.length === 0;
  };

  const handleImagesChange = useCallback((imageFiles) => {
    setFormData(prev => ({ 
      ...prev, 
      imageFiles,
      images: imageFiles.map(file => URL.createObjectURL(file)) // Create preview URLs
    }));
    if (imageFiles?.length > 0 && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [currentStep]);
  
  const handleAIClassification = useCallback((prediction) => {
    setAiPrediction(prediction);
    setIsAIClassifying(false);
    
    // Auto-select the predicted category if confidence is high enough
    if (prediction?.category && prediction.confidence >= 0.6) {
      setFormData(prev => ({ ...prev, category: prediction.category }));
      
      // Auto-advance to next step if category was auto-selected
      if (currentStep === 2) {
        setTimeout(() => setCurrentStep(3), 1500); // Brief delay to show the selection
      }
    }
  }, [currentStep]);
  
  const handleAIClassificationStart = useCallback(() => {
    setIsAIClassifying(true);
    setAiPrediction(null); // Clear previous prediction
  }, []);

  const handleCategoryChange = useCallback((category) => {
    setFormData(prev => ({ ...prev, category }));
    if (category && currentStep === 2) {
      setCurrentStep(3);
    }
    
    // Log if user overrides AI prediction
    if (aiPrediction?.category && category !== aiPrediction.category) {
      // User overrode AI prediction — this is acceptable
    }
  }, [currentStep, aiPrediction]);

  const handleLocationChange = useCallback((location) => {
    setFormData(prev => ({ ...prev, location }));
  }, []);

  const handleDescriptionChange = useCallback((description) => {
    setFormData(prev => ({ ...prev, description }));
  }, []);

  const handleCitizenInfoChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Step 1: Upload images if any
      let uploadedImageUrls = [];
      if (formData.imageFiles.length > 0) {
        setIsUploadingImages(true);
        
        try {
          const uploadResponse = await uploadApi.uploadImages(formData.imageFiles);
          
          if (uploadResponse.success) {
            uploadedImageUrls = uploadResponse.data.map(img => img.fullUrl);
          } else {
            throw new Error('Image upload failed');
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          toast.error(t('reportIssue.uploadFailed'));
          return;
        } finally {
          setIsUploadingImages(false);
        }
      }

      // Step 2: Create issue with uploaded image URLs
      // Build location object matching backend schema { lat, lng, address }
      const loc = formData.location;
      const lat = loc?.coordinates?.latitude || loc?.lat || null;
      const lng = loc?.coordinates?.longitude || loc?.lng || null;

      const issueData = {
        citizenName: formData.citizenName.trim(),
        citizenEmail: formData.citizenEmail.trim(),
        category: formData.category,
        description: formData.description.trim() || t('reportIssue.noDescription'),
        location: {
          lat: lat ? parseFloat(lat) : 0,
          lng: lng ? parseFloat(lng) : 0,
          address: loc?.address || loc?.addressDetails?.formattedAddress || t('reportIssue.addressNotAvailable')
        },
        images: uploadedImageUrls
      };

      const createResponse = await issuesApi.create(issueData);
      
      if (createResponse.success) {
        const reportData = {
          id: createResponse.data.id,
          ...formData,
          images: uploadedImageUrls,
          status: 'submitted',
          submittedAt: new Date().toISOString(),
          estimatedResolution: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };

        toast.success(t('reportIssue.issueReportedSuccess'));
        navigate('/issue-confirmation', { state: { report: reportData } });
      } else {
        throw new Error(createResponse.message || t('reportIssue.createIssueFailed'));
      }
      
    } catch (error) {
      console.error('Error submitting issue:', error);
      toast.error(error.message || t('reportIssue.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = formData?.images?.length > 0 && 
                    formData?.category && 
                    formData?.location && 
                    !isSubmitting;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-6 lg:py-8">
          <div className="mb-6 lg:mb-8 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => navigate('/home-landing')}
                className="p-2 rounded-md hover:bg-muted transition-smooth hover-scale"
                aria-label="Go back"
              >
                <Icon name="ArrowLeft" size={20} />
              </button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground animate-slide-in-right">
                  {t('reportIssue.title')}
                </h1>
                <p className="text-sm lg:text-base text-muted-foreground mt-1 animate-slide-in-left">
                  {t('reportIssue.subtitle')}
                </p>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4 lg:p-6 animate-fade-in-scale hover-lift">
              <ProgressWorkflowIndicator
                currentStep={currentStep}
                steps={workflowSteps}
                orientation="horizontal"
              />
            </div>
          </div>

          {validationErrors?.length > 0 && (
            <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20 animate-shake">
              <div className="flex items-start gap-3">
                <Icon name="AlertCircle" size={20} className="text-error flex-shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-error mb-2">
                    {t('reportIssue.pleaseComplete')}
                  </h4>
                  <ul className="space-y-1">
                    {validationErrors?.map((error, index) => (
                      <li key={index} className="text-sm text-error flex items-start gap-2 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                        <span className="text-error mt-1">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6 lg:space-y-8">
            <div className="bg-card rounded-lg border border-border p-4 lg:p-6 animate-fade-in-up animate-stagger-1 hover-lift">
              <ImageUploadZone
                images={formData?.images}
                onImagesChange={handleImagesChange}
                onAIClassification={handleAIClassification}
                onAIClassificationStart={handleAIClassificationStart}
                isClassifying={isAIClassifying}
                maxImages={5}
              />
            </div>

            <div className="bg-card rounded-lg border border-border p-4 lg:p-6 animate-fade-in-up animate-stagger-2 hover-lift">
              <CategorySelector
                selectedCategory={formData?.category}
                onCategoryChange={handleCategoryChange}
                aiPrediction={aiPrediction}
                isLoading={isAIClassifying}
              />
            </div>

            <div className="bg-card rounded-lg border border-border p-4 lg:p-6 animate-fade-in-up animate-stagger-3 hover-lift">
              <FreeLocationPicker
                location={formData?.location}
                onLocationChange={handleLocationChange}
              />
            </div>

            <div className="bg-card rounded-lg border border-border p-4 lg:p-6 animate-fade-in-up animate-stagger-4 hover-lift">
              <DescriptionInput
                value={formData?.description}
                onChange={handleDescriptionChange}
                maxLength={500}
              />
            </div>

            <div className="animate-bounce-in animate-stagger-5">
              <SubmitSection
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                isUploadingImages={isUploadingImages}
                canSubmit={canSubmit}
                validationErrors={validationErrors}
                citizenName={formData.citizenName}
                citizenEmail={formData.citizenEmail}
                onCitizenInfoChange={handleCitizenInfoChange}
                location={formData.location}
              />
            </div>
          </div>

          <div className="mt-6 lg:mt-8 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start gap-3">
              <Icon name="Info" size={20} className="text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  {t('reportIssue.whatHappensNext')}
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">1.</span>
                    <span>{t('reportIssue.reviewedBy')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">2.</span>
                    <span>{t('reportIssue.trackingId')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">3.</span>
                    <span>{t('reportIssue.authoritiesUpdate')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">4.</span>
                    <span>{t('reportIssue.trackOnDashboard')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportIssue;