const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const BreathingSession = require('../models/BreathingSession');

// @route POST /api/mindfulness/session
router.post('/session', protect, async (req, res) => {
    try {
        const { technique, duration, cycles, moodBefore, moodAfter, notes } = req.body;

        const session = await BreathingSession.create({
            userId: req.user._id,
            technique: technique || 'box-breathing',
            duration: duration || 300,
            cycles: cycles || 0,
            moodBefore,
            moodAfter,
            notes: notes || ''
        });

        res.status(201).json({ success: true, message: 'Session logged', data: session });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route GET /api/mindfulness/sessions
router.get('/sessions', protect, async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const sessions = await BreathingSession.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        // Stats
        const totalMinutes = sessions.reduce((sum, s) => sum + Math.floor(s.duration / 60), 0);
        const avgMoodImprovement = sessions
            .filter(s => s.moodBefore && s.moodAfter)
            .reduce((sum, s) => sum + (s.moodAfter - s.moodBefore), 0) / (sessions.filter(s => s.moodBefore && s.moodAfter).length || 1);

        res.json({
            success: true,
            data: sessions,
            stats: {
                totalSessions: sessions.length,
                totalMinutes,
                avgMoodImprovement: parseFloat(avgMoodImprovement.toFixed(1))
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route GET /api/mindfulness/techniques
router.get('/techniques', (req, res) => {
    const techniques = [
        {
            id: 'box-breathing',
            name: 'Box Breathing',
            description: 'Equal breathing pattern used by US Navy SEALs to reduce stress',
            pattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
            benefits: ['Reduces stress', 'Improves focus', 'Calms nervous system'],
            difficulty: 'Beginner',
            duration: 300
        },
        {
            id: '4-7-8',
            name: '4-7-8 Breathing',
            description: 'Dr. Andrew Weil\'s technique for anxiety and sleep',
            pattern: { inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
            benefits: ['Reduces anxiety', 'Promotes sleep', 'Lowers heart rate'],
            difficulty: 'Intermediate',
            duration: 240
        },
        {
            id: 'deep-breathing',
            name: 'Deep Belly Breathing',
            description: 'Simple diaphragmatic breathing for instant calm',
            pattern: { inhale: 5, hold1: 0, exhale: 5, hold2: 0 },
            benefits: ['Immediate stress relief', 'Increases oxygen', 'Easy to learn'],
            difficulty: 'Beginner',
            duration: 180
        },
        {
            id: 'coherent',
            name: 'Coherent Breathing',
            description: '5 breaths per minute for heart-brain coherence',
            pattern: { inhale: 6, hold1: 0, exhale: 6, hold2: 0 },
            benefits: ['HRV improvement', 'Deep calm', 'Mental clarity'],
            difficulty: 'Intermediate',
            duration: 360
        },
        {
            id: 'pursed-lip',
            name: 'Pursed Lip Breathing',
            description: 'Slows breathing and improves ventilation',
            pattern: { inhale: 2, hold1: 0, exhale: 4, hold2: 0 },
            benefits: ['Reduces breathlessness', 'Relaxes muscles', 'Controls pace'],
            difficulty: 'Beginner',
            duration: 240
        }
    ];

    res.json({ success: true, data: techniques });
});

module.exports = router;
