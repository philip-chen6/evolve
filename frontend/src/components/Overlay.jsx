import React from 'react';
import { motion } from 'framer-motion';
import './Overlay.css';
import { useSceneStore } from '../core/SceneManager';

const Overlay = () => {
  const { navigationState, overlayColor, isIntroComplete, searchQuery } = useSceneStore();

  return (
    <motion.div
      className="overlay"
      style={{ backgroundColor: overlayColor }}
      initial={{ opacity: 1 }}
      animate={{ opacity: navigationState === 'zoomingIn' ? 1 : 0 }}
      transition={{
        duration: navigationState === 'zoomingIn' ? 1.25 : (isIntroComplete ? 2.0 : 3.5),
        delay: navigationState === 'zoomingIn' ? 0.85 : 0,
      }}
      onAnimationComplete={() => {
        if (navigationState === 'zoomingIn') {
          const query = encodeURIComponent(searchQuery);
          window.location.hash = `timeline?q=${query}`;
        }
      }}
    />
  );
};

export default Overlay;