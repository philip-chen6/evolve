import React from 'react';
import Waves from './Waves';
import './Timeline.css';

const SimpleSpinner = () => (
    <div className="spinner-container">
        <div className="spinner-grow" />
    </div>
);

const Timeline = () => {
    return (
        <>
            <div className="timeline-solid-background" />
            <div className="timeline-animated-content">
                <Waves
                    lineColor="rgba(0, 0, 0, 0.2)"
                    backgroundColor="transparent"
                />
                <SimpleSpinner />
            </div>
        </>
    );
};

export default Timeline;
