const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ChatSession = require('../models/ChatSession');
const { getTherapyResponse, analyzeEmotion } = require('../services/groqService');
const { detectCrisis, calculateStressLevel } = require('../services/crisisService');

// @route POST /api/chat/message
router.post('/message', protect, async (req, res) => {
    const { message, sessionId } = req.body;

    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Message is required' });
    }

    try {
        // Detect crisis signals
        const crisisCheck = detectCrisis(message);
        const stressLevel = calculateStressLevel(message);

        // Find or create session
        let session;
        if (sessionId) {
            session = await ChatSession.findOne({ _id: sessionId, userId: req.user._id });
        }
        if (!session) {
            session = await ChatSession.create({
                userId: req.user._id,
                sessionTitle: `Session - ${new Date().toLocaleDateString()}`,
                messages: []
            });
        }

        // Add user message
        session.messages.push({
            role: 'user',
            content: message,
            stressLevel,
            emotion: 'neutral',
            timestamp: new Date()
        });

        // Get AI response
        const aiResponse = await getTherapyResponse(session.messages, message);

        // Analyze emotion with context
        const emotionData = await analyzeEmotion(message, session.messages);

        // Update the user message emotion
        const lastUserMsg = session.messages[session.messages.length - 1];
        lastUserMsg.emotion = emotionData.dominantEmotion;
        lastUserMsg.stressLevel = emotionData.stressLevel || stressLevel;

        // Add AI response
        session.messages.push({
            role: 'assistant',
            content: aiResponse,
            emotion: 'supportive',
            timestamp: new Date()
        });

        // Update crisis flag
        if (crisisCheck.isCrisis) {
            session.crisisDetected = true;
        }

        // Update emotion summary
        session.emotionSummary.dominant = emotionData.dominantEmotion;

        await session.save();

        res.json({
            success: true,
            data: {
                sessionId: session._id,
                userMessage: message,
                aiResponse,
                emotionAnalysis: emotionData,
                crisisDetected: crisisCheck.isCrisis,
                crisisResources: crisisCheck.resources,
                stressLevel: emotionData.stressLevel || stressLevel
            }
        });
    } catch (err) {
        console.error('Chat error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/chat/sessions
router.get('/sessions', protect, async (req, res) => {
    try {
        const sessions = await ChatSession.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('sessionTitle emotionSummary crisisDetected createdAt messages');

        res.json({ success: true, data: sessions });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route GET /api/chat/sessions/:id
router.get('/sessions/:id', protect, async (req, res) => {
    try {
        const session = await ChatSession.findOne({
            _id: req.params.id,
            userId: req.user._id
        });
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
        res.json({ success: true, data: session });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route POST /api/chat/new-session
router.post('/new-session', protect, async (req, res) => {
    try {
        const session = await ChatSession.create({
            userId: req.user._id,
            sessionTitle: `Session - ${new Date().toLocaleDateString()}`,
            messages: []
        });
        res.status(201).json({ success: true, data: session });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
