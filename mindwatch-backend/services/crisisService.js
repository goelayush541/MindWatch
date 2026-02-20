/**
 * Crisis detection service — detects mental health crises from text
 */

const CRISIS_KEYWORDS = [
    'suicide', 'kill myself', 'end my life', 'die', 'not worth living',
    'self-harm', 'cut myself', 'hurt myself', 'no reason to live',
    'want to die', 'goodbye forever', 'can\'t go on', 'no way out',
    'better off dead', 'overdose', 'pills', 'method', 'end it all'
];

const STRESS_KEYWORDS = [
    'stress', 'anxiety', 'worried', 'panic', 'overwhelmed', 'nervous',
    'tense', 'pressure', 'burnout', 'exhausted', 'hopeless', 'helpless',
    'trapped', 'can\'t breathe', 'heart racing', 'breaking down'
];

const CRISIS_RESOURCES = {
    hotlines: [
        { name: 'National Suicide Prevention Lifeline', number: '988', available: '24/7' },
        { name: 'Crisis Text Line', contact: 'Text HOME to 741741', available: '24/7' },
        { name: 'SAMHSA Helpline', number: '1-800-662-4357', available: '24/7' },
        { name: 'International Association for Suicide Prevention', url: 'https://www.iasp.info/resources/Crisis_Centres/' }
    ],
    message: "You're not alone. Please reach out to a crisis support line immediately. Your life has value and there are people trained to help you right now."
};

/**
 * Detect if a message contains crisis signals
 * @param {string} text 
 * @returns {{ isCrisis: boolean, isStress: boolean, severity: string, resources: Object }}
 */
const detectCrisis = (text) => {
    const lowerText = text.toLowerCase();

    const crisisMatches = CRISIS_KEYWORDS.filter(keyword => lowerText.includes(keyword));
    const stressMatches = STRESS_KEYWORDS.filter(keyword => lowerText.includes(keyword));

    const isCrisis = crisisMatches.length > 0;
    const isStress = stressMatches.length > 0;

    let severity = 'none';
    if (crisisMatches.length >= 3) severity = 'critical';
    else if (crisisMatches.length >= 1) severity = 'high';
    else if (stressMatches.length >= 3) severity = 'moderate';
    else if (stressMatches.length >= 1) severity = 'low';

    return {
        isCrisis,
        isStress,
        severity,
        detectedKeywords: [...crisisMatches, ...stressMatches],
        resources: isCrisis ? CRISIS_RESOURCES : null
    };
};

/**
 * Calculate stress level from text (0-10)
 */
const calculateStressLevel = (text) => {
    const lowerText = text.toLowerCase();
    const stressMatches = STRESS_KEYWORDS.filter(kw => lowerText.includes(kw)).length;
    const crisisMatches = CRISIS_KEYWORDS.filter(kw => lowerText.includes(kw)).length;

    const score = Math.min(10, (stressMatches * 1.5) + (crisisMatches * 3));
    return Math.round(score);
};

module.exports = { detectCrisis, calculateStressLevel, CRISIS_RESOURCES };
