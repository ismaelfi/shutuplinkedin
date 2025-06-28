#!/usr/bin/env node

const http = require('http');
const url = require('url');

const OLLAMA_ENDPOINT = 'http://127.0.0.1:11434';
const PORT = 3001;

// Enhanced test cases
const testCases = {
    aggressiveBait: "🔥 COMMENT YES if you agree! This will change everything! Tag 3 friends who need to see this! DM me for the secret PDF that 99% of people don't know about! Double tap if you want success! 🔥💪",
    frenchBait: "🔥 COMMENTEZ OUI si vous êtes d'accord ! Taguez 3 amis qui ont besoin de voir ça ! Envoyez-moi un message pour le PDF secret que 99% des gens ne connaissent pas ! 🔥",
    subtleBait: "This simple trick will change your career forever. What do you think? Share your thoughts below and tag someone who needs to see this! 💪 Who agrees?",
    motivationalBait: "Success isn't luck, it's mindset! 💪 Comment YES if you're ready to level up! Double tap if you agree! What's your biggest goal this year? 🔥 Tag 3 people who inspire you!",

    professionalEn: "After analyzing 5 years of user engagement data across 50+ SaaS products, I've identified three key patterns that predict long-term product success. Here's my detailed breakdown of the methodology, statistical significance, and actionable insights for product managers and growth teams.",
    educationalEn: "Understanding machine learning fundamentals: A comprehensive technical guide to supervised vs unsupervised learning algorithms, with mathematical foundations, implementation examples in Python, TensorFlow, and real-world applications in data science and AI development.",
    technicalEn: "Deep dive into React 18's concurrent rendering architecture: exploring the new automatic batching behavior, transition APIs, Suspense boundaries, and how they interact with server-side rendering in Next.js 13 applications. Performance implications and migration strategies included.",
    genuineMotivational: "Starting my own company taught me that resilience isn't about avoiding failure—it's about learning from each setback and adapting your strategy. Every challenge became a stepping stone toward better decision-making. The entrepreneurship journey is demanding but incredibly rewarding when you stay focused on your mission and values."
};

// Generate Ollama prompt
function generateOllamaPrompt(text) {
    return `Analyze this LinkedIn post for engagement bait patterns. Respond ONLY with valid JSON.

POST: "${text}"

Analyze for:
- Explicit engagement requests ("comment YES", "tag friends", "DM me")
- Manipulation tactics (urgency, scarcity, FOMO)
- Genuine professional/educational value
- Multi-language patterns

Respond with JSON:
{
  "confidence": <0.0-1.0>,
  "classification": "bait" | "genuine",
  "reasoning": "<brief explanation>"
}

Examples:
- Confidence 0.8+: Clear manipulation
- Confidence 0.4-0.7: Some bait patterns
- Confidence 0.0-0.4: Genuine content

JSON only:`;
}

