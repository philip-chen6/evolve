import React, { useState, useEffect, useRef } from 'react';
import './GlassSearchBar.css';

const queries = [
  "large language models",
  "graph algorithms",
  "gene editing",
  "quantum computing",
  "blockchain technology",
];

const GlassSearchBar = () => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const glassRef = useRef(null);
  const inputRef = useRef(null);

  const handleFocus = () => {
    setShowSuggestions(true);
  };

  const handleBlur = (e) => {
    if (!e.relatedTarget || !e.relatedTarget.closest('.search-suggestions')) {
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (query) => {
    setInputValue(query);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      const rect = glassRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const specular = glassRef.current.querySelector('.glass-specular');
      if (specular) {
        specular.style.background = `radial-gradient(
          circle at ${x}px ${y}px,
          rgba(255,255,255,0.15) 0%,
          rgba(255,255,255,0.05) 30%,
          rgba(255,255,255,0) 60%
        )`;
      }
    };

    const handleMouseLeave = () => {
      const specular = glassRef.current.querySelector('.glass-specular');
      if (specular) {
        specular.style.background = 'none';
      }
    };

    const element = glassRef.current;
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="glass-search" ref={glassRef}>
      <div className="glass-filter"></div>
      <div className="glass-overlay"></div>
      <div className="glass-specular"></div>
      <div className="glass-content">
        <div className={`search-container ${showSuggestions ? 'expanded' : ''}`}>
          <i className="fas fa-search search-icon"></i>
          <input
            ref={inputRef}
            type="text"
            placeholder="search..."
            className="search-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <button className="search-clear" aria-label="Clear search" onClick={handleClear}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className={`search-suggestions ${showSuggestions || inputValue ? 'active' : ''}`}>
          <div className="suggestion-group">
            <h4>Suggestions</h4>
            <ul>
              {queries.map((query) => (
                <li key={query} onClick={() => handleSuggestionClick(query)}>
                  <i className="fas fa-arrow-trend-up"></i>{query}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlassSearchBar;
