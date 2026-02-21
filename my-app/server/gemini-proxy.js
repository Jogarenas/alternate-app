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
    // Build request for Google's Generative API (REST endpoint)
    // This proxy expects the model name like "gemini-2.5-flash-preview-05-20" and returns text output.
    const endpoint = `https://generative.googleapis.com/v1/models/${encodeURIComponent(model)}/generate`;
    const body = {
      temperature: 0.2,
      maxOutputTokens: maxTokens || 1024,
      // Pass helpful context inside "prompt"
      prompt: {
        text: `${system}\n\n${prompt}`
      }
    };

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_KEY}`
      },
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      const errBody = await r.text().catch(()=>null);
      return res.status(r.status).json({ error: `Gemini error: ${r.status} ${errBody}` });
    }
    const data = await r.json();
    // coerce output to a single text blob
    let text = '';
    if (data?.candidates && Array.isArray(data.candidates)) {
      text = data.candidates.map(c=>c?.output?.[0]?.content?.text||c?.content||'').join('\n');
    } else if (data?.output?.[0]?.content) {
      // Some versions return output directly
      const contents = data.output[0].content;
      if (Array.isArray(contents)) text = contents.map(c=>c.text||'').join('');
      else text = contents.text || JSON.stringify(contents);
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
