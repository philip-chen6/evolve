import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Slab } from 'react-loading-indicators';
import './LoadingScreen.css';
import { useSceneStore } from '../core/SceneManager';

const LoadingScreen = () => {
  const { setIsLoading, setIntroComplete } = useSceneStore();

  useEffect(() => {
    // Trigger the intro animations for the main page content
    const introTimer = setTimeout(() => {
      setIntroComplete(true);
    }, 3000); // Sync with the fade-out delay

    // Remove the loading screen component from the DOM
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 4000); // Keep the loading screen for 4 seconds

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
      transition={{ duration: 1, delay: 3 }} // Fade out after 3 seconds
    >
      <Slab color="white" size="medium" />
    </motion.div>
  );
};

export default LoadingScreen;