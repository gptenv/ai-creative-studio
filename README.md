An AI App designed and implemented by Claude Sonnet 4 (with Extended Thinking feature switched on nearly the whole time), with some minimal prompting by Jeremy Carter, and intended to be run as a Claude.ai AI Artifact in the Artifacts Preview pane on https://claude.ai while having the AI Artifacts feature toggled on in your settings.

AI Creative Studio v0.1.x is published as a Claude.ai AI App artifact publicly here: https://claude.ai/public/artifacts/d57fb009-cb96-46f7-b923-37d147e2eede

Follow the link above if you want to try it out. :)

It's some different kinds of `window.claude.completion` agents, with managed context windows, who will collaborate together on creative kinds of response outputs to your prompts, such as writing stories or other. Choose between several different kinds of Claude AI Agents and choose multiple ones and have them collaborate on a single prompt response output, or have them each giving their own independent outputs one-after-another for your prompts. Conversation state is managed and all agents have context windows, and the prompts happen within a proper stateful chat conversation, similar as chatting with Claude directly in an actual conversation thread on the claude.ai web or desktop or mobile chat apps.

The app is currently entirely within this file: [./src/AICreativeStudio.tsx](./src/AICreativeStudio.tsx)

Licensed by the standard MIT License.

Copyright 2025 Jeremy Carter <jeremy@jeremycarter>, Claude Sonnet 4 (web chat LLM) <https://claude.ai>
