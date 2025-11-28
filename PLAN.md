# Project Upgrade Plan

This document outlines the step-by-step plan to upgrade the chatbot project.

## Phase 1: Core Experience Upgrade (High Priority)
Focus: Real-time interaction, better visual presentation, and conversational memory.

- [ ] **Backend: Implement Streaming (SSE)**
    - [ ] Modify `/api/chat` in `server/src/index.js` to set headers for Server-Sent Events (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`).
    - [ ] Update OpenAI API call to use `stream: true`.
    - [ ] Implement logic to pipe chunks to the response as they arrive.
    - [ ] Handle stream completion and errors gracefully.

- [ ] **Frontend: Consume Stream**
    - [ ] Refactor `fetch` call in `client/src/App.jsx` (or relevant component) to use `response.body.getReader()`.
    - [ ] Implement a loop to decode chunks and append to the current message state.
    - [ ] Ensure UI updates smoothly as text arrives.

- [ ] **Frontend: Markdown & Syntax Highlighting**
    - [ ] Install dependencies: `npm install react-markdown remark-gfm react-syntax-highlighter` (in `client`).
    - [ ] Create a `MessageContent` component to render messages.
    - [ ] Configure `react-markdown` to use `remark-gfm` for tables/strikethrough.
    - [ ] Configure code blocks to use `react-syntax-highlighter`.

- [ ] **Context Memory (History)**
    - [ ] Update Frontend state to store full conversation history (not just last message).
    - [ ] Modify API request payload to send `messages` array (last N messages + System Prompt) instead of single prompt.
    - [ ] Update Backend to receive and forward this `messages` array to OpenAI API.

## Phase 2: Security & Production Hardening (Medium Priority)
Focus: Protecting the service and ensuring stability.

- [ ] **Backend: Rate Limiting**
    - [ ] Install `express-rate-limit` in `server`.
    - [ ] Configure a limiter (e.g., 100 requests per 15 mins) in `server/src/index.js`.
    - [ ] Apply limiter to the `/api/chat` route (or globally if appropriate).

- [ ] **Backend: Input Validation**
    - [ ] Install `zod` in `server`.
    - [ ] Define a Zod schema for the chat request body (validating `messages` is an array, content is string, etc.).
    - [ ] Add middleware or inline check to validate request before processing.

- [ ] **Backend: Strict CORS**
    - [ ] Update `cors` configuration in `server/src/index.js`.
    - [ ] Use `process.env.CLIENT_URL` to whitelist the frontend origin.
    - [ ] Ensure `CLIENT_URL` is properly set in `.env` and Cloud Run environment variables.

## Phase 3: Engineering & Architecture Optimization (Low Priority)
Focus: Maintainability and observability.

- [ ] **Backend: TypeScript Migration**
    - [ ] Install `typescript`, `ts-node`, `@types/express`, `@types/node` in `server`.
    - [ ] Initialize `tsconfig.json`.
    - [ ] Rename `index.js` to `index.ts` and fix type errors.
    - [ ] Update `package.json` scripts to build/run TS.

- [ ] **Backend: Structured Logging**
    - [ ] Create a simple logger utility (or use a library like `winston`/`pino` if preferred, but a simple JSON wrapper works for Cloud Run).
    - [ ] Replace `console.log` and `console.error` with `logger.info` and `logger.error`.
    - [ ] Ensure logs are output as JSON strings for Google Cloud Logging to parse severity and fields.
