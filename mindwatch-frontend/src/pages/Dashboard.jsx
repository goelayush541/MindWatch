import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, ArcElement, Tooltip, Legend, Filler
} from 'chart.js';
import {
    RiChatAiLine, RiEmotionHappyLine, RiBookOpenLine, RiLeafLine,
    RiFireLine, RiBarChartLine, RiMentalHealthLine, RiArrowRightLine
} from 'react-icons/ri';
import './Dashboard.css';
import StressTips from '../components/StressTips';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const EMOTION_EMOJIS = {
    happy: '😊', sad: '😢', anxious: '😰', calm: '😌', angry: '😤',
    excited: '🤩', stressed: '😫', neutral: '😐', overwhelmed: '🥺', hopeful: '🌱'
};

const Dashboard = () => {
    const { user } = useAuth();
    const [overview, setOverview] = useState(null);
    const [latestMood, setLatestMood] = useState(null);
    const [moodTrend, setMoodTrend] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quote, setQuote] = useState('');

    const quotes = [
        "You are braver than you believe, stronger than you seem, and smarter than you think.",
        "Mental health is not a destination, but a process. It's about how you drive, not where you're going.",
        "Every day is a second chance.",
        "You don't have to be positive all the time. It's perfectly okay to feel sad, angry, annoyed, frustrated.",
        "Healing takes time. And asking for help is a courageous step."
    ];

    useEffect(() => {
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [overviewRes, moodRes] = await Promise.all([
                api.get('/analysis/overview').catch(() => ({ data: { data: null } })),
                api.get('/mood/stats').catch(() => ({ data: { data: { trend: [], latestMood: null } } }))
            ]);
            setOverview(overviewRes.data.data);
            setMoodTrend(moodRes.data.data?.trend || []);
            setLatestMood(moodRes.data.data?.latestMood);
        } finally {
            setLoading(false);
        }
    };

    const lineChartData = {
        labels: moodTrend.slice(-7).map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en', { weekday: 'short' });
        }),
        datasets: [{
            label: 'Mood Score',
            data: moodTrend.slice(-7).map(d => d.average),
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#8b5cf6',
            pointBorderColor: '#1e1b4b',
            pointRadius: 6,
            borderWidth: 2
        }]
    };

    const emotionDist = overview?.emotionDistribution || {};
    const emotionLabels = Object.keys(emotionDist);

    const doughnutData = {
        labels: emotionLabels.map(e => e.charAt(0).toUpperCase() + e.slice(1)),
        datasets: [{
            data: Object.values(emotionDist),
            backgroundColor: [
                '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899',
                '#ef4444', '#6366f1', '#14b8a6', '#84cc16', '#f97316'
            ],
            borderWidth: 0,
            hoverOffset: 6
        }]
    };

    const chartOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280' } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280' }, min: 0, max: 10 }
        }
    };

    const quickActions = [
        { to: '/chat', icon: RiChatAiLine, label: 'Chat with AI', sub: 'Get support now', color: '#8b5cf6' },
        { to: '/mood', icon: RiEmotionHappyLine, label: 'Log Mood', sub: 'Track how you feel', color: '#06b6d4' },
        { to: '/journal', icon: RiBookOpenLine, label: 'Write Journal', sub: 'Reflect & process', color: '#10b981' },
        { to: '/mindfulness', icon: RiLeafLine, label: 'Breathe', sub: 'Relieve stress now', color: '#f59e0b' }
    ];

    return (
        <div className="dashboard animate-fadeInUp">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 className="page-title">
                        Good {getTimeGreeting()}, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="page-subtitle">{new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="dashboard-streak glass-card">
                    <RiFireLine size={22} color="#f59e0b" />
                    <div>
                        <div className="streak-num">{user?.streakDays || 0}</div>
                        <div className="streak-label">Day Streak</div>
                    </div>
                </div>
            </div>

            {/* Quote */}
            <div className="quote-card glass-card">
                <div className="quote-icon">💬</div>
                <blockquote className="quote-text">"{quote}"</blockquote>
            </div>

            {/* Stats */}
            <div className="grid-4" style={{ marginBottom: 28 }}>
                {[
                    { label: 'Avg Mood', value: overview?.averageMood || '—', suffix: '/10', icon: '😊', color: '#8b5cf6' },
                    { label: 'Wellness Score', value: overview?.wellnessScore || '—', suffix: '%', icon: '💚', color: '#10b981' },
                    { label: 'Mindful Minutes', value: overview?.mindfulMinutes || 0, suffix: 'min', icon: '🌿', color: '#06b6d4' },
                    { label: 'Stress Level', value: overview?.stressPercentage || 0, suffix: '%', icon: '😤', color: '#f59e0b' }
                ].map(stat => (
                    <div key={stat.label} className="stat-card glass-card">
                        <div className="stat-icon">{stat.icon}</div>
                        <div className="stat-value" style={{ color: stat.color }}>
                            {stat.value}<span className="stat-suffix">{stat.suffix}</span>
                        </div>
                        <div className="stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid-2" style={{ marginBottom: 28 }}>
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 className="chart-title">
                        <RiBarChartLine /> Mood Trend (Last 7 Days)
                    </h3>
                    {moodTrend.length > 0 ? (
                        <Line data={lineChartData} options={chartOptions} />
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">📊</div>
                            <div className="empty-state-title">No data yet</div>
                            <div className="empty-state-text">Start logging your mood to see trends</div>
                        </div>
                    )}
                </div>

                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 className="chart-title">
                        <RiMentalHealthLine /> Emotion Distribution
                    </h3>
                    {emotionLabels.length > 0 ? (
                        <div className="doughnut-wrapper">
                            <Doughnut data={doughnutData} options={{ plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 12 } } } } }} />
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">🎭</div>
                            <div className="empty-state-title">No emotions tracked</div>
                            <div className="empty-state-text">Log moods to see distribution</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section">
                <h3 className="section-title">Quick Actions</h3>
                <div className="grid-4">
                    {quickActions.map(action => (
                        <Link key={action.to} to={action.to} className="quick-action-card glass-card">
                            <div className="quick-action-icon" style={{ background: `${action.color}20`, color: action.color }}>
                                <action.icon size={24} />
                            </div>
                            <div className="quick-action-label">{action.label}</div>
                            <div className="quick-action-sub">{action.sub}</div>
                            <RiArrowRightLine className="quick-action-arrow" size={16} />
                        </Link>
                    ))}
                </div>
            </div>

            {/* Stress Reduction Tips */}
            <StressTips context={latestMood} />
        </div>
    );
};

const getTimeGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
};

export default Dashboard;
