import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { RiMentalHealthLine, RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import './Auth.css';

const Login = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) return toast.error('Please fill all fields');
        setLoading(true);
        try {
            await login(form.email, form.password);
            toast.success('Welcome back! 💜');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-left">
                <div className="auth-brand">
                    <div className="auth-brand-icon"><RiMentalHealthLine size={28} /></div>
                    <span>MindWatch</span>
                </div>
                <h1 className="auth-headline">
                    Your mental health<br />
                    <span className="gradient-text">journey starts here.</span>
                </h1>
                <p className="auth-tagline">
                    AI-powered emotional support, mood tracking, and personalized wellness insights — all in one place.
                </p>
                <div className="auth-features">
                    {['🧠 AI Emotion Analysis', '💬 24/7 Therapy Chat', '📊 Mood Trend Insights', '🌿 Mindfulness Exercises'].map(f => (
                        <div key={f} className="auth-feature-chip">{f}</div>
                    ))}
                </div>
            </div>

            <div className="auth-right">
                <div className="auth-card glass-card">
                    <div className="auth-card-header">
                        <h2>Welcome back</h2>
                        <p>Sign in to continue your wellness journey</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Email address</label>
                            <div className="input-icon-wrapper">
                                <RiMailLine className="input-icon" size={17} />
                                <input
                                    type="email"
                                    className="form-input input-with-icon"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="input-icon-wrapper">
                                <RiLockLine className="input-icon" size={17} />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    className="form-input input-with-icon"
                                    placeholder="Your password"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="input-eye-btn"
                                    onClick={() => setShowPass(!showPass)}
                                >
                                    {showPass ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                            {loading ? <><div className="spinner" /> Signing in...</> : 'Sign In'}
                        </button>
                    </form>

                    <p className="auth-footer-text">
                        Don't have an account?{' '}
                        <Link to="/register" className="auth-link">Create one free</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
