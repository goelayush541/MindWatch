import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { RiMentalHealthLine, RiUserLine, RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import './Auth.css';

const Register = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password) return toast.error('Please fill all fields');
        if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
        if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
        setLoading(true);
        try {
            await register(form.name, form.email, form.password);
            toast.success('Account created! Welcome to MindWatch 🎉');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
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
                    Take control of your<br />
                    <span className="gradient-text">mental wellness.</span>
                </h1>
                <p className="auth-tagline">
                    Join thousands who track their emotional health, chat with AI support, and build lasting mental resilience.
                </p>
                <div className="auth-stats">
                    {[
                        { value: '10K+', label: 'Active Users' },
                        { value: '98%', label: 'Satisfaction' },
                        { value: '24/7', label: 'AI Support' }
                    ].map(s => (
                        <div key={s.label} className="auth-stat">
                            <div className="auth-stat-value gradient-text">{s.value}</div>
                            <div className="auth-stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="auth-right">
                <div className="auth-card glass-card">
                    <div className="auth-card-header">
                        <h2>Create account</h2>
                        <p>Start your free mental wellness journey</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <div className="input-icon-wrapper">
                                <RiUserLine className="input-icon" size={17} />
                                <input
                                    type="text"
                                    className="form-input input-with-icon"
                                    placeholder="Your name"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                        </div>

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
                                    placeholder="Min 6 characters"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                />
                                <button type="button" className="input-eye-btn" onClick={() => setShowPass(!showPass)}>
                                    {showPass ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <div className="input-icon-wrapper">
                                <RiLockLine className="input-icon" size={17} />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    className="form-input input-with-icon"
                                    placeholder="Repeat password"
                                    value={form.confirmPassword}
                                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                            {loading ? <><div className="spinner" /> Creating account...</> : 'Create Account'}
                        </button>
                    </form>

                    <p className="auth-footer-text">
                        Already have an account?{' '}
                        <Link to="/login" className="auth-link">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
