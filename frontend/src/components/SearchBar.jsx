import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./SearchBar.css";

const queries = [
  "large language models",
  "graph algorithms",
  "gene editing",
  "quantum computing",
  "blockchain technology",
];

const SearchBar = () => {
  const [currentQueryIndex, setCurrentQueryIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    let interval;
    // Only run the animation if the user is not typing
    if (inputValue === "") {
      interval = setInterval(() => {
        setCurrentQueryIndex((prevIndex) => (prevIndex + 1) % queries.length);
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [inputValue]); // Rerun the effect when the input value changes

  return (
    <motion.div
      className="search-bar-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
    >
      <div className="search-input-wrapper">
        <AnimatePresence mode="wait">
          <motion.input
            key={currentQueryIndex}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={queries[currentQueryIndex]}
            className="search-input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          />
        </AnimatePresence>
      </div>
      <div className="search-icon-wrapper">
        <svg
          className="search-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
    </motion.div>
  );
};

export default SearchBar;
