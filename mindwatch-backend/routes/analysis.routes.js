const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const MoodLog = require('../models/MoodLog');
const JournalEntry = require('../models/JournalEntry');
const ChatSession = require('../models/ChatSession');
const BreathingSession = require('../models/BreathingSession');
const { generateWeeklySummary } = require('../services/groqService');

// @route GET /api/analysis/overview
router.get('/overview', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [moodLogs, journalCount, chatSessions, breathingSessions] = await Promise.all([
            MoodLog.find({ userId, createdAt: { $gte: thirtyDaysAgo } }).sort({ createdAt: 1 }),
            JournalEntry.countDocuments({ userId }),
            ChatSession.countDocuments({ userId }),
            BreathingSession.find({ userId, createdAt: { $gte: thirtyDaysAgo } })
        ]);

        const averageMood = moodLogs.length > 0
            ? moodLogs.reduce((sum, l) => sum + l.score, 0) / moodLogs.length
            : 0;

        // Emotion distribution
        const emotionDist = {};
        moodLogs.forEach(l => {
            emotionDist[l.emotion] = (emotionDist[l.emotion] || 0) + 1;
        });

        // Stress trend
        const stressAvg = moodLogs.length > 0
            ? moodLogs.filter(l => ['stressed', 'anxious', 'overwhelmed'].includes(l.emotion)).length / moodLogs.length
            : 0;

        // Mindfulness minutes
        const mindfulMinutes = breathingSessions.reduce((sum, s) => sum + Math.floor(s.duration / 60), 0);

        res.json({
            success: true,
            data: {
                period: '30 days',
                averageMood: parseFloat(averageMood.toFixed(1)),
                totalMoodLogs: moodLogs.length,
                totalJournalEntries: journalCount,
                totalChatSessions: chatSessions,
                totalBreathingSessions: breathingSessions.length,
                mindfulMinutes,
                emotionDistribution: emotionDist,
                stressPercentage: parseFloat((stressAvg * 100).toFixed(1)),
                wellnessScore: calculateWellnessScore(averageMood, stressAvg, mindfulMinutes, moodLogs.length)
            }
        });
    } catch (err) {
        console.error('Analysis overview error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route GET /api/analysis/weekly-summary
router.get('/weekly-summary', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const [moodLogs, journalEntries] = await Promise.all([
            MoodLog.find({ userId, createdAt: { $gte: sevenDaysAgo } }),
            JournalEntry.find({ userId, createdAt: { $gte: sevenDaysAgo } }).select('aiEmotionAnalysis.themes')
        ]);

        const moodData = moodLogs.map(l => ({ date: l.createdAt, score: l.score, emotion: l.emotion }));
        const themes = journalEntries.flatMap(e => e.aiEmotionAnalysis?.themes || []);

        const summary = await generateWeeklySummary(moodData, themes);

        res.json({ success: true, data: { summary, period: '7 days', logsReviewed: moodLogs.length } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route GET /api/analysis/stress-report
router.get('/stress-report', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const moodLogs = await MoodLog.find({
            userId,
            createdAt: { $gte: fourteenDaysAgo }
        }).sort({ createdAt: 1 });

        const stressfulMoods = moodLogs.filter(l => ['stressed', 'anxious', 'overwhelmed', 'angry'].includes(l.emotion));

        // Top triggers
        const triggerCount = {};
        stressfulMoods.forEach(l => l.triggers.forEach(t => {
            triggerCount[t] = (triggerCount[t] || 0) + 1;
        }));

        const topTriggers = Object.entries(triggerCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([trigger, count]) => ({ trigger, count }));

        res.json({
            success: true,
            data: {
                totalStressEvents: stressfulMoods.length,
                stressRate: moodLogs.length > 0 ? parseFloat(((stressfulMoods.length / moodLogs.length) * 100).toFixed(1)) : 0,
                topTriggers,
                timeline: moodLogs.map(l => ({
                    date: l.createdAt,
                    score: l.score,
                    emotion: l.emotion,
                    isStressful: ['stressed', 'anxious', 'overwhelmed', 'angry'].includes(l.emotion)
                }))
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Helper: calculate wellness score 0-100
const calculateWellnessScore = (avgMood, stressRate, mindfulMinutes, logCount) => {
    const moodScore = (avgMood / 10) * 40;
    const stressScore = (1 - stressRate) * 30;
    const mindfulScore = Math.min(mindfulMinutes / 60, 1) * 20;
    const consistencyScore = Math.min(logCount / 30, 1) * 10;
    return Math.round(moodScore + stressScore + mindfulScore + consistencyScore);
};

module.exports = router;
