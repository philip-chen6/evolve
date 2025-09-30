import React from 'react';
import { motion } from 'framer-motion';
import './BlackOverlay.css';

const BlackOverlay = () => {
  return (
    <motion.div
      className="black-overlay"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 1, delay: 0.35 }}
    />
  );
};

export default BlackOverlay;
