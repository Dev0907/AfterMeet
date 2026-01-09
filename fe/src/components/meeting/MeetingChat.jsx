
import React, { useState, useRef, useEffect } from 'react';
import NeoButton from '../ui/NeoButton';
import { MessageCircle, Send, Loader2, Sparkles } from 'lucide-react';

/**
 * MeetingChat - AI chat panel for asking questions about the meeting
 */
const MeetingChat = ({
    meetingId,
    onSendMessage,
    isLoading = false,
}) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const suggestedPrompts = [
        "What are the biggest risks discussed?",
        "Who owns the backend tasks?",
        "What deadlines were mentioned?",
        "Summarize the key decisions made.",
        "What was the overall sentiment?",
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (messageText = input) => {
        if (!messageText.trim() || isProcessing) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            text: messageText.trim(),
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsProcessing(true);

        try {
            // Simulate API call (replace with actual onSendMessage)
            if (onSendMessage) {
                const response = await onSendMessage(messageText);
                const aiMessage = {
                    id: Date.now() + 1,
                    type: 'assistant',
                    text: response.response,
                    references: response.references,
                    timestamp: new Date().toISOString(),
                };
                setMessages(prev => [...prev, aiMessage]);
            } else {
                // Demo response
                await new Promise(resolve => setTimeout(resolve, 1500));
                const aiMessage = {
                    id: Date.now() + 1,
                    type: 'assistant',
                    text: `Based on the meeting transcript, here's what I found:\n\n• **Sarah Chen** mentioned prioritizing the dashboard wireframes as critical\n• **Mike Johnson** raised concerns about API monitoring infrastructure (timestamp: 00:03:42)\n• The team agreed on January 15th as the deadline for wireframes\n\nWould you like me to elaborate on any of these points?`,
                    timestamp: new Date().toISOString(),
                };
                setMessages(prev => [...prev, aiMessage]);
            }
        } catch (error) {
            const errorMessage = {
                id: Date.now() + 1,
                type: 'error',
                text: 'Sorry, I encountered an error processing your question. Please try again.',
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="bg-white border-4 border-black shadow-neo flex flex-col h-auto lg:h-[calc(100vh-8rem)] min-h-[400px] max-h-[500px] lg:max-h-none">
            {/* Header */}
            <div className="p-4 border-b-4 border-black bg-neo-dark">
                <h3 className="flex items-center gap-2 font-black uppercase text-black">
                    <MessageCircle size={20} />
                    Chat with Meeting
                    <Sparkles size={16} className="text-neo-yellow" />
                </h3>
                <p className="text-xs font-medium mt-1 text-gray-700">
                    Ask questions about this meeting
                </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neo-white">
                {messages.length === 0 ? (
                    <div className="text-center py-8">
                        <Sparkles size={48} className="mx-auto mb-4 text-neo-dark" />
                        <p className="font-bold text-gray-600 mb-4">
                            Ask me anything about this meeting!
                        </p>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500 mb-2">
                                Try these prompts:
                            </p>
                            {suggestedPrompts.slice(0, 3).map((prompt, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSend(prompt)}
                                    className="
                                        block w-full text-left px-3 py-2 text-sm
                                        bg-white border-2 border-black font-medium
                                        hover:bg-neo-yellow hover:shadow-neo-sm
                                        transition-all
                                    "
                                >
                                    "{prompt}"
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`
                                flex
                                ${message.type === 'user' ? 'justify-end' : 'justify-start'}
                            `}
                        >
                            <div
                                className={`
                                    max-w-[85%] p-3 border-2 border-black
                                    ${message.type === 'user'
                                        ? 'bg-neo-teal'
                                        : message.type === 'error'
                                            ? 'bg-neo-red'
                                            : 'bg-white shadow-neo-sm'
                                    }
                                `}
                            >
                                {message.type === 'assistant' && (
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-1">
                                        <Sparkles size={12} />
                                        AI Assistant
                                    </div>
                                )}
                                <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
                                    {message.text}
                                </p>
                            </div>
                        </div>
                    ))
                )}

                {isProcessing && (
                    <div className="flex justify-start">
                        <div className="bg-white border-2 border-black p-3 shadow-neo-sm">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                                <Loader2 size={16} className="animate-spin" />
                                Analyzing question...
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t-4 border-black bg-white">
                <div className="flex gap-2">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question about this meeting..."
                        disabled={isProcessing}
                        rows={1}
                        className="
                            flex-1 bg-neo-white text-black font-medium py-2 px-3
                            border-4 border-black outline-none resize-none
                            focus:shadow-neo-sm transition-all
                            placeholder:text-gray-500
                            disabled:opacity-50 disabled:cursor-not-allowed
                        "
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isProcessing}
                        className="
                            px-4 py-2 bg-neo-yellow border-4 border-black
                            font-bold uppercase shadow-neo
                            hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-hover
                            active:translate-x-1 active:translate-y-1 active:shadow-none
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0
                            transition-all
                        "
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MeetingChat;
