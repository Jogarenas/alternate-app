#!/usr/bin/env node
const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json({ limit: '1mb' }));

const PORT = process.env.PORT || 5174;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) {
  console.warn('Warning: GEMINI_API_KEY not set. The proxy will reject requests.');
}

app.post('/api/gemini', async (req, res) => {
  if (!GEMINI_KEY) return res.status(500).json({ error: 'Server misconfigured: GEMINI_API_KEY missing' });
  try {
    const { model, system, prompt, responseMimeType, maxTokens } = req.body;
    // Gemini API (Google AI) uses generativelanguage.googleapis.com and x-goog-api-key
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const requestBody = {
      contents: [{
        role: 'user',
        parts: [{ text: system ? `${system}\n\n${prompt}` : prompt }]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: maxTokens || 1024,
        ...(responseMimeType && { responseMimeType })
      }
    };
    if (system) {
      requestBody.systemInstruction = { parts: [{ text: system }] };
      requestBody.contents[0].parts[0].text = prompt;
    }

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_KEY
      },
      body: JSON.stringify(requestBody)
    });
    if (!r.ok) {
      const errBody = await r.text().catch(() => null);
      return res.status(r.status).json({ error: `Gemini error: ${r.status} ${errBody}` });
    }
    const data = await r.json();
    let text = '';
    if (data?.candidates?.[0]?.content?.parts) {
      text = data.candidates[0].content.parts.map(p => p.text || '').join('');
    } else {
      text = JSON.stringify(data);
    }
    return res.json({ text, raw: data });
  } catch (e) {
    console.error('Proxy error', e);
    return res.status(500).json({ error: e.message });
  }
});

// Serve the Vite dev server proxy will be run from project root in dev.
if (process.env.STATIC_SERVE) {
  const dist = path.join(__dirname, '..', 'dist');
  app.use(express.static(dist));
  app.get('*', (req,res)=>res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, ()=>console.log(`Gemini proxy running on http://localhost:${PORT}`));
