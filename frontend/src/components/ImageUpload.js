import React, { useState } from 'react';
import { uploadAPI } from '../services/api';

const ImageUpload = ({ onImagesUploaded, multiple = false, maxFiles = 5 }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      let uploadResult;
      
      if (multiple) {
        // Multiple file upload
        const fileArray = Array.from(files).slice(0, maxFiles);
        uploadResult = await uploadAPI.uploadImages(fileArray);
      } else {
        // Single file upload
        uploadResult = await uploadAPI.uploadImage(files[0]);
      }

      if (uploadResult.data.success) {
        const uploadedImages = multiple ? uploadResult.data.data : [uploadResult.data.data];
        onImagesUploaded(uploadedImages);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image(s). Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    handleFileSelect(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div className="w-full">
      <div
        className={`file-upload-area ${dragOver ? 'dragover' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={uploading}
        />
        
        {uploading ? (
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-2"></div>
            <p className="text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-gray-600 mb-2">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              {multiple ? `PNG, JPG, GIF up to 5MB each (max ${maxFiles} files)` : 'PNG, JPG, GIF up to 5MB'}
            </p>
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        {multiple ? 'You can upload multiple images as evidence' : 'Upload an image as evidence'}
      </p>
    </div>
  );
};

export default ImageUpload;