import React, { useState, useEffect } from 'react';
import Waves from './Waves';
import './Timeline.css';

const timelineData = [
    { title: 'Attention Is All You Need', summary: 'This paper introduces the Transformer, a novel network architecture based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.' },
    { title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', summary: 'BERT, which stands for Bidirectional Encoder Representations from Transformers, is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.' },
    { title: 'Generative Pre-trained Transformer (GPT)', summary: 'The paper shows that large gains on these tasks can be realized by generative pre-training of a language model on a diverse corpus of unlabeled text, followed by discriminative fine-tuning on each specific task.' },
    { title: 'T5: Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer', summary: 'This paper describes a new model, the Text-to-Text Transfer Transformer (T5), which reframes all NLP tasks into a unified text-to-text format where the input and output are always text strings.' },
    { title: 'The Illustrated Transformer', summary: 'A visual and intuitive explanation of the Transformer model, which has become a cornerstone of modern NLP.' },
];

const Timeline = () => {
    const [animationStep, setAnimationStep] = useState('loading');

    useEffect(() => {
        const timers = [
            setTimeout(() => setAnimationStep('loaded'), 2000), // Finish loading, become solid
            setTimeout(() => setAnimationStep('moving'), 2200), // Start moving up
            setTimeout(() => setAnimationStep('finished'), 3200)  // Finish moving, protrude line
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    const spinnerClasses = `
        timeline-spinner
        ${animationStep}
    `;

    return (
        <div className="timeline-container-background">
            <div className="timeline-animated-content">
                <Waves
                    lineColor="rgba(0, 0, 0, 0.2)"
                    backgroundColor="transparent"
                />
                
                <div className={spinnerClasses} />

                {animationStep === 'finished' && (
                    <div className="timeline-scroll-container">
                        <div className="timeline-content-wrapper">
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
        </div>
    );
};

export default Timeline;
