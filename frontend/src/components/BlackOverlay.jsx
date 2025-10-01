import React from 'react';
import { motion } from 'framer-motion';
import './BlackOverlay.css';
import { useSceneStore } from '../core/SceneManager';

const BlackOverlay = () => {
  const { isFadingToBlack, completeFade } = useSceneStore();

  return (
    <motion.div
      className="black-overlay"
      initial={{ opacity: 1 }}
      animate={{ opacity: isFadingToBlack ? 1 : 0 }}
      transition={{
        duration: isFadingToBlack ? 1.5 : 1,
        delay: isFadingToBlack ? 0.69 : 0,
      }}
      style={{ pointerEvents: isFadingToBlack ? 'auto' : 'none' }}
      onAnimationComplete={() => {
        if (isFadingToBlack) {
          completeFade();
        }
      }}
    />
  );
};

export default BlackOverlay;
