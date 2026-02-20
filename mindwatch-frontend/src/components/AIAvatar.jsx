import React from 'react';
import './AIAvatar.css';

const AIAvatar = ({ emotion = 'neutral', isTalking = false }) => {
    return (
        <div className={`ai-avatar-container emotion-${emotion} ${isTalking ? 'is-talking' : ''}`}>
            <div className="avatar-glow"></div>
            <svg className="avatar-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                {/* Outer Ring */}
                <circle className="avatar-ring" cx="100" cy="100" r="90" fill="none" strokeWidth="2" />

                {/* Core Halo */}
                <circle className="avatar-halo" cx="100" cy="100" r="70" fill="none" strokeWidth="0.5" />

                {/* Brain/Core Orb */}
                <g className="avatar-core">
                    <circle className="core-base" cx="100" cy="100" r="40" />
                    <circle className="core-inner" cx="100" cy="100" r="25" />

                    {/* Eyes */}
                    <g className="avatar-eyes">
                        <circle className="eye left" cx="85" cy="95" r="3" />
                        <circle className="eye right" cx="115" cy="95" r="3" />
                    </g>

                    {/* Mouth / Waveform */}
                    <path className="avatar-mouth" d="M 85 115 Q 100 115 115 115" fill="none" strokeWidth="2.5" strokeLinecap="round" />
                </g>

                {/* Floating Particles */}
                <circle className="particle p1" cx="50" cy="50" r="2" />
                <circle className="particle p2" cx="150" cy="60" r="3" />
                <circle className="particle p3" cx="70" cy="150" r="1.5" />
                <circle className="particle p4" cx="130" cy="140" r="2.5" />
            </svg>
        </div>
    );
};

export default AIAvatar;
