import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { RiLeafLine, RiPlayLine, RiStopLine, RiTimeLine } from 'react-icons/ri';
import './Mindfulness.css';

const TECHNIQUES = [
    { id: 'box-breathing', name: 'Box Breathing', emoji: '📦', inhale: 4, hold1: 4, exhale: 4, hold2: 4, color: '#8b5cf6', desc: 'Used by Navy SEALs to reduce stress instantly' },
    { id: '4-7-8', name: '4-7-8 Breathing', emoji: '🌙', inhale: 4, hold1: 7, exhale: 8, hold2: 0, color: '#06b6d4', desc: 'Dr. Weil\'s natural tranquilizer for the nervous system' },
    { id: 'deep-breathing', name: 'Deep Belly', emoji: '🌊', inhale: 5, hold1: 0, exhale: 5, hold2: 0, color: '#10b981', desc: 'Simple diaphragmatic breathing for instant calm' },
    { id: 'coherent', name: 'Coherent', emoji: '💫', inhale: 6, hold1: 0, exhale: 6, hold2: 0, color: '#f59e0b', desc: 'Heart-brain coherence for deep relaxation' },
];

const PHASES = ['inhale', 'hold1', 'exhale', 'hold2'];
const PHASE_LABELS = { inhale: 'Inhale', hold1: 'Hold', exhale: 'Exhale', hold2: 'Hold' };

