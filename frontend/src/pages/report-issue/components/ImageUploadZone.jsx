import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import { uploadApi } from '../../../utils/api';
import { toast } from '../../../utils/toast';

const ImageUploadZone = ({ images = [], onImagesChange, onAIClassification = null, onAIClassificationStart = null, isClassifying = false, maxImages = 5 }) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [imageFiles, setImageFiles] = useState([]); // Store actual File objects
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleDragOver = (e) => {
    e?.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e?.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e?.dataTransfer?.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    const validImageFiles = files?.filter(file => file?.type?.startsWith('image/'));
    
    if (imageFiles?.length + validImageFiles?.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    const newFiles = [...imageFiles, ...validImageFiles];
    setImageFiles(newFiles);

    // Create preview objects for display
    const newImagePreviews = validImageFiles?.map(file => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      alt: `Uploaded civic issue photo showing ${file?.name?.split('.')?.[0]?.replace(/-|_/g, ' ')}`
    }));

    const allPreviews = [...images, ...newImagePreviews];
    
    // Pass the actual File objects to parent component first
    onImagesChange(newFiles);
    
    // Trigger AI classification for the first new image (if callback provided)
    if (onAIClassification && validImageFiles.length > 0) {
      if (onAIClassificationStart) onAIClassificationStart(); // Notify parent that classification started
      await classifyFirstImage(validImageFiles[0]);
    }
  };
  
  const classifyFirstImage = async (imageFile) => {
    try {
      const response = await uploadApi.uploadAndClassifyImage(imageFile);
      
      if (response.success && response.data.aiClassification) {
        const aiResult = response.data.aiClassification;
        
        // Notify parent component about AI prediction
        onAIClassification({
          category: aiResult.category,
          confidence: aiResult.confidence,
          explanation: aiResult.explanation,
          needsReview: aiResult.needsReview,
          wasReclassified: aiResult.wasReclassified
        });
        
        // Show success message
        toast.success(`AI detected: ${aiResult.category} (${Math.round(aiResult.confidence * 100)}% confidence)`);
      }
    } catch (error) {
      console.error('AI classification failed:', error);
      
      // Show more specific error messages
      let errorMessage = t('imageUpload.aiFailed');
      if (error.message.includes('API key')) {
        errorMessage = t('imageUpload.aiNotConfigured');
      } else if (error.message.includes('quota')) {
        errorMessage = t('imageUpload.aiQuotaExceeded');
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorMessage = t('imageUpload.aiUnavailable');
      }
      
      toast.error(errorMessage);
      
      // Notify parent about classification failure
      if (onAIClassification) {
        onAIClassification({
          category: null,
          confidence: 0,
          explanation: t('imageUpload.aiClassificationFailed'),
          needsReview: true,
          error: error.message
        });
      }

    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e?.target?.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleRemoveImage = (imageIndex) => {
    const updatedFiles = imageFiles.filter((_, index) => index !== imageIndex);
    setImageFiles(updatedFiles);
    
    // Also update the preview images
    const updatedPreviews = images.filter((_, index) => index !== imageIndex);
    
    // Update parent with new file list
    onImagesChange(updatedFiles);
  };

  const triggerFileInput = () => {
    fileInputRef?.current?.click();
  };

  const triggerCameraInput = () => {
    cameraInputRef?.current?.click();
  };

  // Create preview URLs for display
  const displayImages = imageFiles.map((file, index) => ({
    id: `file-${index}`,
    preview: URL.createObjectURL(file),
    alt: `Uploaded civic issue photo - ${file.name}`
  }));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base lg:text-lg font-semibold text-foreground">{t('imageUpload.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('imageUpload.addPhotos', { max: maxImages })} ({imageFiles?.length}/{maxImages})
            {onAIClassification && t('imageUpload.aiAnalyze')}
          </p>
        </div>
        <div className="flex gap-2">
          {isClassifying && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
              <Icon name="Bot" size={14} className="animate-pulse" />
              <span>{t('imageUpload.aiAnalyzing')}</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={triggerCameraInput}
            iconName="Camera"
            iconPosition="left"
            iconSize={16}
            disabled={imageFiles?.length >= maxImages}
          >
            <span className="hidden sm:inline">{t('imageUpload.camera')}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={triggerFileInput}
            iconName="Upload"
            iconPosition="left"
            iconSize={16}
            disabled={imageFiles?.length >= maxImages}
          >
            <span className="hidden sm:inline">{t('imageUpload.browse')}</span>
          </Button>
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      {displayImages?.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 lg:p-12
            transition-smooth cursor-pointer
            ${isDragging 
              ? 'border-primary bg-primary/5' :'border-border bg-muted/30 hover:bg-muted/50'
            }
          `}
          onClick={triggerFileInput}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Icon name="ImagePlus" size={32} className="text-primary" />
            </div>
            <h4 className="text-base lg:text-lg font-semibold text-foreground mb-2">
              {t('imageUpload.uploadTitle')}
            </h4>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              {t('imageUpload.dragDrop')}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="default"
                size="sm"
                iconName="Camera"
                iconPosition="left"
                iconSize={16}
                onClick={(e) => {
                  e?.stopPropagation();
                  triggerCameraInput();
                }}
              >
                {t('imageUpload.takePhoto')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                iconName="Upload"
                iconPosition="left"
                iconSize={16}
              >
                {t('imageUpload.chooseFiles')}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {displayImages?.map((image, index) => (
              <div
                key={image?.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border group"
              >
                <Image
                  src={image?.preview}
                  alt={image?.alt}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-error/90 hover:bg-error flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth"
                  aria-label="Remove image"
                >
                  <Icon name="X" size={16} className="text-error-foreground" />
                </button>
              </div>
            ))}
          </div>

          {displayImages?.length < maxImages && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-6
                transition-smooth cursor-pointer
                ${isDragging 
                  ? 'border-primary bg-primary/5' :'border-border bg-muted/30 hover:bg-muted/50'
                }
              `}
              onClick={triggerFileInput}
            >
              <div className="flex items-center justify-center gap-4">
                <Icon name="Plus" size={24} className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t('imageUpload.addMore', { remaining: maxImages - displayImages?.length })}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploadZone;