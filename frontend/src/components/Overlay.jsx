import React from 'react';
import { motion } from 'framer-motion';
import './Overlay.css';
import { useSceneStore } from '../core/SceneManager';

const Overlay = () => {
  const { isFadingToBlack, completeFade, overlayColor } = useSceneStore();

  return (
    <motion.div
      className="overlay"
      style={{ backgroundColor: overlayColor }}
      initial={{ opacity: 1 }}
      animate={{ opacity: isFadingToBlack ? 1 : 0 }}
      transition={{
        duration: isFadingToBlack ? 0.75 : 2.5,
        delay: isFadingToBlack ? 1.34 : 0,
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