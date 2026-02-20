const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are MindWatch AI, a compassionate and highly skilled mental health support assistant. You are trained in cognitive behavioral therapy (CBT), mindfulness-based stress reduction (MBSR), dialectical behavior therapy (DBT), and positive psychology.

Your core responsibilities:
1. Listen empathetically and validate the user's feelings without judgment
2. Analyze emotional patterns and stress signals in user messages
3. Provide evidence-based coping strategies and stress reduction techniques
4. Detect crisis situations and provide appropriate resources
5. Offer personalized mindfulness and breathing exercises
6. Track emotional journeys and celebrate progress

Important guidelines:
- Always respond with warmth, empathy, and respect
- Never diagnose or replace professional medical care
- For crisis situations (mentions of self-harm, suicide), always provide emergency contacts
- Keep responses concise but meaningful (150-300 words typically)
- Use the user's name if provided
- Mix supportive listening with practical techniques

Emergency contacts to share when needed:
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/`;

/**
 * Send a message to Groq and get an AI therapy response
 * @param {Array} messages - Array of {role, content} message history
 * @param {string} userMessage - Latest user message
 * @returns {Promise<string>} AI response
 */
const getTherapyResponse = async (messages, userMessage) => {
    try {
        const chatHistory = messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
        }));

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...chatHistory,
                { role: 'user', content: userMessage }
            ],
            temperature: 0.75,
            max_tokens: 600,
            top_p: 0.9
        });

        return response.choices[0]?.message?.content || "I'm here for you. Could you tell me more about how you're feeling?";
    } catch (err) {
        console.error('Groq therapy response error:', err.message);
        throw new Error('AI service temporarily unavailable. Please try again.');
    }
};

/**
 * Analyze emotions in a text using Groq
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} Emotion analysis object
 */
const analyzeEmotion = async (text) => {
    try {
        const prompt = `Analyze the emotional content of the following text and respond with a JSON object only (no markdown, no explanation):

Text: "${text}"

Return exactly this JSON structure:
{
  "dominantEmotion": "one of: happy|sad|anxious|calm|angry|excited|stressed|neutral|overwhelmed|hopeful",
  "sentimentScore": <number from -1.0 to 1.0>,
  "stressLevel": <number from 0 to 10>,
  "emotions": ["list", "of", "detected", "emotions"],
  "themes": ["key", "themes", "detected"],
  "insights": "2-3 sentence empathetic insight about the emotional state",
  "suggestions": ["3-5 specific, actionable coping strategies"],
  "crisisSignals": <true or false>
}`;

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 500
        });

        const content = response.choices[0]?.message?.content || '{}';
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return getDefaultEmotionAnalysis();
    } catch (err) {
        console.error('Emotion analysis error:', err.message);
        return getDefaultEmotionAnalysis();
    }
};

/**
 * Generate personalized stress reduction suggestions
 * @param {Object} context - User context (mood, triggers, history)
 * @returns {Promise<Array>} List of suggestions
 */
const generateStressSuggestions = async (context) => {
    try {
        const prompt = `Based on this mental health context, provide 5 highly specific and actionable stress reduction strategies:

Current mood: ${context.emotion || 'neutral'} (score: ${context.score || 5}/10)
Triggers: ${context.triggers?.join(', ') || 'none specified'}
Notes: ${context.notes || 'none'}

Respond with a JSON array of strings only (no markdown):
["strategy 1", "strategy 2", "strategy 3", "strategy 4", "strategy 5"]

Each strategy should be concrete, immediately actionable, and tailored to the triggers.`;

        const response = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.6,
            max_tokens: 400
        });

        const content = response.choices[0]?.message?.content || '[]';
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            return JSON.parse(arrayMatch[0]);
        }
        return getDefaultSuggestions(context.emotion);
    } catch (err) {
        console.error('Suggestions generation error:', err.message);
        return getDefaultSuggestions(context.emotion);
    }
};

/**
 * Generate a weekly mental health summary
 */
const generateWeeklySummary = async (moodData, journalSummaries) => {
    try {
        const prompt = `Generate a compassionate weekly mental health summary based on this data:

Mood scores this week: ${JSON.stringify(moodData)}
Journal themes: ${journalSummaries.join('; ')}

Write a 150-word supportive summary that includes:
1. What went well emotionally this week
2. Patterns or trends noticed
3. One key recommendation for next week

Be warm, encouraging, and specific.`;

        const response = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 300
        });

        return response.choices[0]?.message?.content || "Keep tracking your moods and journaling — consistency leads to insight!";
    } catch (err) {
        console.error('Weekly summary error:', err.message);
        return "Great job staying consistent with your mental health journey this week!";
    }
};

const getDefaultEmotionAnalysis = () => ({
    dominantEmotion: 'neutral',
    sentimentScore: 0,
    stressLevel: 3,
    emotions: ['neutral'],
    themes: [],
    insights: "Your message reflects a neutral emotional state. Take a moment to check in with yourself.",
    suggestions: [
        "Take 5 deep breaths to center yourself",
        "Write down 3 things you're grateful for today",
        "Take a 10-minute walk outside"
    ],
    crisisSignals: false
});

const getDefaultSuggestions = (emotion) => {
    const suggestions = {
        stressed: ["Try box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s", "Write about what's causing stress", "Take a 5-minute break from screens"],
        anxious: ["Ground yourself: name 5 things you see, 4 you touch, 3 you hear", "Progressive muscle relaxation for 10 minutes", "Call a trusted friend"],
        sad: ["Gentle movement like a slow walk", "Listen to uplifting music", "Reach out to someone you care about"],
        angry: ["Try physical exercise to release tension", "Journaling your feelings without filter", "Practice 4-7-8 breathing technique"]
    };
    return suggestions[emotion] || ["Practice mindful breathing", "Take a short walk", "Drink water and rest"];
};

module.exports = { getTherapyResponse, analyzeEmotion, generateStressSuggestions, generateWeeklySummary };