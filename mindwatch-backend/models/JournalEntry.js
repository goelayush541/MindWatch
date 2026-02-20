const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
        maxlength: 10000
    },
    tags: [{ type: String }],
    mood: {
        type: String,
        enum: ['happy', 'sad', 'anxious', 'calm', 'angry', 'excited', 'stressed', 'neutral', 'overwhelmed', 'hopeful'],
        default: 'neutral'
    },
    aiEmotionAnalysis: {
        dominantEmotion: { type: String, default: '' },
        sentimentScore: { type: Number, default: 0 }, // -1 to 1
        insights: { type: String, default: '' },
        suggestions: [{ type: String }],
        themes: [{ type: String }]
    },
    isPrivate: { type: Boolean, default: true },
    wordCount: { type: Number, default: 0 }
}, { timestamps: true });

journalEntrySchema.index({ userId: 1, createdAt: -1 });

// Auto-calculate word count
journalEntrySchema.pre('save', function (next) {
    this.wordCount = this.content.trim().split(/\s+/).length;
    next();
});

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
