import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { RiAddLine, RiBookOpenLine, RiDeleteBin6Line, RiEditLine, RiSearchLine } from 'react-icons/ri';
import './Journal.css';

const EMOTIONS = ['happy', 'calm', 'hopeful', 'excited', 'neutral', 'anxious', 'sad', 'stressed', 'overwhelmed', 'angry'];
const EMOTION_EMOJIS = { happy: '😊', sad: '😢', anxious: '😰', calm: '😌', angry: '😤', excited: '🤩', stressed: '😫', neutral: '😐', overwhelmed: '🥺', hopeful: '🌱' };

const Journal = () => {
    const [entries, setEntries] = useState([]);
    const [view, setView] = useState('list'); // list | editor | read
    const [currentEntry, setCurrentEntry] = useState(null);
    const [form, setForm] = useState({ title: '', content: '', tags: '', mood: 'neutral' });
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [aiAnalysis, setAiAnalysis] = useState(null);

    useEffect(() => { fetchEntries(); }, []);

    const fetchEntries = async (s = '') => {
        try {
            const res = await api.get(`/journal?limit=20${s ? `&search=${s}` : ''}`);
            setEntries(res.data.data || []);
        } catch { /**/ }
    };

    const openNew = () => {
        setCurrentEntry(null);
        setForm({ title: '', content: '', tags: '', mood: 'neutral' });
        setAiAnalysis(null);
        setView('editor');
    };

    const openEdit = (entry) => {
        setCurrentEntry(entry);
        setForm({ title: entry.title, content: entry.content, tags: entry.tags?.join(', ') || '', mood: entry.mood });
        setAiAnalysis(entry.aiEmotionAnalysis);
        setView('editor');
    };

    const openRead = (entry) => {
        setCurrentEntry(entry);
        setAiAnalysis(entry.aiEmotionAnalysis);
        setView('read');
    };

    const handleSave = async () => {
        if (!form.title.trim() || !form.content.trim()) return toast.error('Title and content required');
        setSaving(true);
        try {
            const payload = {
                ...form,
                tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
            };
            let res;
            if (currentEntry) {
                res = await api.put(`/journal/${currentEntry._id}`, payload);
                toast.success('Entry updated');
            } else {
                res = await api.post('/journal', payload);
                toast.success('Journal saved! AI analyzed your entry ✨');
            }
            setAiAnalysis(res.data.data.aiEmotionAnalysis);
            setCurrentEntry(res.data.data);
            fetchEntries();
        } catch {
            toast.error('Failed to save entry');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this entry?')) return;
        try {
            await api.delete(`/journal/${id}`);
            toast.success('Entry deleted');
            fetchEntries();
            if (currentEntry?._id === id) setView('list');
        } catch { toast.error('Failed to delete'); }
    };

    return (
        <div className="journal-page animate-fadeInUp">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Journal</h1>
                    <p className="page-subtitle">Reflect, process emotions, and gain AI-powered insights</p>
                </div>
                <button className="btn btn-primary" onClick={openNew}>
                    <RiAddLine size={16} /> New Entry
                </button>
            </div>

            {view === 'list' && (
                <>
                    {/* Search */}
                    <div className="journal-search">
                        <RiSearchLine size={16} color="#6b7280" />
                        <input
                            type="text"
                            className="journal-search-input"
                            placeholder="Search entries..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); fetchEntries(e.target.value); }}
                        />
                    </div>

                    {entries.length === 0 ? (
                        <div className="empty-state glass-card" style={{ marginTop: 20 }}>
                            <div className="empty-state-icon"><RiBookOpenLine /></div>
                            <div className="empty-state-title">No journal entries yet</div>
                            <div className="empty-state-text">Start writing to unlock AI emotion analysis</div>
                            <button className="btn btn-primary" onClick={openNew}><RiAddLine /> Write First Entry</button>
                        </div>
                    ) : (
                        <div className="journal-grid">
                            {entries.map(entry => (
                                <div key={entry._id} className="journal-card glass-card" onClick={() => openRead(entry)}>
                                    <div className="journal-card-header">
                                        <span className="journal-emoji">{EMOTION_EMOJIS[entry.mood] || '📝'}</span>
                                        <div className="journal-card-actions" onClick={e => e.stopPropagation()}>
                                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(entry)}>
                                                <RiEditLine size={14} />
                                            </button>
                                            <button className="btn btn-ghost btn-icon btn-sm" style={{ color: '#ef4444' }} onClick={() => handleDelete(entry._id)}>
                                                <RiDeleteBin6Line size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="journal-card-title">{entry.title}</h3>
                                    <p className="journal-card-preview">{entry.content.slice(0, 120)}{entry.content.length > 120 ? '...' : ''}</p>
                                    <div className="journal-card-footer">
                                        <span className={`badge badge-violet`}>{entry.mood}</span>
                                        <span className="journal-date">{new Date(entry.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {entry.tags?.length > 0 && (
                                        <div className="journal-tags">
                                            {entry.tags.map(t => <span key={t} className="journal-tag">{t}</span>)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {view === 'editor' && (
                <div className="journal-editor glass-card">
                    <div className="editor-header">
                        <h3>{currentEntry ? 'Edit Entry' : 'New Journal Entry'}</h3>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary" onClick={() => setView('list')}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? <><div className="spinner" /> Analyzing...</> : 'Save & Analyze'}
                            </button>
                        </div>
                    </div>

                    <input
                        type="text"
                        className="editor-title-input"
                        placeholder="Entry title..."
                        value={form.title}
                        onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    />

                    <div className="editor-meta">
                        <select className="form-input editor-select" value={form.mood} onChange={e => setForm(prev => ({ ...prev, mood: e.target.value }))}>
                            {EMOTIONS.map(e => <option key={e} value={e}>{EMOTION_EMOJIS[e]} {e}</option>)}
                        </select>
                        <input type="text" className="form-input" placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))} />
                    </div>

                    <textarea
                        className="editor-content"
                        placeholder="Write freely about your thoughts, feelings, and experiences..."
                        value={form.content}
                        onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                    />

                    {aiAnalysis && (
                        <div className="editor-ai-panel">
                            <div className="ai-panel-title">🤖 AI Emotion Analysis</div>
                            <div className="ai-panel-body">
                                {aiAnalysis.insights && <p className="ai-panel-insights">{aiAnalysis.insights}</p>}
                                {aiAnalysis.themes?.length > 0 && (
                                    <div className="ai-panel-themes">
                                        <strong>Key Themes:</strong>
                                        {aiAnalysis.themes.map(t => <span key={t} className="theme-chip">{t}</span>)}
                                    </div>
                                )}
                                {aiAnalysis.suggestions?.length > 0 && (
                                    <div className="ai-panel-suggestions">
                                        <strong>Suggestions:</strong>
                                        <ul>{aiAnalysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {view === 'read' && currentEntry && (
                <div className="journal-read glass-card">
                    <div className="read-header">
                        <button className="btn btn-ghost" onClick={() => setView('list')}>← Back</button>
                        <button className="btn btn-secondary" onClick={() => openEdit(currentEntry)}>
                            <RiEditLine size={14} /> Edit
                        </button>
                    </div>
                    <div className="read-title">
                        <span>{EMOTION_EMOJIS[currentEntry.mood]}</span>
                        <h2>{currentEntry.title}</h2>
                    </div>
                    <div className="read-meta">
                        <span className="badge badge-violet">{currentEntry.mood}</span>
                        <span className="journal-date">{new Date(currentEntry.createdAt).toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        <span className="journal-date">{currentEntry.wordCount} words</span>
                    </div>
                    <div className="divider" />
                    <p className="read-content">{currentEntry.content}</p>

                    {aiAnalysis && (
                        <div className="editor-ai-panel" style={{ marginTop: 28 }}>
                            <div className="ai-panel-title">🤖 AI Emotion Analysis</div>
                            <div className="ai-panel-body">
                                <div className="ai-panel-grid">
                                    <div>
                                        <div className="ai-panel-label">Dominant Emotion</div>
                                        <div className="ai-panel-value">{aiAnalysis.dominantEmotion || '—'}</div>
                                    </div>
                                    <div>
                                        <div className="ai-panel-label">Sentiment</div>
                                        <div className="ai-panel-value">{aiAnalysis.sentimentScore > 0 ? '😊 Positive' : aiAnalysis.sentimentScore < 0 ? '😔 Negative' : '😐 Neutral'}</div>
                                    </div>
                                </div>
                                {aiAnalysis.insights && <p className="ai-panel-insights">{aiAnalysis.insights}</p>}
                                {aiAnalysis.suggestions?.length > 0 && (
                                    <ul className="ai-panel-suggestions">
                                        {aiAnalysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Journal;
