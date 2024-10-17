// VerticalGallery.jsx
import React from 'react';
import styles from './VerticalGallery.module.scss';

const VerticalGallery = ({ images, onImageClick }) => {
  return (
    <div className={styles.verticalGallery}>
      {images.map((src, index) => (
        <img
          key={index}
          src={src}
          alt={`Image ${index + 1}`}
          className={styles.image}
          onClick={() => onImageClick(index)}
        />
      ))}
    </div>
  );
};

export default VerticalGallery;
