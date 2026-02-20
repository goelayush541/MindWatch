const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const JournalEntry = require('../models/JournalEntry');
const { analyzeEmotion } = require('../services/groqService');

// @route POST /api/journal
router.post('/', protect, async (req, res) => {
    try {
        const { title, content, tags, mood } = req.body;

        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Title and content are required' });
        }

        // AI emotion analysis on journal content
        const emotionData = await analyzeEmotion(`${title}. ${content}`);

        const entry = await JournalEntry.create({
            userId: req.user._id,
            title,
            content,
            tags: tags || [],
            mood: mood || emotionData.dominantEmotion || 'neutral',
            aiEmotionAnalysis: {
                dominantEmotion: emotionData.dominantEmotion,
                sentimentScore: emotionData.sentimentScore,
                insights: emotionData.insights,
                suggestions: emotionData.suggestions || [],
                themes: emotionData.themes || []
            }
        });

        res.status(201).json({
            success: true,
            message: 'Journal entry saved',
            data: entry
        });
    } catch (err) {
        console.error('Journal create error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route GET /api/journal
router.get('/', protect, async (req, res) => {
    try {
        const { page = 1, limit = 10, mood, search } = req.query;
        const query = { userId: req.user._id };

        if (mood) query.mood = mood;
        if (search) query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } }
        ];

        const entries = await JournalEntry.find(query)
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        const total = await JournalEntry.countDocuments(query);

        res.json({
            success: true,
            data: entries,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route GET /api/journal/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const entry = await JournalEntry.findOne({ _id: req.params.id, userId: req.user._id });
        if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
        res.json({ success: true, data: entry });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route PUT /api/journal/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const { title, content, tags, mood } = req.body;

        // Re-analyze if content changed
        const emotionData = content ? await analyzeEmotion(`${title || ''}. ${content}`) : null;

        const updates = {
            title, content, tags, mood,
            ...(emotionData && {
                aiEmotionAnalysis: {
                    dominantEmotion: emotionData.dominantEmotion,
                    sentimentScore: emotionData.sentimentScore,
                    insights: emotionData.insights,
                    suggestions: emotionData.suggestions || [],
                    themes: emotionData.themes || []
                }
            })
        };

        const entry = await JournalEntry.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { $set: updates },
            { new: true }
        );

        if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
        res.json({ success: true, data: entry });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route DELETE /api/journal/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        await JournalEntry.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.json({ success: true, message: 'Entry deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