const Mindfulness = () => {
    const [selected, setSelected] = useState(TECHNIQUES[0]);
    const [isRunning, setIsRunning] = useState(false);
    const [phase, setPhase] = useState('inhale');
    const [countdown, setCountdown] = useState(4);
    const [cycles, setCycles] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [moodBefore, setMoodBefore] = useState(5);
    const [moodAfter, setMoodAfter] = useState(null);
    const [showPostSession, setShowPostSession] = useState(false);
    const [sessions, setSessions] = useState([]);

    const timerRef = useRef(null);
    const elapsedRef = useRef(null);

    useEffect(() => { fetchSessions(); }, []);

    useEffect(() => {
        return () => { clearInterval(timerRef.current); clearInterval(elapsedRef.current); };
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await api.get('/mindfulness/sessions?limit=5');
            setSessions(res.data.data || []);
        } catch { /**/ }
    };

    const startBreathing = () => {
        setIsRunning(true);
        setPhase('inhale');
        setCountdown(selected.inhale);
        setCycles(0);
        setElapsedSeconds(0);

        elapsedRef.current = setInterval(() => {
            setElapsedSeconds(s => s + 1);
        }, 1000);

        runPhase('inhale', selected, 0);
    };

    const runPhase = (currentPhase, tech, currentCycles) => {
        const duration = tech[currentPhase === 'hold1' ? 'hold1' : currentPhase === 'hold2' ? 'hold2' : currentPhase] || 0;

        if (duration === 0) {
            const phases = PHASES.filter(p => tech[p] > 0);
            const currentIdx = phases.indexOf(currentPhase);
            const nextPhase = phases[(currentIdx + 1) % phases.length];
            const newCycles = nextPhase === 'inhale' ? currentCycles + 1 : currentCycles;
            setPhase(nextPhase);
            setCountdown(tech[nextPhase]);
            if (nextPhase === 'inhale') setCycles(newCycles);
            timerRef.current = setTimeout(() => runPhase(nextPhase, tech, newCycles), tech[nextPhase] * 1000);
            return;
        }

        let remaining = duration;
        setCountdown(remaining);

        timerRef.current = setInterval(() => {
            remaining -= 1;
            setCountdown(remaining);

            if (remaining <= 0) {
                clearInterval(timerRef.current);
                const phases = PHASES.filter(p => tech[p] > 0);
                const currentIdx = phases.indexOf(currentPhase);
                const nextPhase = phases[(currentIdx + 1) % phases.length];
                const newCycles = nextPhase === 'inhale' ? currentCycles + 1 : currentCycles;
                setPhase(nextPhase);
                if (nextPhase === 'inhale') setCycles(newCycles);
                setCountdown(tech[nextPhase]);
                timerRef.current = setTimeout(() => runPhase(nextPhase, tech, newCycles), 0);
            }
        }, 1000);
    };

    const stopBreathing = () => {
        clearInterval(timerRef.current);
        clearInterval(elapsedRef.current);
        setIsRunning(false);
        if (elapsedSeconds > 10) setShowPostSession(true);
    };

    const saveSession = async () => {
        try {
            await api.post('/mindfulness/session', {
                technique: selected.id,
                duration: elapsedSeconds,
                cycles,
                moodBefore,
                moodAfter: moodAfter || moodBefore
            });
            toast.success('Session saved! 🌿');
            setShowPostSession(false);
            setMoodAfter(null);
            fetchSessions();
        } catch { toast.error('Failed to save session'); }
    };

    const circleScale = phase === 'inhale' ? 1.35 : phase === 'exhale' ? 0.75 : 1;
    const circleOpacity = phase === 'hold1' || phase === 'hold2' ? 0.8 : 1;

    return (
        <div className="mindfulness-page animate-fadeInUp">
            <div className="page-header">
                <h1 className="page-title">Mindfulness & Breathing</h1>
                <p className="page-subtitle">Scientifically-proven breathing techniques for stress relief</p>
            </div>

            <div className="mindfulness-layout">
                {/* Technique Selector */}
                <div className="technique-selector">
                    <h3 className="section-title">Choose Technique</h3>
                    <div className="technique-grid">
                        {TECHNIQUES.map(t => (
                            <button
                                key={t.id}
                                className={`technique-card glass-card ${selected.id === t.id ? 'active' : ''}`}
                                style={selected.id === t.id ? { borderColor: t.color, boxShadow: `0 0 20px ${t.color}30` } : {}}
                                onClick={() => { if (!isRunning) setSelected(t); }}
                                disabled={isRunning}
                            >
                                <div className="technique-emoji">{t.emoji}</div>
                                <div className="technique-name">{t.name}</div>
                                <div className="technique-desc">{t.desc}</div>
                                <div className="technique-pattern">
                                    {['Inhale', 'Hold', 'Exhale', 'Hold']
                                        .map((label, i) => {
                                            const val = [t.inhale, t.hold1, t.exhale, t.hold2][i];
                                            return val > 0 ? <span key={i}>{val}s {label}</span> : null;
                                        })
                                        .filter(Boolean)
                                        .reduce((acc, el, i) => [...acc, i > 0 ? ' · ' : '', el], [])}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Mood before */}
                    {!isRunning && !showPostSession && (
                        <div className="mood-before glass-card">
                            <label className="form-label">Mood before session: <strong>{moodBefore}/10</strong></label>
                            <input
                                type="range" min="1" max="10"
                                value={moodBefore}
                                onChange={e => setMoodBefore(parseInt(e.target.value))}
                                className="mood-slider"
                                style={{ '--track-color': '#8b5cf6' }}
                            />
                        </div>
                    )}

                    {/* Session history */}
                    {sessions.length > 0 && (
                        <div className="session-history">
                            <h4 className="section-title" style={{ fontSize: 13 }}>Recent Sessions</h4>
                            {sessions.map(s => (
                                <div key={s._id} className="session-history-item glass-card">
                                    <RiLeafLine color="#10b981" />
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{s.technique.replace(/-/g, ' ')}</div>
                                        <div style={{ fontSize: 11, color: '#6b7280' }}>{Math.floor(s.duration / 60)}m · {new Date(s.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    {s.moodBefore && s.moodAfter && (
                                        <div style={{ marginLeft: 'auto', fontSize: 12, color: s.moodAfter > s.moodBefore ? '#10b981' : '#ef4444' }}>
                                            {s.moodBefore}→{s.moodAfter}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Breathing Animation */}
                <div className="breathing-area">
                    <div className="breathing-widget glass-card">
                        {/* Animated Circle */}
                        <div className="breathing-circle-container">
                            <div
                                className="breathing-circle-outer"
                                style={{
                                    transform: `scale(${circleScale})`,
                                    opacity: circleOpacity,
                                    border: `3px solid ${selected.color}`,
                                    boxShadow: `0 0 60px ${selected.color}40, 0 0 30px ${selected.color}20`,
                                    transition: `transform ${isRunning ? (phase === 'inhale' ? selected.inhale : phase === 'exhale' ? selected.exhale : 0.1) : 0.4}s ease-in-out`
                                }}
                            >
                                <div className="breathing-circle-inner"
                                    style={{ background: `radial-gradient(circle, ${selected.color}20, transparent)` }}>
                                    <div className="breathing-phase-label">{isRunning ? PHASE_LABELS[phase] : selected.emoji}</div>
                                    <div className="breathing-countdown">
                                        {isRunning ? countdown : ''}
                                    </div>
                                </div>
                            </div>
                            {/* Pulse rings */}
                            {isRunning && (
                                <>
                                    <div className="pulse-ring" style={{ borderColor: selected.color, animationDelay: '0s' }} />
                                    <div className="pulse-ring" style={{ borderColor: selected.color, animationDelay: '1s' }} />
                                </>
                            )}
                        </div>

                        {/* Stats */}
                        {isRunning && (
                            <div className="breathing-stats">
                                <div className="breathing-stat">
                                    <div className="breathing-stat-val">{cycles}</div>
                                    <div className="breathing-stat-label">Cycles</div>
                                </div>
                                <div className="breathing-stat">
                                    <div className="breathing-stat-val">{Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')}</div>
                                    <div className="breathing-stat-label">Duration</div>
                                </div>
                            </div>
                        )}

                        {/* Controls */}
                        <div className="breathing-controls">
                            {!isRunning ? (
                                <button className="btn btn-primary btn-lg breathing-start-btn" onClick={startBreathing}
                                    style={{ background: `linear-gradient(135deg, ${selected.color}, ${selected.color}aa)` }}>
                                    <RiPlayLine size={20} /> Start Session
                                </button>
                            ) : (
                                <button className="btn btn-secondary btn-lg breathing-start-btn" onClick={stopBreathing}>
                                    <RiStopLine size={20} /> End Session
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Post session */}
                    {showPostSession && (
                        <div className="post-session glass-card animate-fadeInUp">
                            <h3>🎉 Great session! How do you feel now?</h3>
                            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
                                You completed {cycles} cycles in {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
                            </p>
                            <label className="form-label">Mood after: <strong>{moodAfter || moodBefore}/10</strong></label>
                            <input type="range" min="1" max="10"
                                value={moodAfter || moodBefore}
                                onChange={e => setMoodAfter(parseInt(e.target.value))}
                                className="mood-slider"
                                style={{ '--track-color': '#10b981', width: '100%' }}
                            />
                            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveSession}>Save Session</button>
                                <button className="btn btn-secondary" onClick={() => setShowPostSession(false)}>Skip</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Mindfulness;
