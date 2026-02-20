const mongoose = require('mongoose');

const moodLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    emotion: {
        type: String,
        enum: ['happy', 'sad', 'anxious', 'calm', 'angry', 'excited', 'stressed', 'neutral', 'overwhelmed', 'hopeful'],
        required: true
    },
    notes: {
        type: String,
        maxlength: 500,
        default: ''
    },
    triggers: [{
        type: String,
        enum: ['work', 'family', 'health', 'finances', 'relationships', 'sleep', 'exercise', 'diet', 'social', 'personal', 'other']
    }],
    aiSuggestions: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    aiAnalysis: {
        type: String,
        default: ''
    },
    activities: [{
        type: String
    }],
    energyLevel: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    sleepHours: {
        type: Number,
        min: 0,
        max: 24,
        default: null
    }
}, { timestamps: true });

// Index for efficient user queries
moodLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('MoodLog', moodLogSchema);
