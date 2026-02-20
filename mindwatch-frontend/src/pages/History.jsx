import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { RiHistoryLine, RiChatAiLine, RiEmotionHappyLine, RiBookOpenLine, RiLeafLine } from 'react-icons/ri';
import './History.css';

const History = () => {
    const [activeTab, setActiveTab] = useState('chat');
    const [chatSessions, setChatSessions] = useState([]);
    const [moodLogs, setMoodLogs] = useState([]);
    const [journalEntries, setJournalEntries] = useState([]);
    const [breathingSessions, setBreathingSessions] = useState([]);
    const [weeklySummary, setWeeklySummary] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [chats, moods, journals, breathing, weekly] = await Promise.all([
                api.get('/chat/sessions?limit=20').catch(() => ({ data: { data: [] } })),
                api.get('/mood?limit=30').catch(() => ({ data: { data: [] } })),
                api.get('/journal?limit=20').catch(() => ({ data: { data: [] } })),
                api.get('/mindfulness/sessions?limit=20').catch(() => ({ data: { data: [] } })),
                api.get('/analysis/weekly-summary').catch(() => ({ data: { data: { summary: '' } } }))
            ]);
            setChatSessions(chats.data.data || []);
            setMoodLogs(moods.data.data || []);
            setJournalEntries(journals.data.data || []);
            setBreathingSessions(breathing.data.data || []);
            setWeeklySummary(weekly.data.data?.summary || '');
        } finally {
            setLoading(false);
        }
    };

    const TABS = [
        { id: 'chat', icon: RiChatAiLine, label: 'Chat', count: chatSessions.length },
        { id: 'mood', icon: RiEmotionHappyLine, label: 'Mood Logs', count: moodLogs.length },
        { id: 'journal', icon: RiBookOpenLine, label: 'Journal', count: journalEntries.length },
        { id: 'breathing', icon: RiLeafLine, label: 'Breathing', count: breathingSessions.length }
    ];

    return (
        <div className="history-page animate-fadeInUp">
            <div className="page-header">
                <h1 className="page-title">Session History</h1>
                <p className="page-subtitle">Your complete mental wellness journey</p>
            </div>

            {/* Weekly AI Summary */}
            {weeklySummary && (
                <div className="weekly-summary glass-card">
                    <div className="weekly-summary-header">
                        <span>🤖 Weekly AI Summary</span>
                        <span className="badge badge-violet">This week</span>
                    </div>
                    <p className="weekly-summary-text">{weeklySummary}</p>
                </div>
            )}

            {/* Tabs */}
            <div className="history-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`history-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon size={15} />
                        {tab.label}
                        <span className="history-tab-count">{tab.count}</span>
                    </button>
                ))}
            </div>

            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <div className="spinner" style={{ width: 36, height: 36 }} />
                </div>
            )}

            {/* Chat Sessions */}
            {activeTab === 'chat' && !loading && (
                <div className="history-list">
                    {chatSessions.length === 0 && (
                        <div className="empty-state glass-card">
                            <div className="empty-state-icon">💬</div>
                            <div className="empty-state-title">No chat sessions yet</div>
                        </div>
                    )}
                    {chatSessions.map(s => (
                        <div key={s._id} className="history-item glass-card">
                            <div className="history-item-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                                <RiChatAiLine size={18} />
                            </div>
                            <div className="history-item-body">
                                <div className="history-item-title">{s.sessionTitle}</div>
                                <div className="history-item-meta">
                                    <span>Dominant emotion: <strong style={{ textTransform: 'capitalize' }}>{s.emotionSummary?.dominant || 'neutral'}</strong></span>
                                    <span>{s.messages?.length || 0} messages</span>
                                    {s.crisisDetected && <span className="crisis-flag">⚠️ Crisis detected</span>}
                                </div>
                            </div>
                            <div className="history-item-date">{new Date(s.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Mood Logs */}
            {activeTab === 'mood' && !loading && (
                <div className="history-list">
                    {moodLogs.length === 0 && (
                        <div className="empty-state glass-card">
                            <div className="empty-state-icon">😊</div>
                            <div className="empty-state-title">No mood logs yet</div>
                        </div>
                    )}
                    {moodLogs.map(log => (
                        <div key={log._id} className="history-item glass-card">
                            <div className="history-item-icon" style={{ background: 'rgba(6,182,212,0.15)', color: '#67e8f9', fontSize: 22 }}>
                                {{ happy: '😊', sad: '😢', anxious: '😰', calm: '😌', angry: '😤', excited: '🤩', stressed: '😫', neutral: '😐', overwhelmed: '🥺', hopeful: '🌱' }[log.emotion] || '😐'}
                            </div>
                            <div className="history-item-body">
                                <div className="history-item-title" style={{ textTransform: 'capitalize' }}>{log.emotion} — {log.score}/10</div>
                                <div className="history-item-meta">
                                    {log.triggers?.length > 0 && <span>Triggers: {log.triggers.join(', ')}</span>}
                                    {log.notes && <span className="history-excerpt">{log.notes.slice(0, 60)}...</span>}
                                </div>
                            </div>
                            <div className="history-item-date">{new Date(log.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Journal */}
            {activeTab === 'journal' && !loading && (
                <div className="history-list">
                    {journalEntries.length === 0 && (
                        <div className="empty-state glass-card">
                            <div className="empty-state-icon">📖</div>
                            <div className="empty-state-title">No journal entries yet</div>
                        </div>
                    )}
                    {journalEntries.map(entry => (
                        <div key={entry._id} className="history-item glass-card">
                            <div className="history-item-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' }}>
                                <RiBookOpenLine size={18} />
                            </div>
                            <div className="history-item-body">
                                <div className="history-item-title">{entry.title}</div>
                                <div className="history-item-meta">
                                    <span>{entry.wordCount} words</span>
                                    <span style={{ textTransform: 'capitalize' }}>{entry.mood}</span>
                                    {entry.aiEmotionAnalysis?.dominantEmotion && (
                                        <span>AI: {entry.aiEmotionAnalysis.dominantEmotion}</span>
                                    )}
                                </div>
                            </div>
                            <div className="history-item-date">{new Date(entry.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Breathing Sessions */}
            {activeTab === 'breathing' && !loading && (
                <div className="history-list">
                    {breathingSessions.length === 0 && (
                        <div className="empty-state glass-card">
                            <div className="empty-state-icon">🌿</div>
                            <div className="empty-state-title">No breathing sessions yet</div>
                        </div>
                    )}
                    {breathingSessions.map(s => (
                        <div key={s._id} className="history-item glass-card">
                            <div className="history-item-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#fcd34d' }}>
                                <RiLeafLine size={18} />
                            </div>
                            <div className="history-item-body">
                                <div className="history-item-title" style={{ textTransform: 'capitalize' }}>{s.technique.replace(/-/g, ' ')}</div>
                                <div className="history-item-meta">
                                    <span>{Math.floor(s.duration / 60)}m {s.duration % 60}s</span>
                                    <span>{s.cycles} cycles</span>
                                    {s.moodBefore && s.moodAfter && (
                                        <span style={{ color: s.moodAfter > s.moodBefore ? '#10b981' : '#ef4444' }}>
                                            Mood: {s.moodBefore} → {s.moodAfter}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="history-item-date">{new Date(s.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default History;
