import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { RiAddLine, RiCheckLine } from 'react-icons/ri';
import './MoodTracker.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const EMOTIONS = [
    { value: 'happy', emoji: '😊', label: 'Happy', color: '#fcd34d' },
    { value: 'calm', emoji: '😌', label: 'Calm', color: '#6ee7b7' },
    { value: 'hopeful', emoji: '🌱', label: 'Hopeful', color: '#86efac' },
    { value: 'excited', emoji: '🤩', label: 'Excited', color: '#fde68a' },
    { value: 'neutral', emoji: '😐', label: 'Neutral', color: '#94a3b8' },
    { value: 'anxious', emoji: '😰', label: 'Anxious', color: '#f9a8d4' },
    { value: 'sad', emoji: '😢', label: 'Sad', color: '#93c5fd' },
    { value: 'stressed', emoji: '😫', label: 'Stressed', color: '#fca5a5' },
    { value: 'overwhelmed', emoji: '🥺', label: 'Overwhelmed', color: '#c4b5fd' },
    { value: 'angry', emoji: '😤', label: 'Angry', color: '#fca5a5' }
];

const TRIGGERS = ['work', 'family', 'health', 'finances', 'relationships', 'sleep', 'exercise', 'diet', 'social', 'personal'];

const MoodTracker = () => {
    const [form, setForm] = useState({
        score: 5, emotion: 'neutral', notes: '', triggers: [], energyLevel: 3, sleepHours: ''
    });
    const [moodLogs, setMoodLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [activeTab, setActiveTab] = useState('log');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [logsRes, statsRes] = await Promise.all([
                api.get('/mood?limit=10'),
                api.get('/mood/stats')
            ]);
            setMoodLogs(logsRes.data.data || []);
            setStats(statsRes.data.data);
        } catch { /**/ }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.emotion) return toast.error('Please select an emotion');
        setSubmitting(true);
        setAiResult(null);
        try {
            const payload = { ...form, sleepHours: form.sleepHours ? parseFloat(form.sleepHours) : null };
            const res = await api.post('/mood', payload);
            setAiResult(res.data.data);
            toast.success('Mood logged! 🎉');
            setForm({ score: 5, emotion: 'neutral', notes: '', triggers: [], energyLevel: 3, sleepHours: '' });
            fetchData();
        } catch {
            toast.error('Failed to log mood');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleTrigger = (trigger) => {
        setForm(prev => ({
            ...prev,
            triggers: prev.triggers.includes(trigger)
                ? prev.triggers.filter(t => t !== trigger)
                : [...prev.triggers, trigger]
        }));
    };

    const selectedEmotion = EMOTIONS.find(e => e.value === form.emotion);

    const chartData = {
        labels: (stats?.trend || []).slice(-14).map(d => {
            const date = new Date(d.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        datasets: [{
            label: 'Mood',
            data: (stats?.trend || []).slice(-14).map(d => d.average),
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139,92,246,0.1)',
            fill: true, tension: 0.4,
            pointBackgroundColor: '#8b5cf6',
            pointRadius: 5, borderWidth: 2
        }]
    };

    return (
        <div className="mood-page animate-fadeInUp">
            <div className="page-header">
                <h1 className="page-title">Mood Tracker</h1>
                <p className="page-subtitle">Track your emotional wellbeing and receive AI-powered insights</p>
            </div>

            <div className="mood-tabs">
                {['log', 'history', 'insights'].map(tab => (
                    <button key={tab} className={`mood-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {activeTab === 'log' && (
                <div className="mood-log-layout">
                    <form onSubmit={handleSubmit} className="mood-form glass-card">
                        <h3 className="mood-form-title">How are you feeling right now?</h3>

                        {/* Emotion Picker */}
                        <div className="emotion-grid">
                            {EMOTIONS.map(e => (
                                <button
                                    key={e.value} type="button"
                                    className={`emotion-btn ${form.emotion === e.value ? 'selected' : ''}`}
                                    style={form.emotion === e.value ? { borderColor: e.color, background: `${e.color}15` } : {}}
                                    onClick={() => setForm(prev => ({ ...prev, emotion: e.value }))}
                                >
                                    <span className="emotion-btn-emoji">{e.emoji}</span>
                                    <span className="emotion-btn-label" style={form.emotion === e.value ? { color: e.color } : {}}>{e.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Score Slider */}
                        <div className="form-group">
                            <label className="form-label">
                                Mood Score: <strong style={{ color: selectedEmotion?.color || '#8b5cf6' }}>{form.score}/10</strong>
                            </label>
                            <div className="slider-wrapper">
                                <span>1</span>
                                <input
                                    type="range" min="1" max="10" step="1"
                                    value={form.score}
                                    onChange={e => setForm(prev => ({ ...prev, score: parseInt(e.target.value) }))}
                                    className="mood-slider"
                                    style={{ '--track-color': selectedEmotion?.color || '#8b5cf6' }}
                                />
                                <span>10</span>
                            </div>
                        </div>

                        {/* Energy Level */}
                        <div className="form-group">
                            <label className="form-label">Energy Level: {['😴', '😑', '😐', '😊', '⚡'][form.energyLevel - 1]} {form.energyLevel}/5</label>
                            <div className="energy-btns">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button key={n} type="button"
                                        className={`energy-btn ${form.energyLevel === n ? 'active' : ''}`}
                                        onClick={() => setForm(prev => ({ ...prev, energyLevel: n }))}>
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sleep */}
                        <div className="form-group">
                            <label className="form-label">Sleep (hours last night)</label>
                            <input
                                type="number" min="0" max="24" step="0.5"
                                className="form-input"
                                placeholder="e.g. 7.5"
                                value={form.sleepHours}
                                onChange={e => setForm(prev => ({ ...prev, sleepHours: e.target.value }))}
                            />
                        </div>

                        {/* Triggers */}
                        <div className="form-group">
                            <label className="form-label">What triggered this mood?</label>
                            <div className="trigger-grid">
                                {TRIGGERS.map(t => (
                                    <button key={t} type="button"
                                        className={`trigger-chip ${form.triggers.includes(t) ? 'selected' : ''}`}
                                        onClick={() => toggleTrigger(t)}>
                                        {form.triggers.includes(t) && <RiCheckLine size={12} />}
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="form-group">
                            <label className="form-label">Notes (optional)</label>
                            <textarea
                                className="form-input"
                                placeholder="Any additional thoughts or context..."
                                value={form.notes}
                                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                                rows={3}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                            {submitting ? <><div className="spinner" /> Analyzing...</> : <><RiAddLine size={16} /> Log My Mood</>}
                        </button>
                    </form>

                    {/* AI Result */}
                    {aiResult && (
                        <div className="ai-result glass-card animate-fadeInUp">
                            <div className="ai-result-header">
                                <span className="ai-result-title">🤖 AI Analysis</span>
                                <span className="badge badge-violet">{aiResult.emotion}</span>
                            </div>
                            {aiResult.aiAnalysis && <p className="ai-result-insights">{aiResult.aiAnalysis}</p>}
                            {aiResult.aiSuggestions?.length > 0 && (
                                <div className="ai-suggestions-list">
                                    <div className="suggestions-title">💡 Personalized Suggestions</div>
                                    {aiResult.aiSuggestions.map((s, i) => (
                                        <div key={i} className="ai-suggestion-item">
                                            <div className="suggestion-num">{i + 1}</div>
                                            <span>{s}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="mood-history">
                    {moodLogs.length === 0 ? (
                        <div className="empty-state glass-card"><div className="empty-state-icon">📊</div><div className="empty-state-title">No mood logs yet</div></div>
                    ) : (
                        moodLogs.map(log => {
                            const em = EMOTIONS.find(e => e.value === log.emotion);
                            return (
                                <div key={log._id} className="mood-history-item glass-card">
                                    <div className="mood-history-emoji">{em?.emoji || '😐'}</div>
                                    <div className="mood-history-info">
                                        <div className="mood-history-top">
                                            <span className="mood-history-emotion" style={{ color: em?.color }}>{log.emotion}</span>
                                            <span className="mood-history-score">{log.score}/10</span>
                                            <span className="mood-history-date">{new Date(log.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {log.notes && <p className="mood-history-notes">{log.notes}</p>}
                                        {log.triggers?.length > 0 && (
                                            <div className="mood-history-triggers">
                                                {log.triggers.map(t => <span key={t} className="trigger-tag">{t}</span>)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {activeTab === 'insights' && (
                <div className="mood-insights">
                    <div className="insights-stats glass-card" style={{ padding: 24, marginBottom: 20 }}>
                        <h3 style={{ marginBottom: 16, fontSize: 16, color: '#94a3b8' }}>14-Day Mood Trend</h3>
                        {stats?.trend?.length > 0 ? (
                            <Line data={chartData} options={{
                                responsive: true,
                                plugins: { legend: { display: false } },
                                scales: {
                                    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280' } },
                                    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280' }, min: 0, max: 10 }
                                }
                            }} />
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">📈</div>
                                <div className="empty-state-text">Log moods to see trend</div>
                            </div>
                        )}
                    </div>

                    {stats && (
                        <div className="grid-3">
                            <div className="glass-card" style={{ padding: 20 }}>
                                <div style={{ fontSize: 32, fontWeight: 800, color: '#8b5cf6' }}>{stats.averageMood}</div>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>Average Mood</div>
                            </div>
                            <div className="glass-card" style={{ padding: 20 }}>
                                <div style={{ fontSize: 32, fontWeight: 800, color: '#10b981' }}>{stats.totalLogs}</div>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>Total Logs</div>
                            </div>
                            <div className="glass-card" style={{ padding: 20 }}>
                                <div style={{ fontSize: 32, fontWeight: 800, color: '#06b6d4' }}>
                                    {Object.entries(stats.emotionFrequency || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'}
                                </div>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>Top Emotion</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MoodTracker;
