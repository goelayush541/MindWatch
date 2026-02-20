const mongoose = require('mongoose');

const breathingSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    technique: {
        type: String,
        enum: ['box-breathing', '4-7-8', 'deep-breathing', 'diaphragmatic', 'coherent', 'pursed-lip'],
        default: 'box-breathing'
    },
    duration: {
        type: Number, // seconds
        required: true
    },
    cycles: {
        type: Number,
        default: 0
    },
    moodBefore: {
        type: Number,
        min: 1,
        max: 10
    },
    moodAfter: {
        type: Number,
        min: 1,
        max: 10
    },
    notes: { type: String, default: '' }
}, { timestamps: true });

breathingSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('BreathingSession', breathingSessionSchema);
