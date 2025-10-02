import React from 'react';
import { motion } from 'framer-motion';
import './Overlay.css';
import { useSceneStore } from '../core/SceneManager';

const Overlay = () => {
  const { isFadingToBlack, completeFade, overlayColor, isIntroComplete } = useSceneStore();

  return (
    <motion.div
      className="overlay"
      style={{ backgroundColor: overlayColor }}
      initial={{ opacity: 1 }}
      animate={{ opacity: isFadingToBlack ? 1 : 0 }}
      transition={{
        duration: isFadingToBlack ? 1.25 : (isIntroComplete ? 2.0 : 3.5),
        delay: isFadingToBlack ? 0.85 : 0,
      }}
      onAnimationComplete={() => {
        if (isFadingToBlack) {
          completeFade();
        }
      }}
    />
  );
};

export default Overlay;