import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import AIAvatar from '../components/AIAvatar';
import { RiMicLine, RiMicOffLine, RiVolumeUpLine, RiVolumeMuteLine, RiArrowRightSLine } from 'react-icons/ri';
import './VoiceTherapy.css';
import toast from 'react-hot-toast';

const VoiceTherapy = () => {
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [emotion, setEmotion] = useState('neutral');
    const [suggestions, setSuggestions] = useState([]);
    const [growthProgress, setGrowthProgress] = useState('');
    const [emotionalIntensity, setEmotionalIntensity] = useState(0);
    const [mute, setMute] = useState(false);

    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const silenceTimerRef = useRef(null);
    const isListeningRef = useRef(false);
    const [volume, setVolume] = useState(0);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);

    const startAudioAnalysis = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateVolume = () => {
                if (!isListeningRef.current) {
                    setVolume(0);
                    return;
                }
                if (analyserRef.current) {
                    analyserRef.current.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
                    setVolume(average);
                    requestAnimationFrame(updateVolume);
                }
            };
            updateVolume();
        } catch (err) {
            console.error('Audio analysis error:', err);
        }
    };

    const stopAudioAnalysis = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }
    };

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Your browser doesn't support voice recognition.");
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // BARGE-IN: If user starts speaking while AI is talking, stop AI
            if (interimTranscript.trim() && window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
            }

            if (interimTranscript) setTranscript(interimTranscript);

            if (finalTranscript.trim()) {
                setTranscript(finalTranscript);
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = setTimeout(() => {
                    processVoiceInput(finalTranscript);
                }, 1000);
            }
        };

        recognitionRef.current.onend = () => {
            if (isListeningRef.current) {
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    // Ignore already started errors
                }
            }
        };

        recognitionRef.current.onerror = (event) => {
            if (event.error !== 'no-speech') {
                console.error('STT Error:', event.error);
            }
        };

        return () => {
            isListeningRef.current = false;
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
            }
            if (synthRef.current) synthRef.current.cancel();
            clearTimeout(silenceTimerRef.current);
            stopAudioAnalysis();
        };
    }, []);

    const processVoiceInput = async (text) => {
        if (!text.trim() || isThinking) return;

        setIsThinking(true);
        console.log('Processing voice input:', text);

        try {
            const sessionRes = await api.get('/chat/sessions?limit=1');
            let sessionId = sessionRes.data.data[0]?._id;

            if (!sessionId) {
                const newSessionRes = await api.post('/chat/new-session');
                sessionId = newSessionRes.data.data._id;
            }

            const res = await api.post('/chat/message', {
                message: text,
                sessionId: sessionId
            });

            const { aiResponse, emotionAnalysis } = res.data.data;

            setAiResponse(aiResponse);
            setEmotion(emotionAnalysis?.dominantEmotion || 'neutral');
            setSuggestions(emotionAnalysis?.suggestions || []);
            setGrowthProgress(emotionAnalysis?.growthProgress || '');
            setEmotionalIntensity(emotionAnalysis?.intensity || 0);
            if (emotionAnalysis?.insights) {
                setAiResponse(prev => `${prev}\n\n*Therapeutic Insight: ${emotionAnalysis.insights}*`);
            }

            if (!mute) {
                speakText(aiResponse);
            }
        } catch (error) {
            console.error('Voice processing error', error);
        } finally {
            setIsThinking(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            isListeningRef.current = false;
            recognitionRef.current.stop();
            setIsListening(false);
            stopAudioAnalysis();
        } else {
            setTranscript('');
            setAiResponse('');
            setSuggestions([]);
            isListeningRef.current = true;
            recognitionRef.current.start();
            setIsListening(true);
            startAudioAnalysis();
            toast.success("AI is now listening...");
        }
    };

    const speakText = (text) => {
        if (!synthRef.current || mute) return;

        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Female') || v.lang === 'en-US');
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.rate = 0.9;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
    };

    return (
        <div className="voice-therapy-container animate-fadeInUp">
            <div className="voice-header">
                <h1 className="page-title">Live AI Voice Therapy</h1>
                <p className="page-subtitle">A two-way conversation. You can interrupt the AI at any time by speaking.</p>
            </div>

            <div className="voice-main">
                <div className="avatar-section">
                    <div className="avatar-wrapper">
                        <AIAvatar emotion={emotion} isTalking={isSpeaking} />
                        {isListening && (
                            <div
                                className="mic-visualizer"
                                style={{ transform: `scale(${1 + volume / 50})`, opacity: volume / 100 + 0.2 }}
                            />
                        )}
                    </div>
                    <div className={`status-indicator ${isSpeaking ? 'speaking' : isThinking ? 'thinking' : isListening ? 'listening' : ''}`}>
                        {isSpeaking ? 'AI is Speaking' : isThinking ? 'AI is Thinking' : isListening ? 'Listening...' : 'Mic is Off'}
                    </div>
                </div>

                <div className="interaction-section">
                    <div className="transcript-box glass-card">
                        <div className="box-label">Your Message</div>
                        <p>{transcript || (isListening ? 'Start speaking...' : 'Click the mic to start')}</p>
                    </div>

                    <div className="response-box glass-card">
                        <div className="box-label">AI Therapist</div>
                        <p className={isThinking ? 'blur-text' : ''}>
                            {aiResponse || 'Awaiting your voice...'}
                        </p>
                    </div>

                    <div className="voice-controls">
                        <button
                            className={`voice-btn mic-btn ${isListening ? 'active' : ''}`}
                            onClick={toggleListening}
                            disabled={isThinking || isSpeaking}
                        >
                            {isListening ? <RiMicOffLine size={28} /> : <RiMicLine size={28} />}
                        </button>

                        <button
                            className={`voice-btn mute-btn ${mute ? 'muted' : ''}`}
                            onClick={() => {
                                setMute(!mute);
                                if (!mute && isSpeaking) synthRef.current.cancel();
                            }}
                        >
                            {mute ? <RiVolumeMuteLine size={24} /> : <RiVolumeUpLine size={24} />}
                        </button>
                    </div>
                </div>

                {(suggestions.length > 0 || growthProgress) && (
                    <div className="voice-suggestions glass-card animate-fadeIn">
                        <div className="suggestions-header">
                            <h3>💡 Session Insights</h3>
                            {growthProgress && <span className="growth-badge">{growthProgress}</span>}
                        </div>

                        <div className="intensity-meter">
                            <div className="intensity-label">Emotional Intensity</div>
                            <div className="intensity-bar">
                                <div
                                    className="intensity-fill"
                                    style={{ width: `${emotionalIntensity}%`, background: `linear-gradient(90deg, #8b5cf6, ${emotionalIntensity > 70 ? '#ef4444' : '#06b6d4'})` }}
                                />
                            </div>
                        </div>

                        <div className="suggestions-list">
                            {suggestions.map((s, i) => (
                                <div key={i} className="suggestion-item">
                                    <RiArrowRightSLine />
                                    <span>{s}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoiceTherapy;
