# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

## Gemini proxy (local development)

This project includes a small Express proxy at `server/gemini-proxy.js` that forwards requests to the Google Generative API (Gemini).

Setup:

1. Create `my-app/.env.local` with your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey) (do NOT put this in client code). The key usually starts with `AIza`.

	- In `my-app/.env.local`: `GEMINI_API_KEY=AIza...your_key_here`
	- Or in shell: `export GEMINI_API_KEY="AIza...your_key_here"`

2. Start the local proxy (in a separate terminal):

	- From `my-app` folder: `npm run start:proxy`

	The proxy will listen on http://localhost:5174 and will respond to POST /api/gemini.

3. Start the React dev server:

	- `npm run dev`

	Vite dev server is configured to proxy `/api/gemini` to the local proxy on port 5174.

If you see a 500 response with `Server misconfigured: GEMINI_API_KEY missing`, add `GEMINI_API_KEY` to `.env.local` or set the env var before starting the proxy.

Security: Keep `GEMINI_API_KEY` secret and do not commit it to source control. For production, implement a serverless endpoint (Vercel/Netlify/AWS Lambda) that stores the key securely.

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
