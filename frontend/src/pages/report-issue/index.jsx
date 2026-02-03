import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    document.title = "Report Issue - Smart Civic Issue Reporter";
    window.scrollTo(0, 0);
  }, []);

  const workflowSteps = [
    { label: 'Capture', icon: 'Camera', description: 'Upload photos of the issue' },
    { label: 'Categorize', icon: 'Tag', description: 'Select issue category' },
    { label: 'Submit', icon: 'Send', description: 'Review and submit report' }
  ];

  const validateForm = () => {
    const errors = [];

    if (formData?.imageFiles?.length === 0) {
      errors?.push('At least one photo is required to document the issue');
    }

    if (!formData?.category) {
      errors?.push('Please select an issue category');
    }

    // Free location validation with OpenStreetMap integration
    if (!formData?.location) {
      errors?.push('Location information is required for precise issue reporting');
    } else {
      // Check if location has coordinates (GPS) or manual address
      const hasGPSLocation = formData?.location?.coordinates && 
                            formData?.location?.coordinates?.latitude && 
                            formData?.location?.coordinates?.longitude;
      const hasManualAddress = formData?.location?.address && 
                              formData?.location?.addressSource === 'manual';
      
      if (!hasGPSLocation && !hasManualAddress) {
        errors?.push('Valid location information required - please detect GPS location or enter address manually');
      }
      
      // For GPS locations, check accuracy requirements for civic reporting
      if (hasGPSLocation && formData?.location?.accuracy) {
        if (formData?.location?.accuracy > 100) {
          errors?.push(`Location accuracy too low (±${formData.location.accuracy}m). Please retry detection or move to an area with better GPS signal.`);
        }
        // Note: 50-100m accuracy shows warning but doesn't block submission
      }
      
      if (!formData?.location?.address) {
        errors?.push('Address information missing - please wait for location detection to complete or enter manually');
      }
    }

    if (!formData?.citizenName?.trim()) {
      errors?.push('Your name is required');
    }

    if (!formData?.citizenEmail?.trim()) {
      errors?.push('Your email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData?.citizenEmail)) {
      errors?.push('Please enter a valid email address');
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

  const handleCategoryChange = useCallback((category) => {
    setFormData(prev => ({ ...prev, category }));
    if (category && currentStep === 2) {
      setCurrentStep(3);
    }
  }, [currentStep]);

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
          toast.error('Failed to upload images. Please try again.');
          return;
        } finally {
          setIsUploadingImages(false);
        }
      }

      // Step 2: Create issue with uploaded image URLs
      const issueData = {
        citizenName: formData.citizenName.trim(),
        citizenEmail: formData.citizenEmail.trim(),
        category: formData.category,
        description: formData.description.trim() || 'No additional description provided',
        location: formData.location.address,
        latitude: formData.location.lat || null,
        longitude: formData.location.lng || null,
        images: uploadedImageUrls,
        status: 'pending',
        priority: 'medium' // Default priority
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

        toast.success('Issue reported successfully!');
        navigate('/issue-confirmation', { state: { report: reportData } });
      } else {
        throw new Error(createResponse.message || 'Failed to create issue');
      }
      
    } catch (error) {
      console.error('Error submitting issue:', error);
      toast.error(error.message || 'Failed to submit issue. Please try again.');
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
                  Report Civic Issue
                </h1>
                <p className="text-sm lg:text-base text-muted-foreground mt-1 animate-slide-in-left">
                  Help improve your community by reporting issues
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
                    Please complete the following:
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
                maxImages={5}
              />
            </div>

            <div className="bg-card rounded-lg border border-border p-4 lg:p-6 animate-fade-in-up animate-stagger-2 hover-lift">
              <CategorySelector
                selectedCategory={formData?.category}
                onCategoryChange={handleCategoryChange}
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
                  What happens next?
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">1.</span>
                    <span>Your report will be reviewed by local authorities within 24-48 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">2.</span>
                    <span>You'll receive a tracking ID to monitor the progress of your issue</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">3.</span>
                    <span>Authorities will update the status as they work on resolving the issue</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">4.</span>
                    <span>You can track all updates on the public transparency dashboard</span>
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