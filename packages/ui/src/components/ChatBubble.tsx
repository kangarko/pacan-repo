'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, MessageCircle, Send, ArrowLeft, ArrowRight, Mail, User } from 'lucide-react';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

interface StoredData {
    messages: Message[];
    email: string;
    name: string;
}

const ChatBubble = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [showContactForm, setShowContactForm] = useState(false);
    const [contactData, setContactData] = useState({ name: '', email: '' });
    const [hasSubmittedContact, setHasSubmittedContact] = useState(false);
    const [contactFormStep, setContactFormStep] = useState<'email' | 'name'>('email');
    const [emailError, setEmailError] = useState('');
    const [nameError, setNameError] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load data from cookies on mount
    useEffect(() => {
        const loadFromCookies = () => {
            const cookieData = document.cookie
                .split('; ')
                .find(row => row.startsWith('vibetoexit_chat='));
            
            if (cookieData) {
                try {
                    const data: StoredData = JSON.parse(decodeURIComponent(cookieData.split('=')[1]));
                    if (data.messages)
                        setMessages(data.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
                    if (data.email) {
                        setContactData(prev => ({ ...prev, email: data.email }));
                        if (data.name) {
                            setContactData(prev => ({ ...prev, name: data.name }));
                            setHasSubmittedContact(true);
                        }
                    }
                } catch (e) {
                    // Invalid cookie data, ignore
                }
            }
        };

        loadFromCookies();
    }, []);

    // Save to cookies whenever data changes
    useEffect(() => {
        const dataToStore: StoredData = {
            messages,
            email: contactData.email,
            name: contactData.name
        };
        
        document.cookie = `vibetoexit_chat=${encodeURIComponent(JSON.stringify(dataToStore))}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
    }, [messages, contactData]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const validateEmail = (email: string): boolean => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            isUser: true,
            timestamp: new Date()
        };

        setMessages([...messages, newMessage]);
        setInputValue('');

        // Show contact form only after first message if not already submitted
        if (!hasSubmittedContact && messages.length === 0) {
            setTimeout(() => {
                setShowContactForm(true);
                setContactFormStep('email');
            }, 500);
        } else if (hasSubmittedContact) {
            // Simulate bot response for subsequent messages
            setTimeout(() => {
                const responses = [
                    "Thanks for your message! Our team will review this and get back to you soon.",
                    "I've noted your question. We'll include this in our response.",
                    "Great question! We'll make sure to address this when we reply.",
                    "Thanks for the additional context. This helps us provide a better answer.",
                    "Noted! Is there anything else you'd like to know about the workshop?"
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                
                const botMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    text: randomResponse,
                    isUser: false,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botMessage]);
            }, 1000);
        }
    };

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError('');
        
        if (!contactData.email.trim()) {
            setEmailError('Email is required');
            return;
        }
        
        if (!validateEmail(contactData.email)) {
            setEmailError('Please enter a valid email address');
            return;
        }

        setContactFormStep('name');
    };

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setNameError('');
        
        if (!contactData.name.trim()) {
            setNameError('Name is required');
            return;
        }
        
        if (contactData.name.trim().length < 2) {
            setNameError('Name must be at least 2 characters');
            return;
        }

        setHasSubmittedContact(true);
        setShowContactForm(false);

        const thankYouMessage: Message = {
            id: Date.now().toString(),
            text: `Thanks ${contactData.name}! We've received your question and will get back to you at ${contactData.email} within 24 hours. Feel free to ask any additional questions while you wait.`,
            isUser: false,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, thankYouMessage]);
    };

    const handleClose = () => {
        setIsOpen(false);
        // Don't reset state - keep it in cookies
    };

    return (
        <>
            {/* Chat Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-300 z-50 ${
                    isOpen ? 'scale-0' : 'scale-100'
                }`}
                aria-label="Open chat"
            >
                <MessageCircle className="w-6 h-6 text-white" />
                {/* Pulse animation */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 animate-ping opacity-20"></div>
            </button>

            {/* Chat Window - Animation from bottom right */}
            <div
                className={`fixed bottom-6 right-6 w-full sm:w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-gray-900 rounded-2xl shadow-2xl transition-all duration-300 z-50 flex flex-col overflow-hidden border border-gray-800 origin-bottom-right ${
                    isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                }`}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                            <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-white font-semibold truncate">Vibe To Exit Support</h3>
                            <p className="text-white/80 text-sm truncate">We typically reply within minutes</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white/80 hover:text-white transition-colors shrink-0 ml-2"
                        aria-label="Close chat"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-950 min-h-0">
                    {messages.length === 0 && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-8 h-8 text-white" />
                            </div>
                            <h4 className="text-white font-semibold mb-2">Welcome! 👋</h4>
                            <p className="text-gray-400 text-sm px-4">Ask us anything about the Vibe To Exit workshop</p>
                        </div>
                    )}

                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                    message.isUser
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                        : 'bg-gray-800 text-gray-100'
                                }`}
                            >
                                <p className="text-sm break-words">{message.text}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Contact Form Overlay - Two Step */}
                {showContactForm && !hasSubmittedContact && (
                    <div className="absolute inset-0 bg-gray-900 z-10 flex flex-col">
                        <div className="p-4 border-b border-gray-800 shrink-0">
                            <button
                                onClick={() => {
                                    setShowContactForm(false);
                                    setContactFormStep('email');
                                    setEmailError('');
                                    setNameError('');
                                }}
                                className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to chat
                            </button>
                        </div>
                        <div className="flex-1 p-6 flex items-center justify-center overflow-y-auto">
                            {/* Email Step */}
                            {contactFormStep === 'email' && (
                                <form onSubmit={handleEmailSubmit} className="w-full max-w-sm space-y-4">
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Mail className="w-8 h-8 text-white" />
                                        </div>
                                        <h4 className="text-xl font-semibold text-white mb-2">What's your email?</h4>
                                        <p className="text-gray-400 text-sm">We'll use this to send you our response</p>
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={contactData.email}
                                            onChange={(e) => {
                                                setContactData({ ...contactData, email: e.target.value });
                                                setEmailError('');
                                            }}
                                            className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white focus:outline-none transition-colors ${
                                                emailError ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-indigo-500'
                                            }`}
                                            placeholder="john@example.com"
                                            autoFocus
                                        />
                                        {emailError && (
                                            <p className="mt-2 text-sm text-red-400">{emailError}</p>
                                        )}
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                    >
                                        Continue
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </form>
                            )}

                            {/* Name Step */}
                            {contactFormStep === 'name' && (
                                <form onSubmit={handleNameSubmit} className="w-full max-w-sm space-y-4">
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <User className="w-8 h-8 text-white" />
                                        </div>
                                        <h4 className="text-xl font-semibold text-white mb-2">And your name?</h4>
                                        <p className="text-gray-400 text-sm">So we know who we're talking to</p>
                                    </div>
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                            Your Name
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            value={contactData.name}
                                            onChange={(e) => {
                                                setContactData({ ...contactData, name: e.target.value });
                                                setNameError('');
                                            }}
                                            className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white focus:outline-none transition-colors ${
                                                nameError ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-indigo-500'
                                            }`}
                                            placeholder="John Doe"
                                            autoFocus
                                        />
                                        {nameError && (
                                            <p className="mt-2 text-sm text-red-400">{nameError}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setContactFormStep('email')}
                                            className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                                        >
                                            Submit
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}

                {/* Input Area */}
                {!showContactForm && (
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800 shrink-0">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors text-sm sm:text-base"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim()}
                                className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </>
    );
};

export default ChatBubble; 