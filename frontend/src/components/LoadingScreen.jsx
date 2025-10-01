import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import './LoadingScreen.css';
import { useSceneStore } from '../core/SceneManager';

const LoadingScreen = () => {
  const { setIsLoading, setIntroComplete } = useSceneStore();

  useEffect(() => {
    const introTimer = setTimeout(() => {
      setIntroComplete(true);
    }, 3000); // Start UI animations as the fade-out begins

    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 4500); // Remove loading screen after the longer fade-out

    return () => {
      clearTimeout(introTimer);
      clearTimeout(loadingTimer);
    };
  }, [setIsLoading, setIntroComplete]);

  return (
    <motion.div
      className="loading-screen"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.95, delay: 3.0 }}
    >
      <div className="loading-bar-container">
        <motion.div
          className="loading-bar"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2.5, delay: 0.5, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
