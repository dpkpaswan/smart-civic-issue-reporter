import React from 'react';
import { getImageUrl } from '../utils/api';

function Image({
  src,
  alt = "Image Name",
  className = "",
  ...props
}) {
  // Resolve the image URL to the correct backend host
  const resolvedSrc = getImageUrl(src);

  return (
    <img
      src={resolvedSrc || '/assets/images/no_image.png'}
      alt={alt}
      className={className}
      onError={(e) => {
        if (e.target.src !== window.location.origin + '/assets/images/no_image.png') {
          e.target.src = '/assets/images/no_image.png';
        }
      }}
      {...props}
    />
  );
}

export default Image;
