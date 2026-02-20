const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const MoodLog = require('../models/MoodLog');
const { analyzeEmotion, generateStressSuggestions } = require('../services/groqService');

// @route POST /api/mood
router.post('/', protect, async (req, res) => {
    try {
        const { score, emotion, notes, triggers, energyLevel, sleepHours } = req.body;

        // Generate AI suggestions
        const suggestions = await generateStressSuggestions({ score, emotion, triggers, notes });
        const emotionData = notes ? await analyzeEmotion(notes) : null;

        const moodLog = await MoodLog.create({
            userId: req.user._id,
            score,
            emotion,
            notes: notes || '',
            triggers: triggers || [],
            aiSuggestions: suggestions,
            aiAnalysis: emotionData?.insights || '',
            energyLevel: energyLevel || 3,
            sleepHours: sleepHours || null
        });

        res.status(201).json({
            success: true,
            message: 'Mood logged successfully',
            data: moodLog
        });
    } catch (err) {
        console.error('Mood log error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route GET /api/mood
router.get('/', protect, async (req, res) => {
    try {
        const { limit = 30, days = 30 } = req.query;
        const from = new Date();
        from.setDate(from.getDate() - parseInt(days));

        const moodLogs = await MoodLog.find({
            userId: req.user._id,
            createdAt: { $gte: from }
        }).sort({ createdAt: -1 }).limit(parseInt(limit));

        res.json({ success: true, data: moodLogs });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route GET /api/mood/stats
router.get('/stats', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const moodLogs = await MoodLog.find({
            userId,
            createdAt: { $gte: thirtyDaysAgo }
        }).sort({ createdAt: 1 });

        if (moodLogs.length === 0) {
            return res.json({ success: true, data: { averageMood: 0, trend: [], emotionFrequency: {}, totalLogs: 0 } });
        }

        // Average mood
        const averageMood = moodLogs.reduce((sum, log) => sum + log.score, 0) / moodLogs.length;

        // Emotion frequency
        const emotionFrequency = {};
        moodLogs.forEach(log => {
            emotionFrequency[log.emotion] = (emotionFrequency[log.emotion] || 0) + 1;
        });

        // Trend data (daily averages)
        const trendMap = {};
        moodLogs.forEach(log => {
            const date = log.createdAt.toISOString().split('T')[0];
            if (!trendMap[date]) trendMap[date] = { total: 0, count: 0 };
            trendMap[date].total += log.score;
            trendMap[date].count += 1;
        });

        const trend = Object.entries(trendMap).map(([date, val]) => ({
            date,
            average: parseFloat((val.total / val.count).toFixed(1))
        }));

        // Most common trigger
        const triggerFrequency = {};
        moodLogs.forEach(log => {
            log.triggers.forEach(t => {
                triggerFrequency[t] = (triggerFrequency[t] || 0) + 1;
            });
        });

        res.json({
            success: true,
            data: {
                averageMood: parseFloat(averageMood.toFixed(1)),
                totalLogs: moodLogs.length,
                trend,
                emotionFrequency,
                triggerFrequency,
                latestMood: moodLogs[moodLogs.length - 1]
            }
        });
    } catch (err) {
        console.error('Mood stats error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route PUT /api/mood/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const moodLog = await MoodLog.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true }
        );
        if (!moodLog) return res.status(404).json({ success: false, message: 'Mood log not found' });
        res.json({ success: true, data: moodLog });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route DELETE /api/mood/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        await MoodLog.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.json({ success: true, message: 'Mood log deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
