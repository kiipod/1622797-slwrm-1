// LandingPageSlider.jsx
import React from 'react';
import { SliderProvider } from '../../context/SliderContext';
import SlideList from '../Slider/SlideList/SlideList';
import styles from './LandingPageSlider.module.scss';

const LandingPageSlider = ({autoPlay, autoPlayTime, images}) => {
  return (
    <SliderProvider autoPlay={autoPlay} autoPlayTime={autoPlayTime} images={images}>
      <div className={styles.fullWidthSlider}>
        <SlideList/>
      </div>
    </SliderProvider>
  );
};

export default LandingPageSlider;
