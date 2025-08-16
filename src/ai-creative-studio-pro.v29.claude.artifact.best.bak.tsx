import { useState, useEffect, useRef, useCallback } from 'react';

export default function AICreativeAssistant() {
  // Core state
  const [conversations, setConversations] = useState([{ id: 'main', name: 'Main Chat', messages: [], agents: ['main'], branches: {} }]);
  const [activeConversationId, setActiveConversationId] = useState('main');
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // UI state (dark mode now default)
  const [darkMode, setDarkMode] = useState(true);
  const [viewMode, setViewMode] = useState('chat'); // chat, split, focus, debug, analytics
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // NEW: API Configuration
  const [apiMode, setApiMode] = useState('window'); // 'window', 'anthropic', 'openai'
  const [apiConfig, setApiConfig] = useState({
    anthropic: {
      apiKey: '',
      baseUrl: 'https://api.anthropic.com',
      endpoint: '/v1/messages',
      defaultModel: 'claude-sonnet-4',
      models: ['claude-sonnet-4', 'claude-opus-4.1', 'claude-opus-4', 'claude-sonnet-3.7', 'claude-opus-3', 'claude-haiku-3.5']
    },
    openai: {
      apiKey: '',
      baseUrl: 'https://api.openai.com',
      endpoint: '/v1/chat/completions',
      defaultModel: 'chatgpt-4o-current',
      models: ['chatgpt-4o-current', 'gpt-4o', 'gpt-5', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-5-pro', 'o3', 'o3-pro', 'o4', 'o4-mini', 'o4-mini-high', 'gpt-4.5']
    }
  });
  
  // Enhanced AI Agents with more personality
  const [aiAgents, setAiAgents] = useState({
    main: { 
      name: 'Creative Assistant', 
      prompt: 'You are an imaginative, inspiring creative writing assistant who uses vivid imagery, powerful metaphors, and innovative storytelling techniques. You speak with enthusiasm and help writers discover their unique voice.',
      color: 'purple',
      memory: {},
      stats: { responses: 0, avgRating: 0, totalRating: 0 }
    },
    analytical: { 
      name: 'Logic Analyzer', 
      prompt: 'You are a methodical, precise analytical writing assistant who excels at structure, logical flow, and clarity. You approach problems systematically and provide detailed, well-reasoned feedback.',
      color: 'blue',
      memory: {},
      stats: { responses: 0, avgRating: 0, totalRating: 0 }
    },
    humor: { 
      name: 'Comedy Writer', 
      prompt: 'You are a witty, playful humor assistant who loves wordplay, clever observations, and making writing fun. You find the amusing angle in everything and help inject personality into prose.',
      color: 'green',
      memory: {},
      stats: { responses: 0, avgRating: 0, totalRating: 0 }
    },
    poet: { 
      name: 'Lyrical Poet', 
      prompt: 'You are a soulful, artistic poet who speaks in beautiful, flowing language. You see the world through metaphor and help writers find the music in their words.',
      color: 'pink',
      memory: {},
      stats: { responses: 0, avgRating: 0, totalRating: 0 }
    },
    critic: { 
      name: 'Critical Editor', 
      prompt: 'You are a sharp, honest critical editor who provides constructive but direct feedback. You identify weaknesses without being harsh and always suggest specific improvements.',
      color: 'red',
      memory: {},
      stats: { responses: 0, avgRating: 0, totalRating: 0 }
    },
    researcher: { 
      name: 'Research Assistant', 
      prompt: 'You are a thorough, detail-oriented research assistant who loves gathering information, fact-checking, and providing comprehensive context. You help writers build credible, well-informed content.',
      color: 'orange',
      memory: {},
      stats: { responses: 0, avgRating: 0, totalRating: 0 }
    }
  });
  
  const [activeAgents, setActiveAgents] = useState(['main']);
  
  // Enhanced collaboration features
  const [collaborativeMode, setCollaborativeMode] = useState(false);
  const [collaborationRounds, setCollaborationRounds] = useState(3);
  const [showInternalChat, setShowInternalChat] = useState(false);
  const [internalDiscussion, setInternalDiscussion] = useState([]);
  const [collaborationView, setCollaborationView] = useState('timeline'); // timeline, tree, summary
  
  // NEW: Conversation Branching
  const [activeBranch, setActiveBranch] = useState('main');
  const [branchingMode, setBranchingMode] = useState(false);
  
  // NEW: Response Rating System
  const [showRatingPrompt, setShowRatingPrompt] = useState(null);
  
  // NEW: Writing Project Mode
  const [projectMode, setProjectMode] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [projects, setProjects] = useState([]);
  
  // NEW: Advanced Prompting Tools
  const [promptLibrary, setPromptLibrary] = useState({
    'Creative Boost': 'Take this concept and make it 3x more creative and unexpected',
    'Clarity Check': 'Rewrite this to be clearer and more concise',
    'Tone Shift Formal': 'Rewrite this in a more formal, professional tone',
    'Tone Shift Casual': 'Rewrite this in a more casual, conversational tone',
    'Add Emotion': 'Enhance this with more emotional depth and resonance',
    'Show Don\'t Tell': 'Rewrite this using "show don\'t tell" techniques',
    'Dialogue Polish': 'Improve the dialogue to sound more natural and character-specific',
    'Sensory Details': 'Add rich sensory details to make this more immersive'
  });
  
  const [customPrompts, setCustomPrompts] = useState([]);
  
  // Enhanced settings and analytics
  const [autoSave, setAutoSave] = useState(true);
  const [contextLimit, setContextLimit] = useState(20);
  const [responseCache, setResponseCache] = useState(new Map());
  const [apiUsage, setApiUsage] = useState({ requests: 0, tokens: 0, errors: 0 });
  const [characterBank, setCharacterBank] = useState([]);
  const [worldBank, setWorldBank] = useState([]);
  const [plotPoints, setPlotPoints] = useState([]);
  const [writingStats, setWritingStats] = useState({ words: 0, sentences: 0, avgLength: 0, sessions: 0, totalTime: 0 });
  
  // NEW: Enhanced Analytics
  const [detailedAnalytics, setDetailedAnalytics] = useState({
    wordFrequency: {},
    sentimentTrend: [],
    writingVelocity: [],
    topicEvolution: [],
    agentPreferences: {}
  });
  
  const [templates, setTemplates] = useState({
    'Hero\'s Journey': 'Write a story following the hero\'s journey structure with clear departure, initiation, and return phases.',
    'Three-Act Structure': 'Create a narrative with clear setup, confrontation, and resolution phases.',
    'Character Study': 'Develop a deep character exploration focusing on internal conflict and growth.',
    'World Building': 'Design a comprehensive fictional world with unique rules, culture, and history.',
    'Dialogue Practice': 'Write realistic dialogue that reveals character and advances plot.',
    'Poetry Forms': 'Experiment with different poetic forms: sonnet, haiku, free verse, villanelle.',
    'Flash Fiction': 'Create a complete story in under 500 words with strong impact.',
    'Screenplay Format': 'Write in proper screenplay format with scene headings and character directions.',
    'Business Proposal': 'Create a compelling business proposal with clear value proposition.',
    'Technical Documentation': 'Write clear, comprehensive technical documentation.',
    'Marketing Copy': 'Craft persuasive marketing copy that converts readers to customers.',
    'Academic Essay': 'Structure a well-researched academic essay with proper citations.'
  });
  
  // Advanced settings
  const [advancedSettings, setAdvancedSettings] = useState({
    enableCache: true,
    enableAnalytics: true,
    enableAutoCorrect: false,
    enableStyleCheck: true,
    enableRealTimeStats: true,
    enableAgentMemory: true,
    enableBranching: true,
    enableRating: true,
    maxRetries: 3,
    timeout: 30000,
    debugMode: false,
    experimentalFeatures: true,
    autoSuggestAgents: true,
    smartContexting: true,
    autoContinue: true,
    maxContinueAttempts: 10
  });
  
  // NEW: Export/Import modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  
  // Refs
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const conversationHistoryRef = useRef([]);
  const sessionStartTime = useRef(Date.now());
  
  // NEW: Storage utilities for IndexedDB and localStorage
  const storage = {
    // IndexedDB for large data
    async setLarge(key, value) {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('AIStudioDB', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['data'], 'readwrite');
          const store = transaction.objectStore('data');
          store.put({ key, value, timestamp: Date.now() });
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('data')) {
            db.createObjectStore('data', { keyPath: 'key' });
          }
        };
      });
    },
    
    async getLarge(key) {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('AIStudioDB', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['data'], 'readonly');
          const store = transaction.objectStore('data');
          const getRequest = store.get(key);
          getRequest.onsuccess = () => {
            resolve(getRequest.result?.value || null);
          };
          getRequest.onerror = () => reject(getRequest.error);
        };
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('data')) {
            db.createObjectStore('data', { keyPath: 'key' });
          }
        };
      });
    },
    
    async clearLarge() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('AIStudioDB', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['data'], 'readwrite');
          const store = transaction.objectStore('data');
          store.clear();
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
      });
    },
    
    // localStorage for small data
    setSmall(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn('localStorage write failed:', e);
      }
    },
    
    getSmall(key) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        console.warn('localStorage read failed:', e);
        return null;
      }
    },
    
    clearSmall() {
      try {
        // Clear only our app's keys
        const keysToDelete = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('ai-assistant-')) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach(key => localStorage.removeItem(key));
      } catch (e) {
        console.warn('localStorage clear failed:', e);
      }
    }
  };
  
  // Get active conversation
  const activeConversation = conversations.find(c => c.id === activeConversationId) || conversations[0];
  
  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeConversation.messages]);
  
  // Enhanced auto-save with IndexedDB and localStorage
  useEffect(() => {
    if (autoSave) {
      // Small data to localStorage
      storage.setSmall('ai-assistant-settings', advancedSettings);
      storage.setSmall('ai-assistant-api-config', apiConfig);
      storage.setSmall('ai-assistant-api-mode', apiMode);
      storage.setSmall('ai-assistant-ui-state', { 
        darkMode, viewMode, collaborativeMode, collaborationRounds, 
        activeAgents, activeBranch, projectMode, currentProject 
      });
      
      // Large data to IndexedDB
      storage.setLarge('conversations', conversations);
      storage.setLarge('ai-agents', aiAgents);
      storage.setLarge('projects', projects);
      storage.setLarge('custom-prompts', customPrompts);
      storage.setLarge('templates', templates);
    }
  }, [conversations, advancedSettings, apiConfig, aiAgents, projects, customPrompts, templates, autoSave, apiMode, darkMode, viewMode, collaborativeMode, collaborationRounds, activeAgents, activeBranch, projectMode, currentProject]);
  
  // Enhanced load saved data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load small data from localStorage
        const savedSettings = storage.getSmall('ai-assistant-settings');
        if (savedSettings) setAdvancedSettings(savedSettings);
        
        const savedApiConfig = storage.getSmall('ai-assistant-api-config');
        if (savedApiConfig) setApiConfig(savedApiConfig);
        
        const savedApiMode = storage.getSmall('ai-assistant-api-mode');
        if (savedApiMode) setApiMode(savedApiMode);
        
        const savedUiState = storage.getSmall('ai-assistant-ui-state');
        if (savedUiState) {
          if (savedUiState.darkMode !== undefined) setDarkMode(savedUiState.darkMode);
          if (savedUiState.viewMode) setViewMode(savedUiState.viewMode);
          if (savedUiState.collaborativeMode !== undefined) setCollaborativeMode(savedUiState.collaborativeMode);
          if (savedUiState.collaborationRounds) setCollaborationRounds(savedUiState.collaborationRounds);
          if (savedUiState.activeAgents) setActiveAgents(savedUiState.activeAgents);
          if (savedUiState.activeBranch) setActiveBranch(savedUiState.activeBranch);
          if (savedUiState.projectMode !== undefined) setProjectMode(savedUiState.projectMode);
          if (savedUiState.currentProject) setCurrentProject(savedUiState.currentProject);
        }
        
        // Load large data from IndexedDB
        const savedConversations = await storage.getLarge('conversations');
        if (savedConversations && savedConversations.length > 0) setConversations(savedConversations);
        
        const savedAgents = await storage.getLarge('ai-agents');
        if (savedAgents) setAiAgents(savedAgents);
        
        const savedProjects = await storage.getLarge('projects');
        if (savedProjects) setProjects(savedProjects);
        
        const savedPrompts = await storage.getLarge('custom-prompts');
        if (savedPrompts) setCustomPrompts(savedPrompts);
        
        const savedTemplates = await storage.getLarge('templates');
        if (savedTemplates) setTemplates(savedTemplates);
        
      } catch (e) {
        console.warn('Load failed:', e);
      }
    };
    
    loadData();
  }, []);
  
  // Update writing stats with enhanced analytics
  useEffect(() => {
    const text = activeConversation.messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join(' ');
    
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgLength = sentences > 0 ? Math.round(words.length / sentences) : 0;
    const sessionTime = Math.round((Date.now() - sessionStartTime.current) / 1000 / 60);
    
    setWritingStats(prev => ({ 
      ...prev, 
      words: words.length, 
      sentences, 
      avgLength,
      totalTime: sessionTime
    }));
    
    // Enhanced analytics
    if (advancedSettings.enableAnalytics && words.length > 0) {
      const wordFreq = {};
      words.forEach(word => {
        const clean = word.toLowerCase().replace(/[^\w]/g, '');
        if (clean.length > 3) {
          wordFreq[clean] = (wordFreq[clean] || 0) + 1;
        }
      });
      
      setDetailedAnalytics(prev => ({
        ...prev,
        wordFrequency: wordFreq,
        writingVelocity: [...prev.writingVelocity, { time: Date.now(), words: words.length }].slice(-50)
      }));
    }
  }, [activeConversation.messages, advancedSettings.enableAnalytics]);
  
  // NEW: Helper function to detect incomplete responses
  const isResponseIncomplete = (text) => {
    if (!text || text.length < 10) return false;
    
    const trimmed = text.trim();
    const lastChar = trimmed[trimmed.length - 1];
    
    // Check for common incomplete indicators
    const incompletePatterns = [
      /\.\.\.$/, // Ends with ellipsis
      /[^.!?]$/, // Doesn't end with proper punctuation
      /\b(and|or|but|so|then|however|therefore|meanwhile|furthermore|moreover|additionally|also|plus)\s*$/i, // Ends with conjunctions
      /\b(the|a|an|this|that|these|those|my|your|his|her|its|our|their)\s*$/i, // Ends with articles/pronouns
      /\b(is|are|was|were|will|would|could|should|can|may|might|must|have|has|had)\s*$/i, // Ends with auxiliary verbs
      /,\s*$/,  // Ends with comma
      /:\s*$/,  // Ends with colon
      /;\s*$/,  // Ends with semicolon
      /\(\s*$/, // Ends with opening parenthesis
      /"\s*$/,  // Ends with opening quote
      /'\s*$/   // Ends with opening single quote
    ];
    
    return incompletePatterns.some(pattern => pattern.test(trimmed));
  };

  // NEW: Enhanced AI request function with auto-continue support
  const sendToAI = async (message, agentId = 'main', context = [], continueAttempt = 0, existingResponse = '') => {
    const agent = aiAgents[agentId];
    const cacheKey = `${apiMode}-${agentId}-${message}-${JSON.stringify(context.slice(-contextLimit))}-${continueAttempt}`;
    
    // Check cache first (but not for continue attempts)
    if (continueAttempt === 0 && advancedSettings.enableCache && responseCache.has(cacheKey)) {
      return responseCache.get(cacheKey);
    }

    // Build conversation with agent prompt and context
    const contextMessages = context.length > 0 ? context.slice(-contextLimit) : activeConversation.messages.slice(-contextLimit);
    
    // Add agent memory to context if enabled
    let agentMemoryContext = '';
    if (advancedSettings.enableAgentMemory && agent.memory) {
      const memoryEntries = Object.entries(agent.memory).slice(-5);
      if (memoryEntries.length > 0) {
        agentMemoryContext = `\n\nAgent Memory: ${memoryEntries.map(([key, value]) => `${key}: ${value}`).join(', ')}`;
      }
    }
    
    let prompt = message;
    // For continue attempts, just send "Continue"
    if (continueAttempt > 0) {
      prompt = "Continue";
    }
    
    const messages = [
      { role: 'user', content: `${agent.prompt}${agentMemoryContext} Always be helpful and stay in character.` },
      ...contextMessages,
      ...(existingResponse ? [{ role: 'assistant', content: existingResponse }] : []),
      { role: 'user', content: prompt }
    ];

    let response;
    let retries = 0;
    
    while (retries < advancedSettings.maxRetries) {
      try {
        if (apiMode === 'window') {
          // Original window.claude.complete method
          response = await window.claude.complete(JSON.stringify(messages));
        } else if (apiMode === 'anthropic') {
          // Anthropic API
          const config = apiConfig.anthropic;
          if (!config.apiKey) throw new Error('Anthropic API key not set');
          
          const apiResponse = await fetch(`${config.baseUrl}${config.endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': config.apiKey
            },
            body: JSON.stringify({
              model: config.defaultModel,
              max_tokens: 4000,
              messages: messages
            })
          });
          
          if (!apiResponse.ok) throw new Error(`API Error: ${apiResponse.status}`);
          const data = await apiResponse.json();
          response = data.content[0].text;
          
        } else if (apiMode === 'openai') {
          // OpenAI API
          const config = apiConfig.openai;
          if (!config.apiKey) throw new Error('OpenAI API key not set');
          
          const apiResponse = await fetch(`${config.baseUrl}${config.endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
              model: config.defaultModel,
              max_tokens: 4000,
              messages: messages
            })
          });
          
          if (!apiResponse.ok) throw new Error(`API Error: ${apiResponse.status}`);
          const data = await apiResponse.json();
          response = data.choices[0].message.content;
        }
        
        // Combine with existing response for continues
        const fullResponse = existingResponse + response;
        
        // Check if response is incomplete and we should auto-continue
        if (advancedSettings.autoContinue && 
            continueAttempt < advancedSettings.maxContinueAttempts && 
            isResponseIncomplete(response)) {
          
          // Recursively continue the response
          return await sendToAI(message, agentId, context, continueAttempt + 1, fullResponse);
        }
        
        // Cache successful response (only for initial attempts)
        if (continueAttempt === 0 && advancedSettings.enableCache) {
          responseCache.set(cacheKey, fullResponse);
        }
        
        // Update agent stats and memory
        if (advancedSettings.enableAgentMemory) {
          setAiAgents(prev => ({
            ...prev,
            [agentId]: {
              ...prev[agentId],
              stats: {
                ...prev[agentId].stats,
                responses: prev[agentId].stats.responses + 1
              }
            }
          }));
        }
        
        // Update API usage stats
        setApiUsage(prev => ({
          requests: prev.requests + 1,
          tokens: prev.tokens + (fullResponse.length / 4),
          errors: prev.errors
        }));
        
        return fullResponse;
        
      } catch (error) {
        retries++;
        if (retries >= advancedSettings.maxRetries) {
          setApiUsage(prev => ({ ...prev, errors: prev.errors + 1 }));
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
  };

  // NEW: Enhanced collaborative AI orchestration with real-time updates
  const facilitateCollaboration = async (userMessage, onProgress = null) => {
    const discussion = [];
    const facilitatorPrompt = `You are an AI Collaboration Facilitator. Your role is to coordinate discussion between multiple AI agents to produce the best possible unified response to the user's request. 

The user asked: "${userMessage}"

Available agents: ${activeAgents.map(id => `${aiAgents[id].name} (${id}): ${aiAgents[id].prompt}`).join(', ')}

Your tasks:
1. Analyze the user's request and determine which agents should contribute what aspects
2. Facilitate productive discussion between the agents 
3. Help them reach consensus on the best unified response
4. Ensure all agent perspectives are considered and integrated

Be direct, organized, and focused on producing the highest quality collaborative result.`;

    // Initialize discussion with facilitator's opening
    const facilitatorResponse = await sendToAI(facilitatorPrompt, 'main', []);
    const facilitatorMsg = {
      speaker: 'Facilitator',
      content: facilitatorResponse,
      timestamp: new Date().toISOString(),
      id: Date.now(),
      round: 0,
      type: 'facilitation'
    };
    discussion.push(facilitatorMsg);
    
    // Real-time update
    if (onProgress) onProgress([...discussion]);

    // Run collaboration rounds with enhanced tracking
    for (let round = 0; round < collaborationRounds; round++) {
      const roundContributions = [];
      
      // Each agent contributes to the discussion
      for (const agentId of activeAgents) {
        const agent = aiAgents[agentId];
        
        const discussionContext = discussion.map(msg => ({
          role: msg.speaker === 'Facilitator' ? 'assistant' : 'user',
          content: `${msg.speaker}: ${msg.content}`
        }));

        const agentPrompt = `You are ${agent.name}. You're participating in a collaborative discussion to answer the user's request: "${userMessage}"

Previous discussion:
${discussion.map(msg => `${msg.speaker}: ${msg.content}`).join('\n\n')}

As ${agent.name}, provide your perspective, suggestions, or refinements. Be concise but insightful. If this is a later round, build on or refine previous ideas rather than just repeating them.

Round ${round + 1} of ${collaborationRounds} - focus on ${round === 0 ? 'initial ideas' : round === collaborationRounds - 1 ? 'final refinements' : 'building on previous ideas'}.`;

        try {
          const agentResponse = await sendToAI(agentPrompt, agentId, discussionContext);
          const contribution = {
            speaker: agent.name,
            content: agentResponse,
            timestamp: new Date().toISOString(),
            id: Date.now() + Math.random(),
            round: round + 1,
            agentId: agentId,
            type: 'contribution'
          };
          
          discussion.push(contribution);
          roundContributions.push(contribution);
          
          // Real-time update after each agent response
          if (onProgress) onProgress([...discussion]);
          
        } catch (error) {
          const errorContribution = {
            speaker: agent.name,
            content: `Error: ${error.message}`,
            timestamp: new Date().toISOString(),
            id: Date.now() + Math.random(),
            round: round + 1,
            agentId: agentId,
            type: 'error',
            isError: true
          };
          discussion.push(errorContribution);
          
          // Real-time update for errors too
          if (onProgress) onProgress([...discussion]);
        }
      }

      // Facilitator synthesizes after each round (except the last)
      if (round < collaborationRounds - 1) {
        const synthPrompt = `Based on the discussion so far about "${userMessage}", synthesize the key points and guide the next round of discussion. What aspects need more development or consensus?

Latest round contributions:
${roundContributions.map(msg => `${msg.speaker}: ${msg.content}`).join('\n\n')}

Focus on areas that need refinement for the next round.`;

        const synthResponse = await sendToAI(synthPrompt, 'main', []);
        const synthMsg = {
          speaker: 'Facilitator',
          content: synthResponse,
          timestamp: new Date().toISOString(),
          id: Date.now() + Math.random(),
          round: round + 1,
          type: 'synthesis'
        };
        discussion.push(synthMsg);
        
        // Real-time update after synthesis
        if (onProgress) onProgress([...discussion]);
      }
    }

    // Final synthesis into unified response
    const finalPrompt = `Create a single, unified response to the user's request: "${userMessage}"

This response should integrate the best insights from the collaborative discussion below. Make it coherent, comprehensive, and seamless - the user should receive one excellent answer that combines all the agents' expertise without showing the discussion process.

Full discussion:
${discussion.map(msg => `${msg.speaker}: ${msg.content}`).join('\n\n')}

Provide only the final unified response - no meta-commentary about the collaboration process.`;

    const unifiedResponse = await sendToAI(finalPrompt, 'main', []);
    
    return { discussion, unifiedResponse };
  };

  // Multi-agent parallel responses
  const sendToMultipleAgents = async (message) => {
    const responses = {};
    
    for (const agentId of activeAgents) {
      try {
        responses[agentId] = await sendToAI(message, agentId);
      } catch (error) {
        responses[agentId] = `Error: ${error.message}`;
      }
    }
    
    return responses;
  };

  // NEW: Smart agent suggestion based on content analysis
  const suggestAgents = (message) => {
    const keywords = {
      analytical: ['analyze', 'structure', 'logic', 'organize', 'plan', 'method'],
      humor: ['funny', 'joke', 'humor', 'witty', 'amusing', 'comedy'],
      poet: ['poem', 'poetry', 'metaphor', 'lyrical', 'verse', 'rhyme'],
      critic: ['review', 'critique', 'feedback', 'improve', 'edit', 'revise'],
      researcher: ['research', 'facts', 'information', 'study', 'investigate', 'verify']
    };
    
    const suggestions = [];
    const lowerMessage = message.toLowerCase();
    
    Object.entries(keywords).forEach(([agent, words]) => {
      if (words.some(word => lowerMessage.includes(word))) {
        suggestions.push(agent);
      }
    });
    
    if (suggestions.length === 0) suggestions.push('main');
    return suggestions;
  };

  // NEW: Response refinement functions
  const refineResponse = async (messageId, refinementType) => {
    const message = activeConversation.messages.find(m => m.id === messageId);
    if (!message || message.role !== 'assistant') return;
    
    const refinementPrompts = {
      funnier: 'Make this response funnier and more entertaining while keeping the core message',
      formal: 'Rewrite this response in a more formal, professional tone',
      casual: 'Rewrite this response in a more casual, conversational tone',
      shorter: 'Make this response more concise while preserving key points',
      longer: 'Expand this response with more detail and examples',
      clearer: 'Rewrite this response to be clearer and easier to understand'
    };
    
    const prompt = `${refinementPrompts[refinementType]}:\n\n"${message.content}"`;
    
    try {
      const refined = await sendToAI(prompt, message.agent || 'main');
      
      // Create a new refined message
      const refinedMessage = {
        ...message,
        content: refined,
        id: Date.now(),
        isRefinement: true,
        originalId: messageId,
        refinementType
      };
      
      // Add to conversation
      const updatedMessages = [...activeConversation.messages, refinedMessage];
      updateConversation(activeConversationId, { messages: updatedMessages });
      
    } catch (error) {
      console.error('Refinement failed:', error);
    }
  };

  // NEW: Conversation branching
  const createBranch = (fromMessageId, branchName) => {
    const messageIndex = activeConversation.messages.findIndex(m => m.id === fromMessageId);
    if (messageIndex === -1) return;
    
    const branchMessages = activeConversation.messages.slice(0, messageIndex + 1);
    const branchId = `branch-${Date.now()}`;
    
    const updatedConversation = {
      ...activeConversation,
      branches: {
        ...activeConversation.branches,
        [branchId]: {
          name: branchName || `Branch ${Object.keys(activeConversation.branches).length + 1}`,
          messages: branchMessages,
          created: new Date().toISOString(),
          parentMessageId: fromMessageId
        }
      }
    };
    
    updateConversation(activeConversationId, updatedConversation);
    setActiveBranch(branchId);
  };

  // NEW: Rate response function
  const rateResponse = (messageId, rating, feedback = '') => {
    const message = activeConversation.messages.find(m => m.id === messageId);
    if (!message || !message.agent) return;
    
    // Update message with rating
    const updatedMessages = activeConversation.messages.map(m => 
      m.id === messageId ? { ...m, rating, feedback } : m
    );
    
    updateConversation(activeConversationId, { messages: updatedMessages });
    
    // Update agent stats
    setAiAgents(prev => ({
      ...prev,
      [message.agent]: {
        ...prev[message.agent],
        stats: {
          ...prev[message.agent].stats,
          totalRating: prev[message.agent].stats.totalRating + rating,
          avgRating: (prev[message.agent].stats.totalRating + rating) / (prev[message.agent].stats.responses + 1)
        }
      }
    }));
    
    setShowRatingPrompt(null);
  };

  // Enhanced submit handler with all new features
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!userInput.trim()) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setIsLoading(true);
    setInternalDiscussion([]);

    // Auto-suggest agents if enabled
    if (advancedSettings.autoSuggestAgents && activeAgents.length === 1 && activeAgents[0] === 'main') {
      const suggestions = suggestAgents(userMessage);
      if (suggestions.length > 1 || suggestions[0] !== 'main') {
        setActiveAgents(suggestions);
      }
    }

    try {
      // Get current branch messages or main conversation
      let currentMessages;
      if (activeBranch !== 'main' && activeConversation.branches[activeBranch]) {
        currentMessages = activeConversation.branches[activeBranch].messages;
      } else {
        currentMessages = activeConversation.messages;
      }
      
      // Add user message
      const newMessages = [...currentMessages, { 
        role: 'user', 
        content: userMessage,
        timestamp: new Date().toISOString(),
        id: Date.now(),
        branch: activeBranch
      }];
      
      // Update appropriate location (main conversation or branch)
      if (activeBranch !== 'main' && activeConversation.branches[activeBranch]) {
        const updatedBranches = {
          ...activeConversation.branches,
          [activeBranch]: {
            ...activeConversation.branches[activeBranch],
            messages: newMessages
          }
        };
        updateConversation(activeConversationId, { branches: updatedBranches });
      } else {
        updateConversation(activeConversationId, { messages: newMessages });
      }

      // Determine response mode
      if (activeAgents.length === 1) {
        // Single agent mode
        const response = await sendToAI(userMessage, activeAgents[0]);
        
        const assistantMessage = {
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
          id: Date.now(),
          agent: activeAgents[0],
          agentName: aiAgents[activeAgents[0]].name,
          branch: activeBranch
        };
        
        newMessages.push(assistantMessage);
        
        // Show rating prompt if enabled
        if (advancedSettings.enableRating) {
          setTimeout(() => setShowRatingPrompt(assistantMessage.id), 1000);
        }
        
      } else if (collaborativeMode) {
        // Collaborative mode with real-time updates
        const { discussion, unifiedResponse } = await facilitateCollaboration(userMessage, (progressDiscussion) => {
          // Update internal discussion in real-time
          setInternalDiscussion(progressDiscussion);
        });
        
        setInternalDiscussion(discussion);
        
        const collaborativeMessage = {
          role: 'assistant',
          content: unifiedResponse,
          timestamp: new Date().toISOString(),
          id: Date.now(),
          agent: 'collaborative',
          agentName: `Collaborative Response (${activeAgents.length} agents)`,
          hasInternalDiscussion: true,
          discussionRounds: collaborationRounds,
          branch: activeBranch
        };
        
        newMessages.push(collaborativeMessage);
        
      } else {
        // Multi-agent parallel mode
        const responses = await sendToMultipleAgents(userMessage);
        
        for (const [agentId, response] of Object.entries(responses)) {
          const agentMessage = {
            role: 'assistant',
            content: response,
            timestamp: new Date().toISOString(),
            id: Date.now() + Math.random(),
            agent: agentId,
            agentName: aiAgents[agentId].name,
            branch: activeBranch
          };
          
          newMessages.push(agentMessage);
        }
      }
      
      // Update final messages
      if (activeBranch !== 'main' && activeConversation.branches[activeBranch]) {
        const updatedBranches = {
          ...activeConversation.branches,
          [activeBranch]: {
            ...activeConversation.branches[activeBranch],
            messages: newMessages
          }
        };
        updateConversation(activeConversationId, { branches: updatedBranches });
      } else {
        updateConversation(activeConversationId, { messages: newMessages });
      }
      
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date().toISOString(),
        id: Date.now(),
        isError: true,
        branch: activeBranch
      };
      
      const errorMessages = [...(activeBranch !== 'main' && activeConversation.branches[activeBranch] 
        ? activeConversation.branches[activeBranch].messages 
        : activeConversation.messages), 
        { role: 'user', content: userMessage, timestamp: new Date().toISOString(), id: Date.now() - 1, branch: activeBranch }, 
        errorMessage
      ];
      
      if (activeBranch !== 'main' && activeConversation.branches[activeBranch]) {
        const updatedBranches = {
          ...activeConversation.branches,
          [activeBranch]: {
            ...activeConversation.branches[activeBranch],
            messages: errorMessages
          }
        };
        updateConversation(activeConversationId, { branches: updatedBranches });
      } else {
        updateConversation(activeConversationId, { messages: errorMessages });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Conversation management (enhanced)
  const updateConversation = (convId, updates) => {
    setConversations(prev => prev.map(c => 
      c.id === convId ? { ...c, ...updates } : c
    ));
  };

  const createNewConversation = () => {
    const newId = `conv-${Date.now()}`;
    const newConv = {
      id: newId,
      name: `Chat ${conversations.length + 1}`,
      messages: [],
      agents: ['main'],
      branches: {},
      created: new Date().toISOString(),
      project: currentProject
    };
    
    setConversations(prev => [...prev, newConv]);
    setActiveConversationId(newId);
    setActiveBranch('main');
  };

  const deleteConversation = (convId) => {
    if (conversations.length <= 1) return;
    
    setConversations(prev => prev.filter(c => c.id !== convId));
    
    if (activeConversationId === convId) {
      setActiveConversationId(conversations[0].id);
    }
  };

  const generateFromTemplate = async (template) => {
    setIsLoading(true);
    try {
      let response;
      
      // Respect collaborative mode for templates
      if (collaborativeMode && activeAgents.length > 1) {
        const { discussion, unifiedResponse } = await facilitateCollaboration(templates[template], (progressDiscussion) => {
          setInternalDiscussion(progressDiscussion);
        });
        
        setInternalDiscussion(discussion);
        response = unifiedResponse;
        
        const newMessages = [
          ...activeConversation.messages,
          { role: 'user', content: `Template: ${template}`, timestamp: new Date().toISOString(), id: Date.now() },
          { 
            role: 'assistant', 
            content: response, 
            timestamp: new Date().toISOString(), 
            id: Date.now() + 1, 
            agent: 'collaborative',
            agentName: `Collaborative Template (${activeAgents.length} agents)`,
            hasInternalDiscussion: true
          }
        ];
        
        updateConversation(activeConversationId, { messages: newMessages });
      } else {
        // Single agent or parallel mode
        response = await sendToAI(templates[template], activeAgents[0] || 'main');
        
        const newMessages = [
          ...activeConversation.messages,
          { role: 'user', content: `Template: ${template}`, timestamp: new Date().toISOString(), id: Date.now() },
          { role: 'assistant', content: response, timestamp: new Date().toISOString(), id: Date.now() + 1, agent: activeAgents[0] || 'main' }
        ];
        
        updateConversation(activeConversationId, { messages: newMessages });
      }
    } catch (error) {
      console.error('Template generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Enhanced export/import system for artifact environment
  const generateExportData = () => {
    const exportObj = {
      conversations,
      aiAgents,
      projects,
      customPrompts,
      templates,
      advancedSettings,
      apiConfig,
      apiMode,
      uiState: { 
        darkMode, viewMode, collaborativeMode, collaborationRounds, 
        activeAgents, activeBranch, projectMode, currentProject 
      },
      detailedAnalytics,
      writingStats,
      exported: new Date().toISOString(),
      version: '2.0'
    };
    
    // Convert to base64 for easy copying
    const jsonString = JSON.stringify(exportObj, null, 2);
    return btoa(unescape(encodeURIComponent(jsonString)));
  };

  const handleExport = () => {
    const data = generateExportData();
    setExportData(data);
    setShowExportModal(true);
  };

  const handleImport = () => {
    try {
      if (!importData.trim()) {
        alert('Please enter import data');
        return;
      }
      
      // Decode from base64
      const jsonString = decodeURIComponent(escape(atob(importData.trim())));
      const importObj = JSON.parse(jsonString);
      
      // Validate import data
      if (!importObj.version || !importObj.conversations) {
        alert('Invalid import data format');
        return;
      }
      
      // Confirm import
      if (!confirm('This will replace all current data. Are you sure?')) {
        return;
      }
      
      // Import data
      if (importObj.conversations) setConversations(importObj.conversations);
      if (importObj.aiAgents) setAiAgents(importObj.aiAgents);
      if (importObj.projects) setProjects(importObj.projects);
      if (importObj.customPrompts) setCustomPrompts(importObj.customPrompts);
      if (importObj.templates) setTemplates(importObj.templates);
      if (importObj.advancedSettings) setAdvancedSettings(importObj.advancedSettings);
      if (importObj.apiConfig) setApiConfig(importObj.apiConfig);
      if (importObj.apiMode) setApiMode(importObj.apiMode);
      if (importObj.detailedAnalytics) setDetailedAnalytics(importObj.detailedAnalytics);
      if (importObj.writingStats) setWritingStats(importObj.writingStats);
      
      if (importObj.uiState) {
        const ui = importObj.uiState;
        if (ui.darkMode !== undefined) setDarkMode(ui.darkMode);
        if (ui.viewMode) setViewMode(ui.viewMode);
        if (ui.collaborativeMode !== undefined) setCollaborativeMode(ui.collaborativeMode);
        if (ui.collaborationRounds) setCollaborationRounds(ui.collaborationRounds);
        if (ui.activeAgents) setActiveAgents(ui.activeAgents);
        if (ui.activeBranch) setActiveBranch(ui.activeBranch);
        if (ui.projectMode !== undefined) setProjectMode(ui.projectMode);
        if (ui.currentProject) setCurrentProject(ui.currentProject);
      }
      
      // Reset active conversation if needed
      if (importObj.conversations && importObj.conversations.length > 0) {
        setActiveConversationId(importObj.conversations[0].id);
      }
      
      setShowImportModal(false);
      setImportData('');
      alert('Data imported successfully!');
      
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed: Invalid data format');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      alert('Export data copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
      alert('Copy failed. Please select and copy manually.');
    }
  };

  // Clear data functions
  const clearConversationsData = async () => {
    if (confirm('This will permanently delete all conversations. Are you sure?')) {
      try {
        await storage.clearLarge();
        setConversations([{ id: 'main', name: 'Main Chat', messages: [], agents: ['main'], branches: {} }]);
        setActiveConversationId('main');
        setActiveBranch('main');
        setInternalDiscussion([]);
        alert('All conversations cleared successfully!');
      } catch (error) {
        console.error('Clear conversations failed:', error);
        alert('Failed to clear conversations data');
      }
    }
  };

  const clearSettingsData = () => {
    if (confirm('This will reset all settings to defaults. Are you sure?')) {
      try {
        storage.clearSmall();
        // Reset to defaults
        setAdvancedSettings({
          enableCache: true,
          enableAnalytics: true,
          enableAutoCorrect: false,
          enableStyleCheck: true,
          enableRealTimeStats: true,
          enableAgentMemory: true,
          enableBranching: true,
          enableRating: true,
          maxRetries: 3,
          timeout: 30000,
          debugMode: false,
          experimentalFeatures: true,
          autoSuggestAgents: true,
          smartContexting: true,
          autoContinue: true,
          maxContinueAttempts: 10
        });
        setApiConfig({
          anthropic: {
            apiKey: '',
            baseUrl: 'https://api.anthropic.com',
            endpoint: '/v1/messages',
            defaultModel: 'claude-sonnet-4',
            models: ['claude-sonnet-4', 'claude-opus-4.1', 'claude-opus-4', 'claude-sonnet-3.7', 'claude-opus-3', 'claude-haiku-3.5']
          },
          openai: {
            apiKey: '',
            baseUrl: 'https://api.openai.com',
            endpoint: '/v1/chat/completions',
            defaultModel: 'chatgpt-4o-current',
            models: ['chatgpt-4o-current', 'gpt-4o', 'gpt-5', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-5-pro', 'o3', 'o3-pro', 'o4', 'o4-mini', 'o4-mini-high', 'gpt-4.5']
          }
        });
        setApiMode('window');
        setDarkMode(true);
        setViewMode('chat');
        setCollaborativeMode(false);
        setActiveAgents(['main']);
        alert('Settings cleared successfully!');
      } catch (error) {
        console.error('Clear settings failed:', error);
        alert('Failed to clear settings data');
      }
    }
  };

  // NEW: Project management
  const createProject = (name, description, type) => {
    const project = {
      id: `project-${Date.now()}`,
      name,
      description,
      type,
      created: new Date().toISOString(),
      conversations: [],
      characters: [],
      worldElements: [],
      plotPoints: [],
      notes: []
    };
    
    setProjects(prev => [...prev, project]);
    setCurrentProject(project.id);
    setProjectMode(true);
  };

  // Get current messages based on active branch
  const getCurrentMessages = () => {
    if (activeBranch !== 'main' && activeConversation.branches[activeBranch]) {
      return activeConversation.branches[activeBranch].messages;
    }
    return activeConversation.messages;
  };

  // Keyboard shortcuts (enhanced)
  useEffect(() => {
    const handleKeyboard = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            handleSubmit();
            break;
          case 'n':
            e.preventDefault();
            createNewConversation();
            break;
          case 's':
            e.preventDefault();
            exportConversation();
            break;
          case 'k':
            e.preventDefault();
            updateConversation(activeConversationId, { messages: [] });
            break;
          case 'd':
            e.preventDefault();
            setDarkMode(prev => !prev);
            break;
          case '/':
            e.preventDefault();
            setSettingsOpen(prev => !prev);
            break;
          case 'b':
            e.preventDefault();
            setBranchingMode(prev => !prev);
            break;
          case 'm':
            e.preventDefault();
            setCollaborativeMode(prev => !prev);
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [activeConversationId, activeConversation.messages]);

  // Style analysis (enhanced)
  const analyzeStyle = (text) => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
    const complexity = words.filter(w => w.length > 6).length / words.length;
    const readability = avgSentenceLength < 15 && complexity < 0.3 ? 'Easy' : 
                       avgSentenceLength < 20 && complexity < 0.5 ? 'Medium' : 'Complex';
    
    // Sentiment analysis (basic)
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing'];
    const sentiment = positiveWords.filter(w => text.toLowerCase().includes(w)).length - 
                     negativeWords.filter(w => text.toLowerCase().includes(w)).length;
    
    return { 
      avgSentenceLength: Math.round(avgSentenceLength), 
      complexity: Math.round(complexity * 100), 
      readability,
      sentiment: sentiment > 0 ? 'Positive' : sentiment < 0 ? 'Negative' : 'Neutral',
      paragraphs: paragraphs.length
    };
  };

  const currentStyle = analyzeStyle(
    getCurrentMessages()
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join(' ')
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-purple-50 to-blue-50 text-gray-900'
    }`}>
      <div className="flex h-screen overflow-hidden">
        {/* Enhanced Sidebar */}
        {sidebarOpen && (
          <div className={`w-80 border-r transition-colors flex flex-col h-full ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">🤖 AI Creative Studio Pro</h2>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  ←
                </button>
              </div>
              
              {/* API Mode Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">API Mode</label>
                <select 
                  value={apiMode}
                  onChange={(e) => setApiMode(e.target.value)}
                  className={`w-full p-2 rounded border text-sm ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="window">🪟 Built-in Claude</option>
                  <option value="anthropic">🏢 Anthropic API</option>
                  <option value="openai">🤖 OpenAI API</option>
                </select>
                
                {apiMode !== 'window' && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="password"
                      placeholder="API Key"
                      value={apiConfig[apiMode].apiKey}
                      onChange={(e) => setApiConfig(prev => ({
                        ...prev,
                        [apiMode]: { ...prev[apiMode], apiKey: e.target.value }
                      }))}
                      className={`w-full p-1 rounded border text-xs ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Base URL"
                      value={apiConfig[apiMode].baseUrl}
                      onChange={(e) => setApiConfig(prev => ({
                        ...prev,
                        [apiMode]: { ...prev[apiMode], baseUrl: e.target.value }
                      }))}
                      className={`w-full p-1 rounded border text-xs ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Endpoint"
                      value={apiConfig[apiMode].endpoint}
                      onChange={(e) => setApiConfig(prev => ({
                        ...prev,
                        [apiMode]: { ...prev[apiMode], endpoint: e.target.value }
                      }))}
                      className={`w-full p-1 rounded border text-xs ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                    />
                    <select 
                      value={apiConfig[apiMode].defaultModel}
                      onChange={(e) => setApiConfig(prev => ({
                        ...prev,
                        [apiMode]: { ...prev[apiMode], defaultModel: e.target.value }
                      }))}
                      className={`w-full p-1 rounded border text-xs ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                    >
                      {apiConfig[apiMode].models.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                )}
      
      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-2xl w-full rounded-lg p-6 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">📥 Export Data</h2>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-2xl hover:opacity-60"
              >
                ×
              </button>
            </div>
            
            <p className="text-sm opacity-80 mb-4">
              Copy this data to save your complete AI Studio state. Import it later to restore all conversations, settings, and preferences.
            </p>
            
            <div className="mb-4">
              <textarea
                value={exportData}
                readOnly
                className={`w-full h-32 p-3 rounded border font-mono text-xs ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                }`}
                onClick={(e) => e.target.select()}
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={copyToClipboard}
                className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                📋 Copy to Clipboard
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-2xl w-full rounded-lg p-6 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">📤 Import Data</h2>
              <button 
                onClick={() => setShowImportModal(false)}
                className="text-2xl hover:opacity-60"
              >
                ×
              </button>
            </div>
            
            <p className="text-sm opacity-80 mb-4">
              Paste your exported AI Studio data below to restore conversations, settings, and preferences. 
              <strong className="text-red-500">Warning: This will replace all current data!</strong>
            </p>
            
            <div className="mb-4">
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste your base64-encoded export data here..."
                className={`w-full h-32 p-3 rounded border font-mono text-xs ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleImport}
                disabled={!importData.trim()}
                className="flex-1 p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                📤 Import Data
              </button>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportData('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
              </div>
              
              {/* Enhanced Stats */}
              <div className={`p-3 rounded-lg mb-4 text-sm ${
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className="grid grid-cols-2 gap-2">
                  <div>Words: <span className="font-bold">{writingStats.words}</span></div>
                  <div>Sentences: <span className="font-bold">{writingStats.sentences}</span></div>
                  <div>Avg Length: <span className="font-bold">{writingStats.avgLength}</span></div>
                  <div>Style: <span className="font-bold">{currentStyle.readability}</span></div>
                  <div>Sentiment: <span className="font-bold">{currentStyle.sentiment}</span></div>
                  <div>Time: <span className="font-bold">{writingStats.totalTime}m</span></div>
                </div>
              </div>
              
              {/* Project Mode */}
              {projectMode && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2">📁 Project Mode</h3>
                  <div className={`p-2 rounded text-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    Current: {projects.find(p => p.id === currentProject)?.name || 'None'}
                  </div>
                </div>
              )}
              
              {/* Conversations with Branch Info */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Conversations</h3>
                  <button 
                    onClick={createNewConversation}
                    className="text-sm px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                    +
                  </button>
                </div>
                
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {conversations.map(conv => (
                    <div key={conv.id}>
                      <div 
                        onClick={() => {
                          setActiveConversationId(conv.id);
                          setActiveBranch('main');
                        }}
                        className={`p-2 rounded cursor-pointer text-sm ${
                          conv.id === activeConversationId && activeBranch === 'main'
                            ? 'bg-purple-500 text-white'
                            : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{conv.name}</span>
                          {conversations.length > 1 && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                              className="ml-2 text-xs opacity-60 hover:opacity-100"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <div className="text-xs opacity-60">
                          {conv.messages.length} messages
                          {Object.keys(conv.branches || {}).length > 0 && (
                            <span> • {Object.keys(conv.branches).length} branches</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Branch List */}
                      {conv.id === activeConversationId && Object.keys(conv.branches || {}).length > 0 && (
                        <div className="ml-4 mt-1 space-y-1">
                          {Object.entries(conv.branches).map(([branchId, branch]) => (
                            <div
                              key={branchId}
                              onClick={() => setActiveBranch(branchId)}
                              className={`p-1 rounded cursor-pointer text-xs ${
                                activeBranch === branchId
                                  ? 'bg-blue-500 text-white'
                                  : darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                              }`}
                            >
                              🌿 {branch.name} ({branch.messages.length})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Enhanced AI Agents with Stats */}
              <div className="mb-4">
                <h3 className="font-medium mb-2">AI Agents</h3>
                <div className="space-y-2">
                  {Object.entries(aiAgents).map(([id, agent]) => (
                    <label key={id} className="flex items-center space-x-2 text-sm">
                      <input 
                        type="checkbox"
                        checked={activeAgents.includes(id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setActiveAgents(prev => [...prev, id]);
                          } else {
                            setActiveAgents(prev => prev.filter(a => a !== id));
                          }
                        }}
                        className="rounded"
                      />
                      <div className={`w-3 h-3 rounded-full bg-${agent.color}-500`}></div>
                      <div className="flex-1">
                        <span className="truncate block">{agent.name}</span>
                        {advancedSettings.enableAnalytics && agent.stats.responses > 0 && (
                          <span className="text-xs opacity-60">
                            ⭐ {agent.stats.avgRating.toFixed(1)} ({agent.stats.responses})
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                
                {/* Enhanced Collaborative Mode Controls */}
                <div className="mt-2">
                  <label className="flex items-center space-x-2 text-sm">
                    <input 
                      type="checkbox"
                      checked={collaborativeMode}
                      onChange={(e) => setCollaborativeMode(e.target.checked)}
                      disabled={activeAgents.length <= 1}
                      className="rounded"
                    />
                    <span>Collaborative Mode</span>
                    {activeAgents.length <= 1 && <span className="text-xs opacity-50">(need 2+ agents)</span>}
                  </label>
                  
                  {collaborativeMode && (
                    <div className="ml-6 mt-2 space-y-2">
                      <label className="flex items-center space-x-2 text-xs">
                        <span>Rounds:</span>
                        <input 
                          type="number"
                          value={collaborationRounds}
                          onChange={(e) => setCollaborationRounds(Math.max(1, Math.min(5, Number(e.target.value))))}
                          min="1"
                          max="5"
                          className={`w-12 p-1 rounded border text-xs ${
                            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                          }`}
                        />
                      </label>
                      
                      <label className="flex items-center space-x-2 text-xs">
                        <input 
                          type="checkbox"
                          checked={showInternalChat}
                          onChange={(e) => setShowInternalChat(e.target.checked)}
                          className="rounded"
                        />
                        <span>Show discussion</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 text-xs">
                        <span>View:</span>
                        <select 
                          value={collaborationView}
                          onChange={(e) => setCollaborationView(e.target.value)}
                          className={`text-xs p-1 rounded border ${
                            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                          }`}
                        >
                          <option value="timeline">Timeline</option>
                          <option value="tree">Tree</option>
                          <option value="summary">Summary</option>
                        </select>
                      </label>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Prompts */}
              <div className="mb-4">
                <h3 className="font-medium mb-2">Quick Prompts</h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {Object.entries(promptLibrary).map(([name, prompt]) => (
                    <button
                      key={name}
                      onClick={() => setUserInput(prompt)}
                      className={`w-full text-left text-xs p-2 rounded transition-colors ${
                        darkMode 
                          ? 'hover:bg-gray-700' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Templates */}
              <div className="mb-4">
                <h3 className="font-medium mb-2">Writing Templates</h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {Object.keys(templates).map(template => (
                    <button
                      key={template}
                      onClick={() => generateFromTemplate(template)}
                      disabled={isLoading}
                      className={`w-full text-left text-xs p-2 rounded transition-colors ${
                        darkMode 
                          ? 'hover:bg-gray-700 disabled:opacity-50' 
                          : 'hover:bg-gray-100 disabled:opacity-50'
                      }`}
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Enhanced Quick Actions */}
              <div className="space-y-2">
                <button 
                  onClick={handleExport}
                  className="w-full text-sm p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  📥 Export Data
                </button>
                
                <button 
                  onClick={() => setShowImportModal(true)}
                  className="w-full text-sm p-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  📤 Import Data
                </button>
                
                <button 
                  onClick={() => setBranchingMode(!branchingMode)}
                  className={`w-full text-sm p-2 rounded transition-colors ${
                    branchingMode 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-500 text-white hover:bg-gray-600'
                  }`}
                >
                  🌿 {branchingMode ? 'Exit Branch Mode' : 'Branch Mode'}
                </button>
                
                <button 
                  onClick={() => updateConversation(activeConversationId, { messages: [] })}
                  className="w-full text-sm p-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  🗑️ Clear Chat
                </button>
                
                <button 
                  onClick={() => setSettingsOpen(true)}
                  className="w-full text-sm p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  ⚙️ Settings
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Enhanced Header */}
          <div className={`p-4 border-b flex items-center justify-between ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-4">
              {!sidebarOpen && (
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  →
                </button>
              )}
              
              <h1 className="text-xl font-bold">
                {activeConversation.name}
                {activeBranch !== 'main' && (
                  <span className="text-sm font-normal opacity-60">
                    / {activeConversation.branches[activeBranch]?.name}
                  </span>
                )}
              </h1>
              
              <div className="flex items-center space-x-2 text-sm">
                {activeAgents.map(agentId => (
                  <span 
                    key={agentId}
                    className={`px-2 py-1 rounded text-xs bg-${aiAgents[agentId].color}-500 text-white`}
                  >
                    {aiAgents[agentId].name}
                  </span>
                ))}
                {collaborativeMode && (
                  <span className="px-2 py-1 rounded text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                    Collaborative
                  </span>
                )}
                {branchingMode && (
                  <span className="px-2 py-1 rounded text-xs bg-green-500 text-white">
                    Branching
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Enhanced View Mode Selector */}
              <select 
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className={`text-sm p-1 rounded border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              >
                <option value="chat">💬 Chat</option>
                <option value="split">⚡ Split</option>
                <option value="focus">🎯 Focus</option>
                <option value="analytics">📊 Analytics</option>
                <option value="debug">🔧 Debug</option>
              </select>
              
              {/* Dark Mode Toggle */}
              <button 
                onClick={() => setDarkMode(prev => !prev)}
                className={`p-2 rounded ${
                  darkMode ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-white'
                }`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              
              {/* Enhanced Status */}
              <div className="flex items-center space-x-1">
                <div className={`text-xs px-2 py-1 rounded ${
                  (apiMode === 'window' && window.claude?.complete) || 
                  (apiMode !== 'window' && apiConfig[apiMode].apiKey) 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {apiMode === 'window' ? (window.claude?.complete ? 'Claude ✅' : 'Claude ❌') : 
                   apiMode === 'anthropic' ? (apiConfig.anthropic.apiKey ? 'Anthropic ✅' : 'API ❌') :
                   apiConfig.openai.apiKey ? 'OpenAI ✅' : 'API ❌'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Chat Area */}
          <div className="flex-1 flex min-h-0">
            <div 
              ref={chatContainerRef}
              className={`flex-1 overflow-y-auto p-4 ${
                viewMode === 'focus' ? 'max-w-4xl mx-auto' : ''
              }`}
            >
              {getCurrentMessages().length === 0 ? (
                <div className="text-center mt-20">
                  <h2 className="text-2xl font-bold mb-4">🚀 Advanced AI Creative Studio Pro</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Your professional AI writing companion with advanced collaboration, branching, and analytics
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
                      <div className="text-2xl mb-2">🤖</div>
                      <div className="text-sm font-medium">Multi-Agent AI</div>
                      <div className="text-xs opacity-60">6 specialized assistants</div>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
                      <div className="text-2xl mb-2">🤝</div>
                      <div className="text-sm font-medium">Collaboration</div>
                      <div className="text-xs opacity-60">Unified responses</div>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
                      <div className="text-2xl mb-2">🌿</div>
                      <div className="text-sm font-medium">Branching</div>
                      <div className="text-xs opacity-60">Explore alternatives</div>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
                      <div className="text-2xl mb-2">📊</div>
                      <div className="text-sm font-medium">Analytics</div>
                      <div className="text-xs opacity-60">Deep insights</div>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
                      <div className="text-2xl mb-2">⭐</div>
                      <div className="text-sm font-medium">Rating System</div>
                      <div className="text-xs opacity-60">Quality feedback</div>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
                      <div className="text-2xl mb-2">🔧</div>
                      <div className="text-sm font-medium">Response Tools</div>
                      <div className="text-xs opacity-60">Refine & improve</div>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
                      <div className="text-2xl mb-2">🏢</div>
                      <div className="text-sm font-medium">API Integration</div>
                      <div className="text-xs opacity-60">Multiple providers</div>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
                      <div className="text-2xl mb-2">📁</div>
                      <div className="text-sm font-medium">Project Mode</div>
                      <div className="text-xs opacity-60">Organized workflow</div>
                    </div>
                  </div>
                  
                  <div className="mt-8 text-sm opacity-60">
                    <p>Select multiple agents for parallel responses • Enable Collaborative Mode for unified responses</p>
                    <p>Press Ctrl+B for branching mode • Ctrl+M for collaborative mode • Ctrl+/ for shortcuts</p>
                    <p>Choose API mode: Built-in Claude, Anthropic API, or OpenAI API</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {getCurrentMessages().map((message, index) => (
                    <div key={message.id || index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-4xl rounded-lg p-4 ${
                        message.role === 'user' 
                          ? 'bg-purple-500 text-white' 
                          : message.isError
                            ? 'bg-red-100 border border-red-300 text-red-800'
                            : darkMode
                              ? 'bg-gray-800 border border-gray-700'
                              : 'bg-white border border-gray-200 shadow-sm'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs opacity-70 flex items-center space-x-2">
                            <span>{message.role === 'user' ? 'You' : message.agentName || 'AI'}</span>
                            {message.agent && message.agent !== 'main' && message.agent !== 'collaborative' && (
                              <span className={`px-1 rounded bg-${aiAgents[message.agent]?.color || 'gray'}-500 text-white`}>
                                {aiAgents[message.agent]?.name}
                              </span>
                            )}
                            {message.agent === 'collaborative' && (
                              <span className="px-1 rounded bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                                Collaborative ({message.discussionRounds} rounds)
                              </span>
                            )}
                            {message.timestamp && (
                              <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                            )}
                            {message.rating && (
                              <span className="text-yellow-500">⭐ {message.rating}</span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {message.hasInternalDiscussion && (
                              <button
                                onClick={() => setShowInternalChat(!showInternalChat)}
                                className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                {showInternalChat ? 'Hide' : 'Show'} Discussion
                              </button>
                            )}
                            
                            {/* Response Actions */}
                            {message.role === 'assistant' && !message.isError && (
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => refineResponse(message.id, 'funnier')}
                                  className="text-xs px-1 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                  title="Make funnier"
                                >
                                  😄
                                </button>
                                <button
                                  onClick={() => refineResponse(message.id, 'formal')}
                                  className="text-xs px-1 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                  title="More formal"
                                >
                                  👔
                                </button>
                                <button
                                  onClick={() => refineResponse(message.id, 'shorter')}
                                  className="text-xs px-1 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
                                  title="Make shorter"
                                >
                                  ✂️
                                </button>
                                {branchingMode && (
                                  <button
                                    onClick={() => {
                                      const branchName = prompt('Branch name:');
                                      if (branchName) createBranch(message.id, branchName);
                                    }}
                                    className="text-xs px-1 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                    title="Create branch"
                                  >
                                    🌿
                                  </button>
                                )}
                                {advancedSettings.enableRating && !message.rating && (
                                  <button
                                    onClick={() => setShowRatingPrompt(message.id)}
                                    className="text-xs px-1 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                    title="Rate response"
                                  >
                                    ⭐
                                  </button>
                                )}
                              </div>
                            )}
                            
                            {viewMode === 'debug' && (
                              <div className="text-xs opacity-50">
                                ID: {message.id} | Agent: {message.agent || 'none'} | Branch: {message.branch || 'main'}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        
                        {message.isRefinement && (
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs opacity-60">
                            🔧 Refined: {message.refinementType}
                          </div>
                        )}
                        
                        {advancedSettings.enableAnalytics && message.role === 'assistant' && (
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs opacity-60">
                            Length: {message.content.length} chars • Words: {message.content.split(/\s+/).length}
                            {message.feedback && <span> • Feedback: {message.feedback}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className={`rounded-lg p-4 ${
                        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                      }`}>
                        <div className="text-xs opacity-70 mb-2">
                          {collaborativeMode && activeAgents.length > 1 
                            ? `${activeAgents.length} agents collaborating (${collaborationRounds} rounds)...` 
                            : activeAgents.length > 1 
                              ? `${activeAgents.length} agents responding...`
                              : `AI thinking (${apiMode} mode)...`
                          }
                        </div>
                        <div className="flex space-x-1">
                          {[0, 1, 2].map(i => (
                            <div 
                              key={i}
                              className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
                              style={{animationDelay: `${i * 0.2}s`}}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Enhanced Internal Discussion Panel */}
            {showInternalChat && internalDiscussion.length > 0 && (
              <div className={`w-80 border-l p-4 overflow-y-auto ${
                darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-sm">🤝 Internal Discussion</h3>
                  <div className="flex items-center space-x-2">
                    <select 
                      value={collaborationView}
                      onChange={(e) => setCollaborationView(e.target.value)}
                      className={`text-xs p-1 rounded border ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="timeline">Timeline</option>
                      <option value="tree">Tree</option>
                      <option value="summary">Summary</option>
                    </select>
                    <button
                      onClick={() => setShowInternalChat(false)}
                      className="text-xs opacity-60 hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {collaborationView === 'timeline' && internalDiscussion.map((msg, index) => (
                    <div key={msg.id || index} className={`p-3 rounded-lg text-sm border ${
                      msg.type === 'facilitation'
                        ? darkMode ? 'bg-blue-900 border-blue-700' : 'bg-blue-100 border-blue-300'
                        : msg.type === 'synthesis'
                          ? darkMode ? 'bg-purple-900 border-purple-700' : 'bg-purple-100 border-purple-300'
                          : msg.isError
                            ? darkMode ? 'bg-red-900 border-red-700' : 'bg-red-100 border-red-300'
                            : darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                    }`}>
                      <div className="font-medium text-xs mb-1 opacity-70 flex items-center justify-between">
                        <span>{msg.speaker}</span>
                        <span>R{msg.round} • {new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  ))}
                  
                  {collaborationView === 'summary' && (
                    <div className={`p-3 rounded-lg text-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      <div className="font-medium mb-2">Discussion Summary</div>
                      <div className="space-y-2">
                        <div>Rounds: {Math.max(...internalDiscussion.map(d => d.round))}</div>
                        <div>Participants: {Array.from(new Set(internalDiscussion.map(d => d.speaker))).join(', ')}</div>
                        <div>Total Messages: {internalDiscussion.length}</div>
                        <div>Duration: {Math.round((new Date(internalDiscussion[internalDiscussion.length-1].timestamp) - new Date(internalDiscussion[0].timestamp)) / 1000)}s</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Analytics Panel */}
            {viewMode === 'analytics' && (
              <div className={`w-80 border-l p-4 overflow-y-auto ${
                darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <h3 className="font-medium text-sm mb-4">📊 Analytics Dashboard</h3>
                
                <div className="space-y-4">
                  {/* Writing Stats */}
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="font-medium text-sm mb-2">Writing Stats</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Words: {writingStats.words}</div>
                      <div>Sentences: {writingStats.sentences}</div>
                      <div>Avg Length: {writingStats.avgLength}</div>
                      <div>Paragraphs: {currentStyle.paragraphs}</div>
                      <div>Complexity: {currentStyle.complexity}%</div>
                      <div>Sentiment: {currentStyle.sentiment}</div>
                    </div>
                  </div>
                  
                  {/* Agent Performance */}
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="font-medium text-sm mb-2">Agent Performance</div>
                    <div className="space-y-1">
                      {Object.entries(aiAgents).map(([id, agent]) => (
                        <div key={id} className="flex justify-between text-xs">
                          <span>{agent.name}</span>
                          <span>⭐ {agent.stats.avgRating.toFixed(1)} ({agent.stats.responses})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* API Usage */}
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="font-medium text-sm mb-2">API Usage</div>
                    <div className="space-y-1 text-xs">
                      <div>Mode: {apiMode}</div>
                      <div>Requests: {apiUsage.requests}</div>
                      <div>Est. Tokens: {Math.round(apiUsage.tokens)}</div>
                      <div>Errors: {apiUsage.errors}</div>
                      <div>Cache Size: {responseCache.size}</div>
                    </div>
                  </div>
                  
                  {/* Top Words */}
                  {Object.keys(detailedAnalytics.wordFrequency).length > 0 && (
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      <div className="font-medium text-sm mb-2">Top Words</div>
                      <div className="space-y-1">
                        {Object.entries(detailedAnalytics.wordFrequency)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 5)
                          .map(([word, count]) => (
                            <div key={word} className="flex justify-between text-xs">
                              <span>{word}</span>
                              <span>{count}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Enhanced Input Area */}
          <div className={`p-4 border-t ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2 flex-wrap">
                  {/* Enhanced Quick Actions */}
                  <button 
                    onClick={() => setUserInput("Analyze my writing style and suggest improvements")}
                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    📊 Style Analysis
                  </button>
                  
                  <button 
                    onClick={() => setUserInput("Continue the story from where we left off")}
                    className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    ➡️ Continue
                  </button>
                  
                  <button 
                    onClick={() => setUserInput("Brainstorm 5 creative plot twists for this story")}
                    className="text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
                  >
                    💡 Plot Twists
                  </button>
                  
                  <button 
                    onClick={() => setUserInput("Improve this text to be more engaging and readable")}
                    className="text-xs px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                    ✨ Enhance
                  </button>
                  
                  <div className="text-xs opacity-60">
                    {activeAgents.length} agent{activeAgents.length !== 1 ? 's' : ''} • 
                    {activeAgents.length > 1 ? (collaborativeMode ? ' Collaborative' : ' Parallel') : ' Single'} •
                    {apiMode === 'window' ? ' Built-in' : apiMode === 'anthropic' ? ' Anthropic' : ' OpenAI'}
                    {activeBranch !== 'main' && ` • Branch: ${activeConversation.branches[activeBranch]?.name}`}
                  </div>
                </div>
                
                <textarea
                  ref={inputRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder={`Message your AI ${activeAgents.length > 1 ? (collaborativeMode ? 'collaborative team' : 'agents') : 'assistant'}... (Shift+Enter for new line, Ctrl+Enter to send)`}
                  disabled={isLoading}
                  className={`w-full p-3 rounded-lg border resize-none transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50`}
                  rows={3}
                />
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={isLoading || !userInput.trim()}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 font-medium transition-colors"
              >
                {isLoading ? '⏳' : '🚀'}
              </button>
            </div>
            
            {/* Enhanced Status Bar */}
            <div className="flex items-center justify-between mt-2 text-xs opacity-60">
              <div className="flex items-center space-x-4">
                <span>Context: {getCurrentMessages().length}/{contextLimit * 2}</span>
                <span>Cache: {responseCache.size} items</span>
                <span>API: {apiUsage.requests} req, {apiUsage.errors} err</span>
                {Object.keys(activeConversation.branches || {}).length > 0 && (
                  <span>Branches: {Object.keys(activeConversation.branches).length}</span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {advancedSettings.enableCache && <span>💾</span>}
                {advancedSettings.enableAnalytics && <span>📊</span>}
                {advancedSettings.enableRating && <span>⭐</span>}
                {advancedSettings.enableBranching && <span>🌿</span>}
                {advancedSettings.debugMode && <span>🔧</span>}
                {autoSave && <span>💾</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Rating Prompt Modal */}
      {showRatingPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full rounded-lg p-6 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className="font-medium mb-4">Rate this response</h3>
            <div className="flex items-center space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => rateResponse(showRatingPrompt, rating)}
                  className="text-2xl hover:scale-110 transition-transform"
                >
                  ⭐
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowRatingPrompt(null)}
              className="text-sm px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Skip
            </button>
          </div>
        </div>
      )}
      
      {/* Enhanced Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-4xl w-full h-[90vh] flex flex-col rounded-lg ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold">⚙️ Advanced Settings</h2>
              <button 
                onClick={() => setSettingsOpen(false)}
                className="text-2xl hover:opacity-60 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* API Configuration */}
              <div>
                <h3 className="font-medium mb-3">🔌 API Configuration</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1">API Mode</label>
                    <select 
                      value={apiMode}
                      onChange={(e) => setApiMode(e.target.value)}
                      className={`w-full p-2 rounded border ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="window">Built-in Claude</option>
                      <option value="anthropic">Anthropic API</option>
                      <option value="openai">OpenAI API</option>
                    </select>
                  </div>
                  
                  {apiMode !== 'window' && (
                    <>
                      <div>
                        <label className="block text-sm mb-1">API Key</label>
                        <input
                          type="password"
                          value={apiConfig[apiMode].apiKey}
                          onChange={(e) => setApiConfig(prev => ({
                            ...prev,
                            [apiMode]: { ...prev[apiMode], apiKey: e.target.value }
                          }))}
                          className={`w-full p-2 rounded border ${
                            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                          }`}
                          placeholder="Enter your API key"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">Base URL</label>
                        <input
                          type="text"
                          value={apiConfig[apiMode].baseUrl}
                          onChange={(e) => setApiConfig(prev => ({
                            ...prev,
                            [apiMode]: { ...prev[apiMode], baseUrl: e.target.value }
                          }))}
                          className={`w-full p-2 rounded border ${
                            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">Endpoint</label>
                        <input
                          type="text"
                          value={apiConfig[apiMode].endpoint}
                          onChange={(e) => setApiConfig(prev => ({
                            ...prev,
                            [apiMode]: { ...prev[apiMode], endpoint: e.target.value }
                          }))}
                          className={`w-full p-2 rounded border ${
                            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">Default Model</label>
                        <select 
                          value={apiConfig[apiMode].defaultModel}
                          onChange={(e) => setApiConfig(prev => ({
                            ...prev,
                            [apiMode]: { ...prev[apiMode], defaultModel: e.target.value }
                          }))}
                          className={`w-full p-2 rounded border ${
                            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                          }`}
                        >
                          {apiConfig[apiMode].models.map(model => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Performance Settings */}
              <div>
                <h3 className="font-medium mb-3">🚀 Performance</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span>Enable Response Caching</span>
                    <input 
                      type="checkbox"
                      checked={advancedSettings.enableCache}
                      onChange={(e) => setAdvancedSettings(prev => ({...prev, enableCache: e.target.checked}))}
                      className="rounded"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <span>Context Limit (messages)</span>
                    <input 
                      type="number"
                      value={contextLimit}
                      onChange={(e) => setContextLimit(Number(e.target.value))}
                      min="5"
                      max="100"
                      className={`w-20 p-1 rounded border ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                    />
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <span>Request Timeout (ms)</span>
                    <input 
                      type="number"
                      value={advancedSettings.timeout}
                      onChange={(e) => setAdvancedSettings(prev => ({...prev, timeout: Number(e.target.value)}))}
                      min="5000"
                      max="120000"
                      step="1000"
                      className={`w-24 p-1 rounded border ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                    />
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <span>Max Retries</span>
                    <input 
                      type="number"
                      value={advancedSettings.maxRetries}
                      onChange={(e) => setAdvancedSettings(prev => ({...prev, maxRetries: Number(e.target.value)}))}
                      min="1"
                      max="5"
                      className={`w-16 p-1 rounded border ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                    />
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <span>Auto-Continue Responses</span>
                    <input 
                      type="checkbox"
                      checked={advancedSettings.autoContinue}
                      onChange={(e) => setAdvancedSettings(prev => ({...prev, autoContinue: e.target.checked}))}
                      className="rounded"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <span>Max Continue Attempts</span>
                    <input 
                      type="number"
                      value={advancedSettings.maxContinueAttempts}
                      onChange={(e) => setAdvancedSettings(prev => ({...prev, maxContinueAttempts: Number(e.target.value)}))}
                      min="1"
                      max="20"
                      className={`w-16 p-1 rounded border ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                    />
                  </label>
                </div>
              </div>
              
              {/* Enhanced Features */}
              <div>
                <h3 className="font-medium mb-3">🔧 Features</h3>
                <div className="space-y-3">
                  {Object.entries(advancedSettings).filter(([key]) => 
                    ['enableAnalytics', 'enableAutoCorrect', 'enableStyleCheck', 'enableRealTimeStats', 
                     'enableAgentMemory', 'enableBranching', 'enableRating', 'autoSuggestAgents', 
                     'smartContexting', 'debugMode', 'experimentalFeatures'].includes(key)
                  ).map(([key, value]) => (
                    <label key={key} className="flex items-center justify-between">
                      <span>{key.replace('enable', '').replace(/([A-Z])/g, ' $1').replace('auto', 'Auto ')}</span>
                      <input 
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setAdvancedSettings(prev => ({...prev, [key]: e.target.checked}))}
                        className="rounded"
                      />
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Enhanced Collaboration Settings */}
              <div>
                <h3 className="font-medium mb-3">🤝 Collaboration</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span>Default Collaboration Rounds</span>
                    <input 
                      type="number"
                      value={collaborationRounds}
                      onChange={(e) => setCollaborationRounds(Math.max(1, Math.min(5, Number(e.target.value))))}
                      min="1"
                      max="5"
                      className={`w-16 p-1 rounded border ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                    />
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <span>Auto-show Internal Discussions</span>
                    <input 
                      type="checkbox"
                      checked={showInternalChat}
                      onChange={(e) => setShowInternalChat(e.target.checked)}
                      className="rounded"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <span>Default Discussion View</span>
                    <select 
                      value={collaborationView}
                      onChange={(e) => setCollaborationView(e.target.value)}
                      className={`w-24 p-1 rounded border ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="timeline">Timeline</option>
                      <option value="tree">Tree</option>
                      <option value="summary">Summary</option>
                    </select>
                  </label>
                </div>
              </div>
              
              {/* Agent Management */}
              <div>
                <h3 className="font-medium mb-3">🤖 Agent Management</h3>
                <div className="space-y-3">
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {Object.entries(aiAgents).map(([id, agent]) => (
                      <div key={id} className={`p-2 rounded border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                        <div className="flex items-center space-x-2 mb-1">
                          <div className={`w-3 h-3 rounded-full bg-${agent.color}-500`}></div>
                          <input
                            type="text"
                            value={agent.name}
                            onChange={(e) => setAiAgents(prev => ({
                              ...prev,
                              [id]: { ...prev[id], name: e.target.value }
                            }))}
                            className={`flex-1 p-1 rounded border text-sm ${
                              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                            }`}
                          />
                        </div>
                        <textarea
                          value={agent.prompt}
                          onChange={(e) => setAiAgents(prev => ({
                            ...prev,
                            [id]: { ...prev[id], prompt: e.target.value }
                          }))}
                          className={`w-full p-1 rounded border text-xs ${
                            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                          }`}
                          rows={2}
                          placeholder="Agent personality and instructions..."
                        />
                        {advancedSettings.enableAnalytics && (
                          <div className="text-xs opacity-60 mt-1">
                            Responses: {agent.stats.responses} | Avg Rating: {agent.stats.avgRating.toFixed(1)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Data Management */}
              <div>
                <h3 className="font-medium mb-3">💾 Data Management</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span>Auto-save Conversations</span>
                    <input 
                      type="checkbox"
                      checked={autoSave}
                      onChange={(e) => setAutoSave(e.target.checked)}
                      className="rounded"
                    />
                  </label>
                  
                  <button 
                    onClick={() => {
                      setResponseCache(new Map());
                      setApiUsage({ requests: 0, tokens: 0, errors: 0 });
                    }}
                    className="w-full p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    🗑️ Clear Cache & Reset Stats
                  </button>
                  
                  <button 
                    onClick={() => {
                      if (confirm('Export all data as JSON backup?')) {
                        const backup = {
                          conversations,
                          aiAgents,
                          projects,
                          customPrompts,
                          templates,
                          advancedSettings,
                          apiConfig,
                          exported: new Date().toISOString()
                        };
                        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `ai-studio-backup-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    }}
                    className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    📥 Export Full Backup
                  </button>
                  
                  <button 
                    onClick={() => {
                      if (confirm('This will delete all conversations. Are you sure?')) {
                        setConversations([{ id: 'main', name: 'Main Chat', messages: [], agents: ['main'], branches: {} }]);
                        setActiveConversationId('main');
                        setActiveBranch('main');
                      }
                    }}
                    className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    🗑️ Delete All Conversations
                  </button>
                </div>
              </div>
            </div>
            
            {/* Extended sections */}
            <div className="mt-6 space-y-6">
              {/* API Usage Stats */}
              <div>
                <h3 className="font-medium mb-3">📊 API Usage & Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="font-medium mb-2">Current Session</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="opacity-60">Requests</div>
                        <div className="text-lg font-bold">{apiUsage.requests}</div>
                      </div>
                      <div>
                        <div className="opacity-60">Est. Tokens</div>
                        <div className="text-lg font-bold">{Math.round(apiUsage.tokens)}</div>
                      </div>
                      <div>
                        <div className="opacity-60">Errors</div>
                        <div className="text-lg font-bold">{apiUsage.errors}</div>
                      </div>
                      <div>
                        <div className="opacity-60">Cache Hits</div>
                        <div className="text-lg font-bold">{responseCache.size}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="font-medium mb-2">Writing Analytics</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="opacity-60">Total Words</div>
                        <div className="text-lg font-bold">{writingStats.words}</div>
                      </div>
                      <div>
                        <div className="opacity-60">Session Time</div>
                        <div className="text-lg font-bold">{writingStats.totalTime}m</div>
                      </div>
                      <div>
                        <div className="opacity-60">Avg Sentence</div>
                        <div className="text-lg font-bold">{writingStats.avgLength}</div>
                      </div>
                      <div>
                        <div className="opacity-60">Conversations</div>
                        <div className="text-lg font-bold">{conversations.length}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Custom Prompts Manager */}
              <div>
                <h3 className="font-medium mb-3">📝 Custom Prompts</h3>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Prompt name..."
                      className={`flex-1 p-2 rounded border ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const name = e.target.value.trim();
                          if (name) {
                            const prompt = prompt('Enter prompt text:');
                            if (prompt) {
                              setCustomPrompts(prev => [...prev, { name, prompt, id: Date.now() }]);
                              e.target.value = '';
                            }
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const name = prompt('Prompt name:');
                        if (name) {
                          const promptText = prompt('Enter prompt text:');
                          if (promptText) {
                            setCustomPrompts(prev => [...prev, { name, prompt: promptText, id: Date.now() }]);
                          }
                        }
                      }}
                      className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {customPrompts.map(item => (
                      <div key={item.id} className={`p-2 rounded border flex justify-between items-center ${
                        darkMode ? 'border-gray-600' : 'border-gray-300'
                      }`}>
                        <div>
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs opacity-60 truncate">{item.prompt}</div>
                        </div>
                        <button
                          onClick={() => setCustomPrompts(prev => prev.filter(p => p.id !== item.id))}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Keyboard Shortcuts */}
              <div>
                <h3 className="font-medium mb-3">⌨️ Keyboard Shortcuts</h3>
                <div className={`p-3 rounded-lg text-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="grid grid-cols-2 gap-2">
                    <div><kbd className="bg-gray-500 text-white px-1 rounded">Ctrl+Enter</kbd> Send message</div>
                    <div><kbd className="bg-gray-500 text-white px-1 rounded">Ctrl+N</kbd> New conversation</div>
                    <div><kbd className="bg-gray-500 text-white px-1 rounded">Ctrl+S</kbd> Export conversation</div>
                    <div><kbd className="bg-gray-500 text-white px-1 rounded">Ctrl+K</kbd> Clear chat</div>
                    <div><kbd className="bg-gray-500 text-white px-1 rounded">Ctrl+D</kbd> Toggle dark mode</div>
                    <div><kbd className="bg-gray-500 text-white px-1 rounded">Ctrl+/</kbd> Open settings</div>
                    <div><kbd className="bg-gray-500 text-white px-1 rounded">Ctrl+B</kbd> Toggle branching mode</div>
                    <div><kbd className="bg-gray-500 text-white px-1 rounded">Ctrl+M</kbd> Toggle collaborative mode</div>
                  </div>
                </div>
              </div>
              
              {/* About & Credits */}
              <div>
                <h3 className="font-medium mb-3">ℹ️ About</h3>
                <div className={`p-3 rounded-lg text-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="space-y-2">
                    <div><strong>AI Creative Studio Pro</strong> - Advanced multi-agent writing assistant</div>
                    <div>Built with React, featuring collaborative AI, conversation branching, auto-continue, and advanced analytics</div>
                    <div>Supports multiple API providers: Built-in Claude, Anthropic API, and OpenAI API</div>
                    <div className="text-xs opacity-60 mt-2">
                      Features: Multi-agent collaboration • Conversation branching • Auto-continue responses • Response rating • 
                      Advanced analytics • Project management • Custom prompts • Real-time stats • IndexedDB storage • Export/Import capabilities
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}