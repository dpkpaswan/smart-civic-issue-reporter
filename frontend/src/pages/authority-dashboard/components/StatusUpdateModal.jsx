import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import { LoadingButton } from '../../../components/ui/Loading';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { uploadApi } from '../../../utils/api';

const StatusUpdateModal = ({ issue, onClose, onUpdate, isUpdating = false }) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState(issue?.status || 'submitted');
  const [notes, setNotes] = useState('');
  const [resolutionImages, setResolutionImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => {
        if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const statusOptions = [
    { value: 'submitted', label: t('statusUpdate.submitted') },
    { value: 'in-progress', label: t('statusUpdate.inProgress') },
    { value: 'resolved', label: t('statusUpdate.resolved') }
  ];

  const isResolved = status === 'resolved';
  const needsImages = isResolved && resolutionImages.length === 0;

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        setUploadError(`Invalid file type: ${file.name}. Use JPEG, PNG, or WebP.`);
        return;
      }
      if (file.size > maxSize) {
        setUploadError(`File too large: ${file.name}. Maximum 5MB per image.`);
        return;
      }
    }

    setUploadError('');
    setIsUploading(true);

    try {
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...previews]);

      const uploadedUrls = [];
      for (const file of files) {
        const result = await uploadApi.uploadImage(file);
        // Prefer fullUrl for consistent storage
        const url = result?.data?.fullUrl || result?.data?.url || result?.fullUrl || result?.url;
        if (url) {
          uploadedUrls.push(url);
        }
      }

      setResolutionImages(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Image upload failed:', error);
      setUploadError(error.message || 'Failed to upload image. Please try again.');
      setImagePreviews(prev => prev.slice(0, resolutionImages.length));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    setResolutionImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      const removed = prev[index];
      if (removed?.startsWith('blob:')) URL.revokeObjectURL(removed);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (isResolved && resolutionImages.length === 0) {
      setUploadError(t('statusUpdate.uploadAtLeastOne'));
      return;
    }

    try {
      await onUpdate(issue?.id, status, notes, resolutionImages);
      onClose();
    } catch (error) {
      console.error('[StatusUpdateModal] Update failed:', error);
      setUploadError(error.message || 'Update failed');
    }
  };

  if (!issue) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg border border-border shadow-elevation-4 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 md:p-6 flex items-center justify-between z-10">
          <h2 className="text-lg md:text-xl font-semibold text-foreground">
            {t('statusUpdate.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-muted transition-smooth"
            aria-label="Close modal"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">
              {t('statusUpdate.issueId')}{issue?.id}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {issue?.description}
            </p>
          </div>

          <Select
            label={t('statusUpdate.newStatus')}
            description={t('statusUpdate.selectStatus')}
            options={statusOptions}
            value={status}
            onChange={setStatus}
            required
          />

          <Input
            label={t('statusUpdate.resolutionNotes')}
            description={t('statusUpdate.notesPlaceholder')}
            type="text"
            placeholder={t('statusUpdate.enterNotes')}
            value={notes}
            onChange={(e) => setNotes(e?.target?.value)}
            className="h-24"
          />

          {/* Resolution Image Upload — required when resolving */}
          {isResolved && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('statusUpdate.proofImages')} <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  {t('statusUpdate.proofImagesDesc')}
                </p>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group rounded-lg overflow-hidden border border-border aspect-square">
                      <Image
                        src={resolutionImages[index] || preview}
                        alt={`Resolution proof ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                        aria-label="Remove image"
                      >
                        <Icon name="X" size={14} />
                      </button>
                      {index >= resolutionImages.length && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 ${
                  needsImages
                    ? 'border-red-300 bg-red-50 hover:border-red-400'
                    : 'border-border hover:border-primary/50 hover:bg-primary/5'
                } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Icon
                  name={isUploading ? 'Loader' : 'Camera'}
                  size={28}
                  className={`mx-auto mb-2 ${needsImages ? 'text-red-400' : 'text-muted-foreground'} ${isUploading ? 'animate-spin' : ''}`}
                />
                <p className={`text-sm font-medium ${needsImages ? 'text-red-600' : 'text-foreground'}`}>
                  {isUploading ? t('statusUpdate.uploading') : resolutionImages.length > 0 ? t('statusUpdate.addMore') : t('statusUpdate.uploadProof')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('statusUpdate.imageFormat')}
                </p>
              </div>

              {uploadError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <Icon name="AlertTriangle" size={16} className="flex-shrink-0" />
                  {uploadError}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              fullWidth
            >
              {t('statusUpdate.cancel')}
            </Button>
            <LoadingButton
              type="submit"
              variant="default"
              iconName="Check"
              iconPosition="left"
              iconSize={18}
              fullWidth
              isLoading={isUpdating || isUploading}
              disabled={isUpdating || isUploading || (isResolved && resolutionImages.length === 0)}
            >
              {isUpdating ? t('statusUpdate.updatingBtn') : isUploading ? t('statusUpdate.uploadingBtn') : t('statusUpdate.updateBtn')}
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusUpdateModal;