import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    RiDashboardLine, RiChatAiLine, RiEmotionHappyLine,
    RiBookOpenLine, RiLeafLine, RiHistoryLine, RiMicLine,
    RiLogoutBoxLine, RiMentalHealthLine, RiMenu3Line, RiCloseLine
} from 'react-icons/ri';
import './Sidebar.css';

const navItems = [
    { path: '/dashboard', icon: RiDashboardLine, label: 'Dashboard' },
    { path: '/chat', icon: RiChatAiLine, label: 'AI Therapist' },
    { path: '/mood', icon: RiEmotionHappyLine, label: 'Mood Tracker' },
    { path: '/journal', icon: RiBookOpenLine, label: 'Journal' },
    { path: '/mindfulness', icon: RiLeafLine, label: 'Mindfulness' },
    { path: '/history', icon: RiHistoryLine, label: 'History' },
    { path: '/voice-therapy', icon: RiMicLine, label: 'Voice Therapy' },
];

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* Mobile toggle */}
            <button
                className="mobile-menu-toggle"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
            >
                {mobileOpen ? <RiCloseLine size={22} /> : <RiMenu3Line size={22} />}
            </button>

            {/* Overlay */}
            {mobileOpen && (
                <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
            )}

            <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <RiMentalHealthLine size={22} />
                    </div>
                    <div>
                        <div className="sidebar-logo-text">MindWatch</div>
                        <div className="sidebar-logo-sub">AI Mental Health</div>
                    </div>
                </div>

                {/* User */}
                <div className="sidebar-user">
                    <div className="sidebar-avatar">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{user?.name || 'User'}</div>
                        <div className="sidebar-user-streak">🔥 {user?.streakDays || 0} day streak</div>
                    </div>
                </div>

                <div className="divider" style={{ margin: '0 16px 12px' }} />

                {/* Nav */}
                <nav className="sidebar-nav">
                    {navItems.map(({ path, icon: Icon, label }) => (
                        <NavLink
                            key={path}
                            to={path}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <Icon size={19} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <div className="sidebar-wellness-bar">
                        <div className="sidebar-wellness-label">
                            <span>Wellness Score</span>
                            <span className="gradient-text">{user?.totalSessions || 0} sessions</span>
                        </div>
                        <div className="sidebar-wellness-track">
                            <div className="sidebar-wellness-fill" style={{ width: '65%' }} />
                        </div>
                    </div>

                    <button className="sidebar-logout" onClick={handleLogout}>
                        <RiLogoutBoxLine size={17} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
