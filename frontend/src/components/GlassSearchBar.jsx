import React, { useState, useEffect, useRef } from 'react';
import './GlassSearchBar.css';
import DecryptedText from './DecryptedText';
import { useSceneStore } from '../core/SceneManager';

const queries = [
  "large language models",
  "graph algorithms",
  "gene editing",
].map(q => q.toLowerCase());

const GlassSearchBar = () => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const glassRef = useRef(null);
  const inputRef = useRef(null);
  const { submitSearch, isFadingToBlack } = useSceneStore();

  const handleFocus = () => setShowSuggestions(true);
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
    setTimeout(() => {
      setInputValue(query);
      setShowSuggestions(false);
      inputRef.current?.focus();
    }, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() !== '' && !isFadingToBlack) {
      submitSearch(inputValue.trim());
      setInputValue(''); // Clear input immediately
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const currentRef = glassRef.current;
    const handleMouseMove = (e) => {
      if (!currentRef) return;
      const rect = currentRef.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const specular = currentRef.querySelector('.glass-specular');
      if (specular) {
        specular.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0) 60%)`;
      }
    };
    const handleMouseLeave = () => {
      if (!currentRef) return;
      const specular = currentRef.querySelector('.glass-specular');
      if (specular) {
        specular.style.background = 'none';
      }
    };
    currentRef?.addEventListener('mousemove', handleMouseMove);
    currentRef?.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      currentRef?.removeEventListener('mousemove', handleMouseMove);
      currentRef?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="glass-search-container">
      <form
        className="glass-search"
        ref={glassRef}
        onSubmit={handleSubmit}
      >
        <div className="glass-filter" />
        <div className="glass-overlay" />
        <div className="glass-specular" />
        <div className="glass-content">
          <div className={`search-container ${showSuggestions ? 'expanded' : ''}`}>
            <i className="fas fa-search search-icon" />
            <input
              ref={inputRef}
              type="text"
              placeholder=""
              className="search-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit(e);
                }
              }}
            />
            {!inputValue && (
              <div className="placeholder">
                <DecryptedText text="search..." animateOn="view" sequential={true} speed={50} />
              </div>
            )}
            <button className="search-clear" aria-label="Clear search" onClick={handleClear}>
              <i className="fas fa-times" />
            </button>
          </div>
          <div className={`search-suggestions ${showSuggestions || inputValue ? 'active' : ''}`}>
            <div className="suggestion-group">
              <h4>suggestions</h4>
              <ul>
                {queries.map((query) => (
                  <li key={query} onMouseDown={() => handleSuggestionClick(query)}>
                    <i className="fas fa-arrow-trend-up" />
                    {query}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default GlassSearchBar;