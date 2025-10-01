import React, { useState, useEffect, useRef } from 'react';
import './TimelineItem.css';

// Custom hook to detect when an element is in the viewport
const useInView = (options) => {
    const ref = useRef(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsInView(true);
                observer.disconnect();
            }
        }, options);

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [ref, options]);

    return [ref, isInView];
};

const TimelineItem = ({ item, index }) => {
    const [ref, isInView] = useInView({ threshold: 0.5 });

    const contentClasses = `
        timeline-item-content-container
        ${isInView ? 'visible' : ''}
        ${index % 2 === 0 ? 'right' : 'left'}
    `;

    return (
        <div ref={ref} className="timeline-item-section">
            <div className={contentClasses}>
                <div className="item-spinner" />
                <div className="item-line" />
                <div className="item-content">
                    <span className="item-date">{item.date}</span>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                </div>
            </div>
        </div>
    );
};

export default TimelineItem;
