import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import './ChatInput.css';

const ChatInput = ({ onSend }) => {
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [animationState, setAnimationState] = useState("visible");
  const [hasSentFirst, setHasSentFirst] = useState(false);

  const handleSend = () => {
    if (inputValue.trim() === '') return;

    if (!hasSentFirst) {
      setAnimationState("glitch");
      setHasSentFirst(true);
    } else {
      setAnimationState("jump");
    }
    onSend(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSend();
    }
  };

  const containerVariants = {
    visible: {
      y: 0,
      transition: {
        ease: [0.4, 0, 0.2, 1],
        duration: 1.8,
        delay: 1.5
      }
    },
    hidden: { y: '100vh' },
    jump: {
      y: [0, -5, 0],
      scale: [1, 1.02, 1],
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    glitch: {
      y: 0,
      x: [0, 2, 0, -2, 0],
      scale: [1, 1.01, 1, 0.99, 1],
      opacity: [1, 0.7, 1, 0.5, 1],
      transition: { duration: 0.4, ease: "easeInOut" }
    }
  };

  return (
    <motion.div
      className="search-container"
      variants={containerVariants}
      initial="hidden"
      animate={animationState}
      onAnimationComplete={() => {
        if (animationState === "glitch" || animationState === "jump") {
          setAnimationState("visible");
        }
      }}
    >
      <div className={`search-field-wrapper ${isInputFocused ? 'focused' : ''}`}>
        <div className="input-wrapper">
          <input
            type="text"
            className="search-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onKeyDown={handleKeyDown}
          />
          {inputValue === '' && (
            <div className="placeholder-animation">
              <>
                <span>Search for a topic...&nbsp;</span>
                <TypeAnimation
                  sequence={[
                    'the history of artificial intelligence', 2000, 'the evolution of personal computing', 2000, 'the development of CRISPR', 2000, 'the space race', 2000, 'the rise of the internet', 2000,
                  ]}
                  wrapper="span"
                  speed={50}
                  repeat={Infinity}
                />
              </>
            </div>
          )}
        </div>

        <button onClick={handleSend} className="chat-button send-button">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
          </svg>
        </button>

        <div className="laser-trace top"></div>
        <div className="laser-trace bottom"></div>
      </div>
    </motion.div>
  );
};

export default ChatInput;
