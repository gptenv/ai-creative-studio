import { useState, useEffect, useRef, useCallback } from 'react';

export default function AICreativeAssistant() {
  // Core state
  const [conversations, setConversations] = useState([{ id: 'main', name: 'Main Chat', messages: [], agents: ['main'] }]);
  const [activeConversationId, setActiveConversationId] = useState('main');
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // UI state
  const [darkMode, setDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState('chat'); // chat, split, focus, debug
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Advanced features state
  const [aiAgents, setAiAgents] = useState({
    main: { name: 'Creative Assistant', prompt: 'You are a highly creative writing assistant who loves vivid imagery, metaphors, and innovative storytelling techniques.', color: 'purple' },
    analytical: { name: 'Logic Analyzer', prompt: 'You are a precise, analytical writing assistant who focuses on structure, clarity, and logical flow.', color: 'blue' },
    humor: { name: 'Comedy Writer', prompt: 'You are a witty, humorous writing assistant who loves wordplay, clever observations, and making writing fun.', color: 'green' },
    poet: { name: 'Lyrical Poet', prompt: 'You are a poetic, lyrical writing assistant who speaks in beautiful, flowing language.', color: 'pink' },
    critic: { name: 'Critical Editor', prompt: 'You are a sharp, critical editor who provides honest feedback and identifies weaknesses in writing.', color: 'red' },
    researcher: { name: 'Research Assistant', prompt: 'You are a thorough research assistant who helps gather information and verify facts.', color: 'orange' }
  });
  
  const [activeAgents, setActiveAgents] = useState(['main']);
  
  // NEW: Enhanced collaboration features
  const [collaborativeMode, setCollaborativeMode] = useState(false);
  const [collaborationRounds, setCollaborationRounds] = useState(3);
  const [showInternalChat, setShowInternalChat] = useState(false);
  const [internalDiscussion, setInternalDiscussion] = useState([]);
  
  const [autoSave, setAutoSave] = useState(true);
  const [contextLimit, setContextLimit] = useState(20);
  const [responseCache, setResponseCache] = useState(new Map());
  const [apiUsage, setApiUsage] = useState({ requests: 0, tokens: 0, errors: 0 });
  const [projectMode, setProjectMode] = useState(false);
  const [characterBank, setCharacterBank] = useState([]);
  const [worldBank, setWorldBank] = useState([]);
  const [plotPoints, setPlotPoints] = useState([]);
  const [writingStats, setWritingStats] = useState({ words: 0, sentences: 0, avgLength: 0 });
  const [templates, setTemplates] = useState({
    'Hero\'s Journey': 'Write a story following the hero\'s journey structure with clear departure, initiation, and return phases.',
    'Three-Act Structure': 'Create a narrative with clear setup, confrontation, and resolution phases.',
    'Character Study': 'Develop a deep character exploration focusing on internal conflict and growth.',
    'World Building': 'Design a comprehensive fictional world with unique rules, culture, and history.',
    'Dialogue Practice': 'Write realistic dialogue that reveals character and advances plot.',
    'Poetry Forms': 'Experiment with different poetic forms: sonnet, haiku, free verse, villanelle.',
    'Flash Fiction': 'Create a complete story in under 500 words with strong impact.',
    'Screenplay Format': 'Write in proper screenplay format with scene headings and character directions.'
  });
  
  // Advanced settings
  const [advancedSettings, setAdvancedSettings] = useState({
    enableCache: true,
    enableAnalytics: true,
    enableAutoCorrect: false,
    enableStyleCheck: true,
    enableRealTimeStats: true,
    maxRetries: 3,
    timeout: 30000,
    debugMode: false,
    experimentalFeatures: false
  });
  
  // Refs
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const conversationHistoryRef = useRef([]);
  
  // Get active conversation
  const activeConversation = conversations.find(c => c.id === activeConversationId) || conversations[0];
  
  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeConversation.messages]);
  
  // Auto-save conversations
  useEffect(() => {
    if (autoSave && typeof Storage !== 'undefined') {
      try {
        localStorage.setItem('ai-assistant-conversations', JSON.stringify(conversations));
        localStorage.setItem('ai-assistant-settings', JSON.stringify(advancedSettings));
      } catch (e) {
        console.warn('Auto-save failed:', e);
      }
    }
  }, [conversations, advancedSettings, autoSave]);
  
  // Load saved data
  useEffect(() => {
    if (typeof Storage !== 'undefined') {
      try {
        const saved = localStorage.getItem('ai-assistant-conversations');
        if (saved) {
          setConversations(JSON.parse(saved));
        }
        const savedSettings = localStorage.getItem('ai-assistant-settings');
        if (savedSettings) {
          setAdvancedSettings(JSON.parse(savedSettings));
        }
      } catch (e) {
        console.warn('Load failed:', e);
      }
    }
  }, []);
  
  // Update writing stats
  useEffect(() => {
    const text = activeConversation.messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join(' ');
    
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgLength = sentences > 0 ? Math.round(words / sentences) : 0;
    
    setWritingStats({ words, sentences, avgLength });
  }, [activeConversation.messages]);
  
  // Enhanced AI request function with collaborative mode support
  const sendToAI = async (message, agentId = 'main', context = []) => {
    if (!window.claude?.complete) {
      throw new Error('AI functionality not available - please ensure you are viewing this in the artifact preview');
    }

    const agent = aiAgents[agentId];
    const cacheKey = `${agentId}-${message}-${JSON.stringify(context.slice(-contextLimit))}`;
    
    // Check cache first
    if (advancedSettings.enableCache && responseCache.has(cacheKey)) {
      return responseCache.get(cacheKey);
    }

    // Build conversation with agent prompt and context
    const contextMessages = context.length > 0 ? context.slice(-contextLimit) : activeConversation.messages.slice(-contextLimit);
    const messages = [
      { role: 'user', content: `${agent.prompt} Always be helpful and stay in character.` },
      ...contextMessages,
      { role: 'user', content: message }
    ];

    let retries = 0;
    while (retries < advancedSettings.maxRetries) {
      try {
        const response = await window.claude.complete(JSON.stringify(messages));
        
        // Cache successful response
        if (advancedSettings.enableCache) {
          responseCache.set(cacheKey, response);
        }
        
        // Update API usage stats
        setApiUsage(prev => ({
          requests: prev.requests + 1,
          tokens: prev.tokens + (response.length / 4),
          errors: prev.errors
        }));
        
        return response;
        
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

  // NEW: Collaborative AI orchestration
  const facilitateCollaboration = async (userMessage) => {
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
    discussion.push({
      speaker: 'Facilitator',
      content: facilitatorResponse,
      timestamp: new Date().toISOString(),
      id: Date.now()
    });

    // Run collaboration rounds
    for (let round = 0; round < collaborationRounds; round++) {
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

As ${agent.name}, provide your perspective, suggestions, or refinements. Be concise but insightful. If this is a later round, build on or refine previous ideas rather than just repeating them.`;

        try {
          const agentResponse = await sendToAI(agentPrompt, agentId, discussionContext);
          discussion.push({
            speaker: agent.name,
            content: agentResponse,
            timestamp: new Date().toISOString(),
            id: Date.now() + Math.random()
          });
        } catch (error) {
          discussion.push({
            speaker: agent.name,
            content: `Error: ${error.message}`,
            timestamp: new Date().toISOString(),
            id: Date.now() + Math.random(),
            isError: true
          });
        }
      }

      // Facilitator synthesizes after each round (except the last)
      if (round < collaborationRounds - 1) {
        const synthPrompt = `Based on the discussion so far about "${userMessage}", synthesize the key points and guide the next round of discussion. What aspects need more development or consensus?

Discussion so far:
${discussion.map(msg => `${msg.speaker}: ${msg.content}`).join('\n\n')}`;

        const synthResponse = await sendToAI(synthPrompt, 'main', []);
        discussion.push({
          speaker: 'Facilitator',
          content: synthResponse,
          timestamp: new Date().toISOString(),
          id: Date.now() + Math.random()
        });
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

  // NEW: Enhanced submit handler with smart mode selection
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!userInput.trim()) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setIsLoading(true);
    setInternalDiscussion([]); // Clear previous discussion

    try {
      // Add user message
      const newMessages = [...activeConversation.messages, { 
        role: 'user', 
        content: userMessage,
        timestamp: new Date().toISOString(),
        id: Date.now()
      }];
      
      updateConversation(activeConversationId, { messages: newMessages });

      // Determine response mode based on agent selection and collaborative mode
      if (activeAgents.length === 1) {
        // Single agent mode
        const response = await sendToAI(userMessage, activeAgents[0]);
        
        const assistantMessage = {
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
          id: Date.now(),
          agent: activeAgents[0],
          agentName: aiAgents[activeAgents[0]].name
        };
        
        newMessages.push(assistantMessage);
        
      } else if (collaborativeMode) {
        // Collaborative mode - agents discuss and produce unified response
        const { discussion, unifiedResponse } = await facilitateCollaboration(userMessage);
        
        // Store internal discussion for viewing
        setInternalDiscussion(discussion);
        
        const collaborativeMessage = {
          role: 'assistant',
          content: unifiedResponse,
          timestamp: new Date().toISOString(),
          id: Date.now(),
          agent: 'collaborative',
          agentName: `Collaborative Response (${activeAgents.length} agents)`,
          hasInternalDiscussion: true
        };
        
        newMessages.push(collaborativeMessage);
        
      } else {
        // Multi-agent parallel mode - each agent responds separately
        const responses = await sendToMultipleAgents(userMessage);
        
        for (const [agentId, response] of Object.entries(responses)) {
          const agentMessage = {
            role: 'assistant',
            content: response,
            timestamp: new Date().toISOString(),
            id: Date.now() + Math.random(),
            agent: agentId,
            agentName: aiAgents[agentId].name
          };
          
          newMessages.push(agentMessage);
        }
      }
      
      updateConversation(activeConversationId, { messages: newMessages });
      
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date().toISOString(),
        id: Date.now(),
        isError: true
      };
      
      updateConversation(activeConversationId, { 
        messages: [...activeConversation.messages, { role: 'user', content: userMessage, timestamp: new Date().toISOString(), id: Date.now() }, errorMessage]
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Conversation management
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
      created: new Date().toISOString()
    };
    
    setConversations(prev => [...prev, newConv]);
    setActiveConversationId(newId);
  };

  const deleteConversation = (convId) => {
    if (conversations.length <= 1) return;
    
    setConversations(prev => prev.filter(c => c.id !== convId));
    
    if (activeConversationId === convId) {
      setActiveConversationId(conversations[0].id);
    }
  };

  const exportConversation = () => {
    const data = {
      conversation: activeConversation,
      exported: new Date().toISOString(),
      stats: writingStats
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${activeConversation.name}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateFromTemplate = async (template) => {
    setIsLoading(true);
    try {
      const response = await sendToAI(templates[template]);
      const newMessages = [
        ...activeConversation.messages,
        { role: 'user', content: `Template: ${template}`, timestamp: new Date().toISOString(), id: Date.now() },
        { role: 'assistant', content: response, timestamp: new Date().toISOString(), id: Date.now() + 1, agent: 'main' }
      ];
      
      updateConversation(activeConversationId, { messages: newMessages });
    } catch (error) {
      console.error('Template generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard shortcuts
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
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [activeConversationId, activeConversation.messages]);

  // Style analysis
  const analyzeStyle = (text) => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
    const complexity = words.filter(w => w.length > 6).length / words.length;
    const readability = avgSentenceLength < 15 && complexity < 0.3 ? 'Easy' : 
                       avgSentenceLength < 20 && complexity < 0.5 ? 'Medium' : 'Complex';
    
    return { avgSentenceLength: Math.round(avgSentenceLength), complexity: Math.round(complexity * 100), readability };
  };

  const currentStyle = analyzeStyle(
    activeConversation.messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join(' ')
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-purple-50 to-blue-50 text-gray-900'
    }`}>
      <div className="flex h-screen">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className={`w-80 border-r transition-colors ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">🤖 AI Creative Studio</h2>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  ←
                </button>
              </div>
              
              {/* Quick Stats */}
              <div className={`p-3 rounded-lg mb-4 text-sm ${
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className="grid grid-cols-2 gap-2">
                  <div>Words: <span className="font-bold">{writingStats.words}</span></div>
                  <div>Sentences: <span className="font-bold">{writingStats.sentences}</span></div>
                  <div>Avg Length: <span className="font-bold">{writingStats.avgLength}</span></div>
                  <div>Style: <span className="font-bold">{currentStyle.readability}</span></div>
                </div>
              </div>
              
              {/* Conversations */}
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
                    <div 
                      key={conv.id}
                      onClick={() => setActiveConversationId(conv.id)}
                      className={`p-2 rounded cursor-pointer text-sm ${
                        conv.id === activeConversationId
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* AI Agents */}
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
                      <span className="truncate">{agent.name}</span>
                    </label>
                  ))}
                </div>
                
                {/* NEW: Collaborative Mode Controls */}
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
                        <span>Discussion rounds:</span>
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
                        <span>Show internal discussion</span>
                      </label>
                    </div>
                  )}
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
              
              {/* Quick Actions */}
              <div className="space-y-2">
                <button 
                  onClick={exportConversation}
                  className="w-full text-sm p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  📥 Export Chat
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
        <div className="flex-1 flex flex-col">
          {/* Header */}
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
              
              <h1 className="text-xl font-bold">{activeConversation.name}</h1>
              
              <div className="flex items-center space-x-2 text-sm">
                {activeAgents.map(agentId => (
                  <span 
                    key={agentId}
                    className={`px-2 py-1 rounded text-xs bg-${aiAgents[agentId].color}-500 text-white`}
                  >
                    {aiAgents[agentId].name}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* View Mode Selector */}
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
              
              {/* API Status */}
              <div className={`text-xs px-2 py-1 rounded ${
                window.claude?.complete ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {window.claude?.complete ? 'AI ✅' : 'AI ❌'}
              </div>
            </div>
          </div>
          
          {/* Chat Area with Internal Discussion Panel */}
          <div className="flex-1 flex">
            <div 
              ref={chatContainerRef}
              className={`flex-1 overflow-y-auto p-4 ${
                viewMode === 'focus' ? 'max-w-4xl mx-auto' : ''
              }`}
            >
              {activeConversation.messages.length === 0 ? (
                <div className="text-center mt-20">
                  <h2 className="text-2xl font-bold mb-4">🚀 Advanced AI Creative Studio</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Your professional AI writing companion with advanced collaboration features
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
                      <div className="text-2xl mb-2">🤖</div>
                      <div className="text-sm font-medium">Multi-Agent</div>
                      <div className="text-xs opacity-60">6 AI personalities</div>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
                      <div className="text-2xl mb-2">🤝</div>
                      <div className="text-sm font-medium">Collaboration</div>
                      <div className="text-xs opacity-60">Unified responses</div>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
                      <div className="text-2xl mb-2">📊</div>
                      <div className="text-sm font-medium">Analytics</div>
                      <div className="text-xs opacity-60">Real-time insights</div>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
                      <div className="text-2xl mb-2">⚡</div>
                      <div className="text-sm font-medium">Power Tools</div>
                      <div className="text-xs opacity-60">Advanced features</div>
                    </div>
                  </div>
                  
                  <div className="mt-8 text-sm opacity-60">
                    <p>Select multiple agents for parallel responses • Enable Collaborative Mode for unified responses</p>
                    <p>Press Ctrl+/ for shortcuts • Ctrl+N for new chat • Ctrl+S to export</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeConversation.messages.map((message, index) => (
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
                                Collaborative
                              </span>
                            )}
                            {message.timestamp && (
                              <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                            )}
                          </div>
                          
                          {message.hasInternalDiscussion && (
                            <button
                              onClick={() => setShowInternalChat(!showInternalChat)}
                              className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              {showInternalChat ? 'Hide' : 'Show'} Discussion
                            </button>
                          )}
                          
                          {viewMode === 'debug' && (
                            <div className="text-xs opacity-50">
                              ID: {message.id} | Agent: {message.agent || 'none'}
                            </div>
                          )}
                        </div>
                        
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        
                        {advancedSettings.enableAnalytics && message.role === 'assistant' && (
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs opacity-60">
                            Length: {message.content.length} chars • Words: {message.content.split(/\s+/).length}
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
                            ? `${activeAgents.length} agents collaborating...` 
                            : activeAgents.length > 1 
                              ? `${activeAgents.length} agents responding...`
                              : 'AI thinking...'
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
            
            {/* NEW: Internal Discussion Panel */}
            {showInternalChat && internalDiscussion.length > 0 && (
              <div className={`w-80 border-l p-4 overflow-y-auto ${
                darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-sm">🤝 Internal Discussion</h3>
                  <button
                    onClick={() => setShowInternalChat(false)}
                    className="text-xs opacity-60 hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-3">
                  {internalDiscussion.map((msg, index) => (
                    <div key={msg.id || index} className={`p-3 rounded-lg text-sm border ${
                      msg.speaker === 'Facilitator'
                        ? darkMode ? 'bg-blue-900 border-blue-700' : 'bg-blue-100 border-blue-300'
                        : msg.isError
                          ? darkMode ? 'bg-red-900 border-red-700' : 'bg-red-100 border-red-300'
                          : darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                    }`}>
                      <div className="font-medium text-xs mb-1 opacity-70">
                        {msg.speaker} • {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Input Area */}
          <div className={`p-4 border-t ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {/* Quick Actions */}
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
                  
                  <div className="text-xs opacity-60">
                    {activeAgents.length} agent{activeAgents.length !== 1 ? 's' : ''} • 
                    {activeAgents.length > 1 ? (collaborativeMode ? ' Collaborative' : ' Parallel') : ' Single'}
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
            
            {/* Status Bar */}
            <div className="flex items-center justify-between mt-2 text-xs opacity-60">
              <div className="flex items-center space-x-4">
                <span>Context: {activeConversation.messages.length}/{contextLimit * 2}</span>
                <span>Cache: {responseCache.size} items</span>
                <span>API: {apiUsage.requests} req, {apiUsage.errors} err</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {advancedSettings.enableCache && <span>💾 Cache</span>}
                {advancedSettings.enableAnalytics && <span>📊 Analytics</span>}
                {advancedSettings.debugMode && <span>🔧 Debug</span>}
                {autoSave && <span>💾 Auto-save</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-lg p-6 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">⚙️ Advanced Settings</h2>
              <button 
                onClick={() => setSettingsOpen(false)}
                className="text-2xl hover:opacity-60"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
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
                </div>
              </div>
              
              {/* Features */}
              <div>
                <h3 className="font-medium mb-3">🔧 Features</h3>
                <div className="space-y-3">
                  {Object.entries(advancedSettings).filter(([key]) => 
                    ['enableAnalytics', 'enableAutoCorrect', 'enableStyleCheck', 'enableRealTimeStats', 'debugMode', 'experimentalFeatures'].includes(key)
                  ).map(([key, value]) => (
                    <label key={key} className="flex items-center justify-between">
                      <span>{key.replace('enable', '').replace(/([A-Z])/g, ' $1')}</span>
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
              
              {/* NEW: Collaboration Settings */}
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
                    className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    🗑️ Clear Cache & Reset Stats
                  </button>
                  
                  <button 
                    onClick={() => {
                      if (confirm('This will delete all conversations. Are you sure?')) {
                        setConversations([{ id: 'main', name: 'Main Chat', messages: [], agents: ['main'] }]);
                        setActiveConversationId('main');
                      }
                    }}
                    className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    🗑️ Delete All Conversations
                  </button>
                </div>
              </div>
              
              {/* API Usage Stats */}
              <div>
                <h3 className="font-medium mb-3">📊 API Usage</h3>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Requests</div>
                      <div className="text-lg">{apiUsage.requests}</div>
                    </div>
                    <div>
                      <div className="font-medium">Est. Tokens</div>
                      <div className="text-lg">{Math.round(apiUsage.tokens)}</div>
                    </div>
                    <div>
                      <div className="font-medium">Errors</div>
                      <div className="text-lg">{apiUsage.errors}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Keyboard Shortcuts */}
              <div>
                <h3 className="font-medium mb-3">⌨️ Keyboard Shortcuts</h3>
                <div className={`p-3 rounded-lg text-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Ctrl+Enter: Send message</div>
                    <div>Ctrl+N: New conversation</div>
                    <div>Ctrl+S: Export conversation</div>
                    <div>Ctrl+K: Clear chat</div>
                    <div>Ctrl+D: Toggle dark mode</div>
                    <div>Ctrl+/: Open settings</div>
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