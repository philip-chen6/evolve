import React, { useState, useEffect } from 'react';
import Waves from './Waves';
import './Timeline.css';

const timelineData = [
    {
        title: 'Attention Is All You Need',
        summary: 'This paper introduces the Transformer, a novel network architecture based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
    },
    {
        title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
        summary: 'BERT, which stands for Bidirectional Encoder Representations from Transformers, is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.',
    },
    {
        title: 'Generative Pre-trained Transformer (GPT)',
        summary: 'The paper shows that large gains on these tasks can be realized by generative pre-training of a language model on a diverse corpus of unlabeled text, followed by discriminative fine-tuning on each specific task.',
    },
    {
        title: 'T5: Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer',
        summary: 'This paper describes a new model, the Text-to-Text Transfer Transformer (T5), which reframes all NLP tasks into a unified text-to-text format where the input and output are always text strings.',
    },
    {
        title: 'The Illustrated Transformer',
        summary: 'A visual and intuitive explanation of the Transformer model, which has become a cornerstone of modern NLP.',
    },
];

// A simple, self-contained spinner component
const SimpleSpinner = () => (
    <div className="spinner-container">
        <div className="spinner-grow" />
    </div>
);

const Timeline = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isAnimationComplete, setIsAnimationComplete] = useState(false);

    useEffect(() => {
        const loadingTimer = setTimeout(() => {
            setIsLoading(false);
            setIsAnimating(true);
            const animationTimer = setTimeout(() => {
                setIsAnimating(false);
                setIsAnimationComplete(true);
            }, 2000); // Duration of the intro line animation
            return () => clearTimeout(animationTimer);
        }, 2000); // Duration of the loading spinner

        return () => clearTimeout(loadingTimer);
    }, []);

    return (
        <div className="timeline-container-background">
            <Waves
                lineColor="rgba(0, 0, 0, 0.2)"
                backgroundColor="transparent"
                waveSpeedX={0.02}
                waveSpeedY={0.01}
                waveAmpX={40}
                waveAmpY={20}
                friction={0.9}
                tension={0.01}
                maxCursorMove={120}
                xGap={12}
                yGap={36}
            />
            {isLoading && <SimpleSpinner />}

            {isAnimating && (
                <div className="timeline-intro-animation">
                    <div className="intro-dot" />
                    <div className="intro-line" />
                </div>
            )}

            {isAnimationComplete && (
                <div className="timeline-scroll-container">
                    <div className="timeline-content-wrapper">
                        <div className="static-line" />
                        {timelineData.map((item, index) => (
                            <div key={index} className="timeline-item-wrapper">
                                <div className="timeline-item-dot" />
                                <div className="timeline-item-content">
                                    <h3>{item.title}</h3>
                                    <p>{item.summary}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Timeline;
