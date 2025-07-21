import React, { useState, useMemo, useRef } from 'react';
import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions/completions';

import './LlmChat.css'; // Assuming you have some styles defined in this file

interface LLM {
  name: string;
  baseUri: string;
  apiKey: string;
  model: string;
}

export interface LlmChatProps {
  placeholder?: string;
  baseUrl?: string;
  apiKey?: string;
  llm?: LLM;
  llms?: LLM[];
  prompt?: string;
  onResult?: (result: string) => void;
  color?: string;
  backgroundColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
  withHistory?: boolean;
  withPrompt?: boolean;
}

const createClient = (baseUrl: string, apiKey: string): OpenAI => {
  return new OpenAI({
    baseURL: baseUrl,
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
};

export const LlmChat: React.FC<LlmChatProps> = ({
  baseUrl,
  apiKey,
  llm,
  prompt = '',
  onResult,
  color = '#000000',
  backgroundColor = '#ffffff',
  primaryColor = '#000000',
  secondaryColor = '#ffffff',
  llms = [],
  placeholder = 'type your message...',
  withHistory = false,
  withPrompt = true,
}) => {
  const normalizedLLMs = llm ? [llm] : llms;

  const [input, setInput] = useState<string>('');
  const [selectedLLM, setSelectedLLM] = useState<LLM | null>(
    normalizedLLMs.length > 0 ? normalizedLLMs[0] : null
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const historyRef = useRef<ChatCompletionMessageParam[]>(
    withPrompt && prompt ? [{ role: 'system', content: prompt }] : []
  );

  const clients = useMemo(() => {
    const map = new Map<string, OpenAI>();
    if (baseUrl && apiKey) {
      map.set('single', createClient(baseUrl, apiKey));
    }
    normalizedLLMs.forEach((llm) => {
      map.set(llm.name, createClient(llm.baseUri, llm.apiKey));
    });
    return map;
  }, [baseUrl, apiKey, normalizedLLMs]);

  const getCurrentClient = (): OpenAI | undefined => {
    return selectedLLM ? clients.get(selectedLLM.name) : clients.get('single');
  };

  const getCurrentModel = (): string | undefined => {
    return selectedLLM ? selectedLLM.model : llm?.model;
  };

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;

    const client = getCurrentClient();
    const currentModel = getCurrentModel();

    if (!client || !currentModel) {
      console.error('Client or model is not defined');
      return;
    }

    const userMessage: ChatCompletionMessageParam = { role: 'user', content: input };
    const messages: ChatCompletionMessageParam[] = [...historyRef.current, userMessage];

    setLoading(true); // Set loading to true
    try {
      const response = await client.chat.completions.create({
        model: currentModel,
        messages: messages,
      });

      const message = response.choices?.[0]?.message?.content || '';
      if (message) {
        historyRef.current.push(userMessage);
        historyRef.current.push({ role: 'assistant', content: message });
        if (onResult) onResult(message);
      }

      setInput('');
    } catch (err) {
      console.error('Chat completion error:', err);
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  return (
    <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
      {withHistory && (
        <div
          style={{
            height: '500px',
            maxHeight: '200px',
            overflowY: 'auto',
            marginBottom: '1rem',
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9',
            textAlign: 'left',
          }}
        >
          {historyRef.current.filter((message) => message.content).map((message, index) => (
            <div key={index} style={{ marginBottom: '0.5rem' }}>
              <strong>{message.role}:</strong>{' '}
              {Array.isArray(message.content)
                ? message.content.map((part, idx) => <span key={idx}>{part.toString()}</span>)
                : message.content || ''}
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderRadius: '12px',
          backgroundColor: backgroundColor,
          padding: '0.5rem',
          position: 'relative',
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={placeholder || 'Type your message...'}
          rows={2}
          disabled={loading} // Disable textarea while loading
          style={{
            flex: 1,
            resize: 'none',
            border: 'none',
            outline: 'none',
            fontSize: '1rem',
            padding: '0.5rem',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            color: color,
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={loading} // Disable button while loading
          style={{
            marginLeft: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: primaryColor,
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            {loading ? (
              <div
                style={{
                border: '2px solid transparent',
                borderTop: `2px solid ${secondaryColor}`,
                borderRight: `2px solid ${secondaryColor}`,
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                animation: 'chat-spin 1s linear infinite',
                }}
              />
            ) : (
              'Send'
            )}
        </button>
        {normalizedLLMs.length > 1 && (
          <div
            style={{
              marginLeft: '0.5rem',
              position: 'relative',
            }}
          >
            <div
              style={{
                backgroundColor: secondaryColor,
                borderRadius: '12px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '1rem',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {selectedLLM?.name || 'Choose LLM'}
            </div>
            {isDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  zIndex: 10,
                  width: '100%',
                }}
              >
                {normalizedLLMs.map((llm) => (
                  <div
                    key={llm.name}
                    onClick={() => {
                      setSelectedLLM(llm);
                      historyRef.current =
                        withPrompt && prompt ? [{ role: 'system', content: prompt }] : [];
                      setIsDropdownOpen(false);
                    }}
                    style={{
                      padding: '0.5rem',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      backgroundColor: selectedLLM?.name === llm.name ? '#e0e0e0' : '#fff',
                      fontSize: '1rem',
                    }}
                  >
                    {llm.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LlmChat;
