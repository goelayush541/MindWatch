import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    RiFlashlightLine,
    RiMentalHealthLine,
    RiPlantLine,
    RiBrainLine,
    RiRefreshLine,
    RiArrowRightSLine
} from 'react-icons/ri';
import './StressTips.css';

const StressTips = ({ context }) => {
    const [suggestions, setSuggestions] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            // If context is provided, we use it, otherwise we get the latest mood
            let ctx = context;
            if (!ctx) {
                const res = await api.get('/mood/stats');
                const latestMood = res.data.data.latestMood;
                if (latestMood) {
                    ctx = {
                        emotion: latestMood.emotion,
                        stressLevel: latestMood.score,
                        triggers: latestMood.triggers,
                        notes: latestMood.notes
                    };
                }
            }

            // In a real app, you might have a dedicated endpoint or reuse analysis
            // For now, if we don't have fresh suggestions in context, we could fetch them
            // But usually, they are generated on mood log.
            // Let's assume we can trigger a refresh if needed or use passed ones.
            if (ctx) {
                // If the backend already returned structured suggestions, we use them
                // Otherwise we might need a dedicated "get more suggestions" endpoint
                // Let's check if the passed context already has them
                if (ctx.aiSuggestions && ctx.aiSuggestions.immediate) {
                    setSuggestions(ctx.aiSuggestions);
                } else {
                    // Fallback to defaults or a fresh fetch if we had an endpoint
                    setSuggestions(getDefaultSuggestions(ctx.emotion));
                }
            }
        } catch (error) {
            console.error('Error fetching stress tips:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDefaultSuggestions = (emotion) => ({
        immediate: ["Take 5 deep breaths", "Drink a glass of water"],
        mindfulness: ["5-minute meditation", "Body scan grounding"],
        lifestyle: ["Go for a walk", "Listen to calm music"],
        mental: ["Journal your thoughts", "Focus on the present"],
        overallAdvice: "Take it one step at a time."
    });

    useEffect(() => {
        if (context?.aiSuggestions) {
            setSuggestions(context.aiSuggestions);
        } else {
            fetchSuggestions();
        }
    }, [context]);

    if (!suggestions && !loading) return null;

    const categories = [
        { id: 'immediate', label: 'Quick Relief', icon: <RiFlashlightLine />, color: '#fbbf24' },
        { id: 'mindfulness', label: 'Mindfulness', icon: <RiPlantLine />, color: '#10b981' },
        { id: 'lifestyle', label: 'Life Balance', icon: <RiMentalHealthLine />, color: '#06b6d4' },
        { id: 'mental', label: 'Mental Shifts', icon: <RiBrainLine />, color: '#8b5cf6' }
    ];

    return (
        <div className="stress-tips-container glass-card">
            <div className="tips-header">
                <div>
                    <h3 className="tips-title">Personalized Stress Reduction</h3>
                    <p className="tips-subtitle">{suggestions?.overallAdvice || 'Strategies tailored for your current state'}</p>
                </div>
                <button className="refresh-tips-btn" onClick={fetchSuggestions} disabled={loading}>
                    <RiRefreshLine className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="tips-grid">
                {categories.map(cat => (
                    <div key={cat.id} className="tip-category">
                        <div className="category-header" style={{ color: cat.color }}>
                            {cat.icon}
                            <span>{cat.label}</span>
                        </div>
                        <ul className="tip-list">
                            {suggestions?.[cat.id]?.map((tip, i) => (
                                <li key={i} className="tip-item">
                                    <RiArrowRightSLine />
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StressTips;
