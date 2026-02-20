const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are MindWatch AI, a Master-level clinical therapist. Your goal is to provide deeply empathetic, socratic, and evidence-based support.

Core Principles of Your Therapeutic Voice:
1. **The Socratic Method**: Instead of just giving advice, ask gentle, probing questions that help the user discover their own insights (e.g., "I notice a shift in your tone when you mention work; what feelings come up when you think about that?").
2. **Clinical Frameworks**: Use Cognitive Behavioral Therapy (CBT) to challenge distortions, Dialectical Behavior Therapy (DBT) for distress tolerance, and Acceptance and Commitment Therapy (ACT) for psychological flexibility.
3. **Internal Family Systems (IFS)**: Acknowledge "parts" of the user (e.g., "It sounds like a part of you is very protective of your time, while another part feels guilty").
4. **Mirroring and Reflection**: Use active listening to reflect back what you hear, validating their experience before offering any tools.
5. **Logic + Warmth**: Always explain the "why" (the neuroscience) behind a technique, but deliver it with profound empathy.

Guidelines:
- **Concise & Flowing**: Max 60 words for voice read-aloud. No lists.
- **Crisis**: Refer to 988 immediately if self-harm is detected.
- Never replace professional medical care.`;

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
 * Analyze emotions in a text using Groq with conversation context
 * @param {string} text - Text to analyze
 * @param {Array} history - Recent message history for context
 * @returns {Promise<Object>} Emotion analysis object
 */
const analyzeEmotion = async (text, history = []) => {
    try {
        const prompt = `Perform a high-precision deep emotional analysis on the latest spoken text, considering the conversation context provided.

Context (recent exchanges):
${chatContext}

Latest Spoken Text: "${text}"

Goal: Detect deep-seated emotions and underlying psychological states using clinical observation.

Return exactly this JSON structure (no markdown):
{
  "dominantEmotion": "one of: happy|sad|anxious|calm|angry|excited|stressed|neutral|overwhelmed|hopeful|frustrated|fearful|relief",
  "intensity": <number 0-100>,
  "sentimentScore": <number from -1.0 to 1.0>,
  "stressLevel": <number from 0 to 10>,
  "emotions": ["detected", "nuances"],
  "insights": "A therapist-grade reflection or socratic question that invites the user to go deeper.",
  "suggestions": ["3 therapeutic 'homework' or reflective exercises to regulate this specific state"],
  "growthProgress": "Describe the movement (e.g., 'From reactivity to curiosity')",
  "crisisSignals": <true or false>
}  `;

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: 'You are an expert clinical psychologist and emotion analyst. You provide evidence-based, logical, and structured insights.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 600
        });

        const content = response.choices[0]?.message?.content || '{}';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return getDefaultEmotionAnalysis();
    } catch (err) {
        console.error('Deep emotion analysis error:', err.message);
        return getDefaultEmotionAnalysis();
    }
};

/**
 * Generate personalized and categorized stress reduction suggestions
 * @param {Object} context - User context (mood, triggers, history)
 * @returns {Promise<Object>} Categorized suggestions
 */
const generateStressSuggestions = async (context) => {
    try {
        const prompt = `Based on this mental health context, provide a comprehensive set of evidence-based stress reduction strategies using CBT, DBT, and Somatic frameworks.

Current context:
- Primary Emotion: ${context.emotion || 'neutral'}
- Stress Level: ${context.stressLevel || 5}/10
- Recent Triggers: ${context.triggers?.join(', ') || 'none specified'}
- Personal Notes: ${context.notes || 'none'}

Provide exactly 2 high-accuracy suggestions for each category:
1. "immediate" (Somatic/Grounding): Physical actions to stabilize the nervous system now.
2. "mindfulness" (DBT-based): Skills for distress tolerance or emotional regulation.
3. "lifestyle" (Routine): Evidence-based habits to build long-term resilience.
4. "mental" (CBT-based): Logic to challenge cognitive distortions and reframe perspectives.

Return exactly this JSON structure (no markdown):
{
  "immediate": ["Reflective somatic exercise", "Sensory grounding task"],
  "mindfulness": ["Socratic mindfulness prompt", "Distress tolerance tool"],
  "lifestyle": ["Therapeutic routine adjustment", "Boundaries-focused shift"],
  "mental": ["CBT thought-challenging exercise", "ACT-based acceptance prompt"],
  "overallAdvice": "A warm therapeutic interpretation of their path forward"
}`;

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile', // Use higher model for more logic
            messages: [
                { role: 'system', content: 'You are a clinical wellness strategist. You provide evidence-based, logical, and psychologically sound stress management advice.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.2, // Lower temperature for higher accuracy and logic
            max_tokens: 800
        });

        const content = response.choices[0]?.message?.content || '{}';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return getDefaultCategorizedSuggestions();
    } catch (err) {
        console.error('Categorized suggestions generation error:', err.message);
        return getDefaultCategorizedSuggestions();
    }
};

const getDefaultCategorizedSuggestions = () => ({
    immediate: ["Splash cold water on your face", "Take a short brisk walk"],
    mindfulness: ["Practice 4-7-8 breathing", "Do a 5-minute body scan"],
    lifestyle: ["Reduce screen time for 1 hour", "Prioritize tonight's sleep"],
    mental: ["Focus on what's within your control", "Practice positive self-affirmation"],
    overallAdvice: "Be kind to yourself today. Small steps lead to big changes."
});

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
