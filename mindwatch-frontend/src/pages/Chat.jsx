import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    RiSendPlaneLine, RiAddLine, RiRobot2Line, RiUserLine,
    RiEmotionHappyLine, RiAlertLine, RiChatAiLine
} from 'react-icons/ri';
import './Chat.css';

const EMOTION_COLORS = {
    happy: '#fcd34d', sad: '#93c5fd', anxious: '#f9a8d4', calm: '#6ee7b7',
    angry: '#fca5a5', excited: '#fde68a', stressed: '#fca5a5', neutral: '#94a3b8',
    overwhelmed: '#c4b5fd', hopeful: '#86efac'
};

const Chat = () => {
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [emotionState, setEmotionState] = useState({ emotion: 'neutral', stressLevel: 0 });
    const [crisisData, setCrisisData] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchSessions = async () => {
        try {
            const res = await api.get('/chat/sessions');
            setSessions(res.data.data || []);
        } catch { /**/ }
    };

    const startNewSession = async () => {
        try {
            const res = await api.post('/chat/new-session');
            const newSession = res.data.data;
            setSessions(prev => [newSession, ...prev]);
            setActiveSession(newSession);
            setMessages([{
                role: 'assistant',
                content: "Hello! I'm your MindWatch AI therapist. I'm here to listen, support, and help you navigate any challenges you're facing. How are you feeling today?",
                emotion: 'supportive',
                timestamp: new Date()
            }]);
            setCrisisData(null);
            setEmotionState({ emotion: 'neutral', stressLevel: 0 });
        } catch {
            toast.error('Failed to start session');
        }
    };

    const loadSession = async (session) => {
        setActiveSession(session);
        try {
            const res = await api.get(`/chat/sessions/${session._id}`);
            setMessages(res.data.data.messages || []);
        } catch { setMessages([]); }
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        if (!activeSession) {
            await startNewSession();
            return;
        }

        const userMsg = { role: 'user', content: input.trim(), timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        const msgText = input.trim();
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/chat/message', {
                message: msgText,
                sessionId: activeSession._id
            });

            const { aiResponse, emotionAnalysis, crisisDetected, crisisResources, stressLevel } = res.data.data;

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: aiResponse,
                emotion: emotionAnalysis?.dominantEmotion || 'neutral',
                timestamp: new Date()
            }]);

            setEmotionState({
                emotion: emotionAnalysis?.dominantEmotion || 'neutral',
                stressLevel: stressLevel || 0,
                insights: emotionAnalysis?.insights,
                suggestions: emotionAnalysis?.suggestions
            });

            if (crisisDetected && crisisResources) {
                setCrisisData(crisisResources);
            }
        } catch (err) {
            toast.error('Failed to send message');
            setMessages(prev => prev.filter(m => m !== userMsg));
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="chat-page">
            {/* Sidebar */}
            <div className="chat-sidebar glass-card">
                <div className="chat-sidebar-header">
                    <h2 className="chat-sidebar-title">Sessions</h2>
                    <button className="btn btn-primary btn-sm" onClick={startNewSession}>
                        <RiAddLine size={15} /> New
                    </button>
                </div>

                <div className="chat-session-list">
                    {sessions.length === 0 && (
                        <div className="empty-state" style={{ padding: '30px 10px' }}>
                            <div className="empty-state-icon">💬</div>
                            <div className="empty-state-text">No sessions yet</div>
                        </div>
                    )}
                    {sessions.map(s => (
                        <button
                            key={s._id}
                            className={`chat-session-item ${activeSession?._id === s._id ? 'active' : ''}`}
                            onClick={() => loadSession(s)}
                        >
                            <div className="chat-session-title">{s.sessionTitle}</div>
                            <div className="chat-session-meta">
                                <span className="chat-session-emotion">
                                    {s.emotionSummary?.dominant || 'neutral'}
                                </span>
                                <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                            </div>
                            {s.crisisDetected && <div className="crisis-badge"><RiAlertLine size={11} /> Crisis</div>}
                        </button>
                    ))}
                </div>

                {/* Emotion state panel */}
                {activeSession && (
                    <div className="emotion-panel">
                        <div className="emotion-panel-title">Current State</div>
                        <div className="emotion-indicator" style={{ color: EMOTION_COLORS[emotionState.emotion] || '#94a3b8' }}>
                            <div className="emotion-dot" style={{ background: EMOTION_COLORS[emotionState.emotion] || '#94a3b8' }} />
                            {emotionState.emotion}
                        </div>
                        <div className="stress-meter">
                            <div className="stress-meter-label">
                                <span>Stress</span>
                                <span>{emotionState.stressLevel}/10</span>
                            </div>
                            <div className="stress-track">
                                <div className="stress-fill" style={{
                                    width: `${(emotionState.stressLevel / 10) * 100}%`,
                                    background: emotionState.stressLevel > 7 ? '#ef4444' : emotionState.stressLevel > 4 ? '#f59e0b' : '#10b981'
                                }} />
                            </div>
                        </div>
                        {emotionState.suggestions?.length > 0 && (
                            <div className="ai-suggestions">
                                <div className="suggestions-title">💡 AI Tips</div>
                                {emotionState.suggestions.slice(0, 2).map((s, i) => (
                                    <div key={i} className="suggestion-item">{s}</div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Chat Area */}
            <div className="chat-main">
                {!activeSession ? (
                    <div className="chat-welcome">
                        <div className="chat-welcome-icon">
                            <RiChatAiLine size={48} />
                        </div>
                        <h2>MindWatch AI Therapist</h2>
                        <p>Start a conversation with your personal AI mental health companion. I'm here to listen, understand, and help you navigate life's challenges with evidence-based support.</p>
                        <button className="btn btn-primary btn-lg" onClick={startNewSession}>
                            <RiAddLine size={18} /> Start New Session
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Messages */}
                        <div className="chat-messages">
                            {crisisData && (
                                <div className="crisis-alert">
                                    <div className="crisis-alert-title"><RiAlertLine /> Crisis Support Available</div>
                                    <p>{crisisData.message}</p>
                                    <div className="crisis-hotlines">
                                        {crisisData.hotlines?.map((h, i) => (
                                            <div key={i} className="crisis-hotline">
                                                <strong>{h.name}:</strong> {h.number || h.contact}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <div key={i} className={`chat-message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`}>
                                    <div className={`message-avatar ${msg.role === 'user' ? 'user-avatar' : 'ai-avatar'}`}>
                                        {msg.role === 'user' ? <RiUserLine size={16} /> : <RiRobot2Line size={16} />}
                                    </div>
                                    <div className="message-bubble">
                                        <div className="message-content">{msg.content}</div>
                                        <div className="message-time">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {msg.emotion && msg.role === 'user' && (
                                                <span className="message-emotion" style={{ color: EMOTION_COLORS[msg.emotion] || '#94a3b8' }}>
                                                    • {msg.emotion}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="chat-message ai-message">
                                    <div className="message-avatar ai-avatar"><RiRobot2Line size={16} /></div>
                                    <div className="message-bubble typing-indicator">
                                        <span /><span /><span />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="chat-input-area glass-card">
                            <textarea
                                className="chat-input"
                                placeholder="Share how you're feeling... (Enter to send)"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                disabled={loading}
                            />
                            <button
                                className="btn btn-primary chat-send-btn"
                                onClick={sendMessage}
                                disabled={loading || !input.trim()}
                            >
                                <RiSendPlaneLine size={18} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Chat;