// Test Ollama classification
async function testOllamaClassification(text, model = 'llama3.2:1b') {
    const startTime = Date.now();

    try {
        const prompt = generateOllamaPrompt(text);

        const response = await fetch(`${OLLAMA_ENDPOINT}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.1,
                    num_predict: 200,
                    top_p: 0.9
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const responseTime = Date.now() - startTime;

        if (!data.response) {
            throw new Error('No response content from Ollama');
        }

        // Parse the JSON response from Ollama
        let classification;
        try {
            // Clean up the response
            let jsonStr = data.response.trim();

            // Try to extract JSON if it's embedded in text
            const jsonMatch = jsonStr.match(/\{[^}]*\}/);
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
            }

            classification = JSON.parse(jsonStr);
        } catch (parseError) {
            console.log(`JSON parse failed, using fallback parsing`);

            // Fallback parsing
            const confidenceMatch = data.response.match(/confidence["\s:]*([0-9.]+)/i);
            const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;

            const baitMatch = /bait|engagement.bait/i.test(data.response);
            const genuineMatch = /genuine|legitimate/i.test(data.response);

            let classificationResult;
            if (baitMatch && !genuineMatch) {
                classificationResult = 'bait';
            } else if (genuineMatch && !baitMatch) {
                classificationResult = 'genuine';
            } else {
                classificationResult = confidence > 0.5 ? 'bait' : 'genuine';
            }

            classification = {
                confidence: confidence,
                reasoning: data.response.substring(0, 200) + '...',
                classification: classificationResult
            };
        }

        // Validate and normalize
        classification.confidence = Math.max(0, Math.min(1, classification.confidence || 0.5));
        classification.classification = classification.classification || (classification.confidence > 0.5 ? 'bait' : 'genuine');

        return {
            success: true,
            confidence: classification.confidence,
            classification: classification.classification,
            reasoning: classification.reasoning,
            responseTime: responseTime,
            model: model,
            rawResponse: data.response
        };

    } catch (error) {
        return {
            success: false,
            error: error.message,
            responseTime: Date.now() - startTime
        };
    }
}

// Simple rules-based classification for comparison
function rulesBasedClassification(text) {
    let score = 0;
    const factors = [];

    // Engagement bait patterns
    if (/comment\s+(yes|if|below)/gi.test(text)) {
        score += 3;
        factors.push("Direct engagement request");
    }

    if (/tag\s+(someone|friend|3)/gi.test(text)) {
        score += 3;
        factors.push("Tag request");
    }

    if (/dm\s+me|message\s+me/gi.test(text)) {
        score += 2;
        factors.push("Direct message request");
    }

    if (/share\s+(this|if)/gi.test(text)) {
        score += 2;
        factors.push("Share request");
    }

    // Emotional manipulation
    if (/🔥|💪|❤️‍🔥/g.test(text)) {
        score += 1;
        factors.push("High-engagement emojis");
    }

    if (/secret|99%|nobody knows|will change everything/gi.test(text)) {
        score += 2;
        factors.push("Scarcity/exclusivity language");
    }

    // Professional content indicators (negative score)
    if (/analysis|methodology|research|data|study|implementation/gi.test(text)) {
        score -= 2;
        factors.push("Professional content indicators");
    }

    if (text.length > 200 && !(/comment|tag|share/gi.test(text))) {
        score -= 1;
        factors.push("Long-form content without engagement bait");
    }

    const confidence = Math.max(0, Math.min(1, score / 10));

    return {
        confidence: confidence,
        classification: confidence > 0.5 ? 'bait' : 'genuine',
        reasoning: factors.length > 0 ? factors.join('; ') : 'Standard content analysis',
        score: score,
        factors: factors
    };
}

// HTTP server to serve results
const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);

        if (parsedUrl.pathname === '/test' && req.method === 'GET') {
        const testCase = parsedUrl.query.case || 'aggressiveBait';
        const model = parsedUrl.query.model || 'llama3.2:1b';

        const text = testCases[testCase];
        if (!text) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid test case' }));
            return;
        }

        console.log(`Testing case: ${testCase} with model: ${model}`);
        console.log(`Text: ${text.substring(0, 100)}...`);

        // Run both classifications
        const [ollamaResult, rulesResult] = await Promise.all([
            testOllamaClassification(text, model),
            Promise.resolve(rulesBasedClassification(text))
        ]);

        const results = {
            testCase: testCase,
            text: text,
            ollama: ollamaResult,
            rules: rulesResult,
            timestamp: new Date().toISOString()
        };

        console.log(`Results: Ollama=${ollamaResult.success ? ollamaResult.confidence.toFixed(2) : 'ERROR'}, Rules=${rulesResult.confidence.toFixed(2)}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results, null, 2));

    } else if (parsedUrl.pathname === '/test' && req.method === 'POST') {
        // Handle custom text classification
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { text, model = 'llama3.2:1b' } = JSON.parse(body);

                if (!text) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Text is required' }));
                    return;
                }

                console.log(`Testing custom text with model: ${model}`);
                console.log(`Text: ${text.substring(0, 100)}...`);

                // Run both classifications
                const [ollamaResult, rulesResult] = await Promise.all([
                    testOllamaClassification(text, model),
                    Promise.resolve(rulesBasedClassification(text))
                ]);

                const results = {
                    text: text,
                    ollama: ollamaResult,
                    rules: rulesResult,
                    timestamp: new Date().toISOString()
                };

                console.log(`Results: Ollama=${ollamaResult.success ? ollamaResult.confidence.toFixed(2) : 'ERROR'}, Rules=${rulesResult.confidence.toFixed(2)}`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(results, null, 2));

            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });

    } else if (parsedUrl.pathname === '/test-all' && req.method === 'GET') {
        const model = parsedUrl.query.model || 'llama3.2:1b';

        console.log(`Running all tests with model: ${model}`);

        const allResults = {};

        for (const [testCase, text] of Object.entries(testCases)) {
            console.log(`Testing: ${testCase}`);

            const [ollamaResult, rulesResult] = await Promise.all([
                testOllamaClassification(text, model),
                Promise.resolve(rulesBasedClassification(text))
            ]);

            allResults[testCase] = {
                text: text,
                ollama: ollamaResult,
                rules: rulesResult
            };
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(allResults, null, 2));

    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Ollama test server running on http://localhost:${PORT}`);
    console.log('');
    console.log('Available endpoints:');
    console.log(`  GET /test?case=aggressiveBait&model=llama3.2:1b`);
    console.log(`  GET /test-all?model=llama3.2:1b`);
    console.log('');
    console.log('Available test cases:', Object.keys(testCases).join(', '));
    console.log('');
    console.log('Example usage:');
    console.log(`  curl "http://localhost:${PORT}/test?case=aggressiveBait"`);
    console.log(`  curl "http://localhost:${PORT}/test-all" | jq .`);
});
