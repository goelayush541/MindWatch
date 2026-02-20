const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false
    },
    avatar: {
        type: String,
        default: ''
    },
    preferences: {
        theme: { type: String, default: 'dark' },
        notifications: { type: Boolean, default: true },
        dailyReminder: { type: Boolean, default: false },
        reminderTime: { type: String, default: '09:00' }
    },
    onboardingCompleted: { type: Boolean, default: false },
    streakDays: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: Date.now },
    totalSessions: { type: Number, default: 0 }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Update streak
userSchema.methods.updateStreak = function () {
    const today = new Date();
    const lastActive = new Date(this.lastActiveDate);
    const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
        this.streakDays += 1;
    } else if (diffDays > 1) {
        this.streakDays = 1;
    }
    this.lastActiveDate = today;
};

module.exports = mongoose.model('User', userSchema);
