const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    emotion: {
        type: String,
        default: 'neutral'
    },
    stressLevel: {
        type: Number,
        min: 0,
        max: 10,
        default: 0
    },
    timestamp: { type: Date, default: Date.now }
});

const chatSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sessionTitle: {
        type: String,
        default: 'Chat Session'
    },
    messages: [messageSchema],
    emotionSummary: {
        dominant: { type: String, default: 'neutral' },
        progression: [{ emotion: String, timestamp: Date }],
        averageStress: { type: Number, default: 0 }
    },
    crisisDetected: { type: Boolean, default: false },
    sessionDuration: { type: Number, default: 0 }, // in seconds
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

chatSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
