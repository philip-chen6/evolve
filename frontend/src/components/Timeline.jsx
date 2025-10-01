import React, { useState, useEffect, useRef, useMemo } from 'react';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import Waves from './Waves';
import './Timeline.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const SimpleSpinner = ({ topic }) => (
    <div className="spinner-container">
        <div className="prompt-text">prompt for {topic}.</div>
        <div className="spinner-grow" />
    </div>
);

const Timeline = () => {
  const [loading, setLoading] = useState(true);
  const [timelineData, setTimelineData] = useState([]);
  const [error, setError] = useState(null);
  const [displayedCount, setDisplayedCount] = useState(0);
  const scrollContainerRef = useRef(null);

  const promptTopic = useMemo(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    return params.get('q') || 'large language models'; // Fallback to default
  }, []);

  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        const prompt = `Generate a timeline of key papers and events for the topic: ${promptTopic}. Provide 6 events. For each event, give me a title, a one-sentence summary, and the year. Return the data as a valid JSON array of objects, where each object has "id", "title", "summary", and "date" keys. Ensure the JSON is clean and contains only the array.`;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const jsonString = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
        const parsedData = JSON.parse(jsonString);
        setTimelineData(parsedData);
      } catch (e) {
        console.error("Failed to fetch or parse timeline data:", e);
        setError("Failed to generate timeline. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineData();
  }, [promptTopic]);

  useEffect(() => {
    if (!loading && timelineData.length > 0 && displayedCount === 0) {
      setDisplayedCount(1); // Show the first item initially
    }
  }, [loading, timelineData]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const handleScroll = () => {
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 200) {
        if (displayedCount < timelineData.length) {
          setDisplayedCount(prev => prev + 1);
        }
      }
    };

    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [displayedCount, timelineData.length]);

  const displayedData = timelineData.slice(0, displayedCount);

  return (
    <>
      <div className="timeline-solid-background" />
      <div className="timeline-animated-content">
        <Waves
          lineColor="rgba(0, 0, 0, 0.2)"
          backgroundColor="transparent"
        />
        {loading ? (
          <SimpleSpinner topic={promptTopic} />
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="timeline-scroll-container" ref={scrollContainerRef}>
            <VerticalTimeline lineColor="#000">
              {displayedData.map((item) => (
                <VerticalTimelineElement
                  key={item.id}
                  className="vertical-timeline-element--work"
                  contentStyle={{ background: '#fff', color: '#000', border: '1px solid #000' }}
                  contentArrowStyle={{ borderRight: '7px solid #000' }}
                  date={item.date}
                  iconStyle={{ background: '#000', color: '#fff' }}
                >
                  <h3 className="vertical-timeline-element-title">{item.title}</h3>
                  <p>{item.summary}</p>
                </VerticalTimelineElement>
              ))}
            </VerticalTimeline>
          </div>
        )}
      </div>
    </>
  );
};

export default Timeline;
