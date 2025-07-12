'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw, XCircle, Loader2, Mail, Zap, MoreVertical, Trash2, Archive, AlertCircle, Facebook, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { fetchJsonPost, formatDate } from '@repo/ui/lib/utils';
import { createSupabaseClient, sendClientErrorEmail, safeLocalStorageGet, safeLocalStorageSet } from '@repo/ui/lib/clientUtils';
import { getSupportEmailConversationCache, setSupportEmailConversationCache, deleteSupportEmailConversationCache, getSupportEmailThreadsCache, setSupportEmailThreadsCache, getSupportFbConversationCache, setSupportFbConversationCache, deleteSupportFbConversationCache, getSupportFbThreadsCache, setSupportFbThreadsCache } from '@repo/ui/lib/dbUtils';
import { EmailThreadSummary, EmailMessage, FacebookThreadSummary, FacebookMessage } from '@repo/ui/lib/types';
import EmailMessageContent from '@repo/ui/components/admin/EmailMessageContent';

const SUPPORT_ACTIVE_SOURCE_LS_KEY = 'support_activeSource';
const LAST_EMAIL_THREAD_ID_LS_KEY = 'support_lastSelectedEmailThreadId';
const LAST_FB_THREAD_ID_LS_KEY = 'support_lastSelectedFbThreadId';

const cleanClientSnippet = (snippetText: string | undefined): string => {
    if (!snippetText) return '';

    const lines = snippetText.split('\n');
    const contentLines: string[] = [];
    let skipMimeHeaderMode = false;

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (/^--[a-zA-Z0-9_-]+/.test(trimmedLine)) {
            skipMimeHeaderMode = true;
            continue;
        }

        if (skipMimeHeaderMode) {
            if (trimmedLine === '') {
                skipMimeHeaderMode = false;
            }
            continue;
        }

        if (trimmedLine !== '') {
            contentLines.push(trimmedLine);
        } else if (contentLines.length > 0 && contentLines[contentLines.length - 1] !== ' ') {
            contentLines.push(' ');
        }
    }

    const cleaned = contentLines.join(' ').replace(/\s\s+/g, ' ').trim();

    if (cleaned === '' && snippetText.trim() !== '') 
        return '[Non-displayable content]';    

    return cleaned;
};

export function SupportTab() {
    const [activeSource, setActiveSource] = useState<'email' | 'facebook'>(() =>
        (safeLocalStorageGet(SUPPORT_ACTIVE_SOURCE_LS_KEY, 'email') as 'email' | 'facebook')
    );
    const [emailThreads, setEmailThreads] = useState<EmailThreadSummary[]>([]);
    const [facebookThreads, setFacebookThreads] = useState<FacebookThreadSummary[]>([]);
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null); // Email addr or FB convo ID
    const [currentEmailConversation, setCurrentEmailConversation] = useState<EmailMessage[]>([]);
    const [currentFbConversation, setCurrentFbConversation] = useState<FacebookMessage[]>([]);
    const [draftReply, setDraftReply] = useState<string>('');
    const [isLoadingThreads, setIsLoadingThreads] = useState(true);
    const [isLoadingConversation, setIsLoadingConversation] = useState(false);
    const [isGeneratingReply, setIsGeneratingReply] = useState(false);
    const [isSendingReply, setIsSendingReply] = useState(false);
    const [draftReplyTranslation, setDraftReplyTranslation] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [openDropdownThreadId, setOpenDropdownThreadId] = useState<string | null>(null);
    const [movingThreadId, setMovingThreadId] = useState<string | null>(null); 
    const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
    const [isRefreshingThreads, setIsRefreshingThreads] = useState(false);
    const [isReadjustModalOpen, setIsReadjustModalOpen] = useState(false);
    const [readjustInstructions, setReadjustInstructions] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null); 
    const conversationContainerRef = useRef<HTMLDivElement>(null);
    const [adminFromEmail, setAdminFromEmail] = useState<string | null>(null);
    const [mobileThreadsOpen, setMobileThreadsOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Fetch user session on mount to get pageId
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await createSupabaseClient().auth.getUser();

            setCurrentUser(user || null);
        };
        fetchUser();
    }, []);

    const fetchThreads = useCallback(async (source: 'email' | 'facebook', isBackground = false) => {
        if (!isBackground) setIsLoadingThreads(true);
        else setIsRefreshingThreads(true);
        setError(null);
        try {
            let fetchedThreads: any[] = [];
            if (source === 'email') {
                const data = await fetchJsonPost('/api/admin/email', {
                    action: 'get_threads'
                });
                fetchedThreads = data.threads || [];
                setEmailThreads(fetchedThreads as EmailThreadSummary[]);
                await setSupportEmailThreadsCache(fetchedThreads as EmailThreadSummary[]); // Correct
            } else {
                if (!currentUser?.user_metadata?.facebook_integration?.pageId)
                    throw new Error("Cannot fetch FB threads: Page ID not found in user metadata. Metadata is: " + JSON.stringify(currentUser?.user_metadata));

                const data = await fetchJsonPost('/api/admin/facebook', {
                    action: 'get_threads'
                });
                fetchedThreads = data.threads || [];
                setFacebookThreads(fetchedThreads as FacebookThreadSummary[]);
                await setSupportFbThreadsCache(fetchedThreads as FacebookThreadSummary[]);
            }
        } catch (err: any) {
            setError(`Failed to load ${source} threads: ${err.message}`);
            if (!isBackground) sendClientErrorEmail(`Error fetching ${source} support threads:`, err);
        } finally {
            if (!isBackground) setIsLoadingThreads(false);
            setIsRefreshingThreads(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]); // Depend on currentUser to get pageId

    useEffect(() => {
        const loadInitialData = async () => {
            const initialSource = (safeLocalStorageGet(SUPPORT_ACTIVE_SOURCE_LS_KEY, 'email') as 'email' | 'facebook');
            setActiveSource(initialSource);
            let lastSelectedId: string | null = null;
            let initialConversation: any[] | undefined;
            let initialThreads: any[] | undefined;
            let fetchedThreadsFromCache = false;

            try {
                if (initialSource === 'email') {
                    initialThreads = await getSupportEmailThreadsCache(); // Correct
                    if (initialThreads) {
                        setEmailThreads(initialThreads);
                        fetchedThreadsFromCache = true;
                    }
                } else {
                    initialThreads = await getSupportFbThreadsCache();
                    if (initialThreads) {
                        setFacebookThreads(initialThreads);
                        fetchedThreadsFromCache = true;
                    }
                }
                if (fetchedThreadsFromCache) setIsLoadingThreads(false);
            } catch (e) {
                throw new Error(`Failed to get ${initialSource} threads cache: ${e}`);
            }

            try {
                const lastIdKey = initialSource === 'email' ? LAST_EMAIL_THREAD_ID_LS_KEY : LAST_FB_THREAD_ID_LS_KEY;
                lastSelectedId = safeLocalStorageGet(lastIdKey, '');
                if (lastSelectedId) {
                    if (initialSource === 'email') {
                        initialConversation = await getSupportEmailConversationCache(lastSelectedId); // Correct
                        if (initialConversation) setCurrentEmailConversation(initialConversation);
                    } else {
                        initialConversation = await getSupportFbConversationCache(lastSelectedId);
                        // Format FB conversation dates immediately after loading from cache
                        const formattedFbConvo = initialConversation?.map(msg => ({
                            ...msg,
                            date: new Date(String(msg.created_time || Date.now())).getTime()
                        })).sort((a, b) => a.date - b.date) || [];
                        if (formattedFbConvo) setCurrentFbConversation(formattedFbConvo as FacebookMessage[]);
                    }

                    setSelectedThreadId(lastSelectedId);
                }
            } catch (e) {
                const lastIdKey = initialSource === 'email' ? LAST_EMAIL_THREAD_ID_LS_KEY : LAST_FB_THREAD_ID_LS_KEY;
                safeLocalStorageSet(lastIdKey, ''); // Clear invalid item
                if (lastSelectedId) {
                    if (initialSource === 'email') {
                        await deleteSupportEmailConversationCache(lastSelectedId); // Correct
                    } else {
                        await deleteSupportFbConversationCache(lastSelectedId);
                    }
                }

                throw new Error(`Failed to parse last ${initialSource} thread ID or get conversation cache: ${e}`);
            }

            if (!fetchedThreadsFromCache) {
                if (currentUser !== null) 
                    fetchThreads(initialSource);   
            }

            if (lastSelectedId && !initialConversation) 
               handleSelectThread(lastSelectedId, initialSource, true);            
        };
        
        if (currentUser !== null) 
            loadInitialData();
        
    }, [currentUser, fetchThreads]); 

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (currentUser !== null) 
                fetchThreads(activeSource, true);            
        }, 15000);
        return () => clearInterval(intervalId);
    }, [fetchThreads, activeSource, currentUser]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';

            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [draftReply]);

    useEffect(() => {
        if (conversationContainerRef.current && !isLoadingConversation) { 
            setTimeout(() => {
                if (conversationContainerRef.current) { 
                    conversationContainerRef.current.scrollTop = conversationContainerRef.current.scrollHeight;
                }
            }, 0); 
        }
    }, [currentEmailConversation, currentFbConversation, isLoadingConversation]);

    const handleSourceChange = (newSource: 'email' | 'facebook') => {
        if (newSource === activeSource) 
            return;

        setActiveSource(newSource);
        safeLocalStorageSet(SUPPORT_ACTIVE_SOURCE_LS_KEY, newSource);
        setSelectedThreadId(null);
        setCurrentEmailConversation([]);
        setCurrentFbConversation([]);
        setDraftReply('');
        setDraftReplyTranslation('');
        setError(null);
        const threadsExist = newSource === 'email' ? emailThreads.length > 0 : facebookThreads.length > 0;
        if (!threadsExist) {
            if (currentUser !== null) {
                setIsLoadingThreads(true);
                fetchThreads(newSource);
            } else {
                setError("User session not loaded yet, cannot fetch threads.");
            }
        } else {
            const lastIdKey = newSource === 'email' ? LAST_EMAIL_THREAD_ID_LS_KEY : LAST_FB_THREAD_ID_LS_KEY;
            const lastId = safeLocalStorageGet(lastIdKey, '');
            if (lastId) {
                handleSelectThread(lastId, newSource, true);
            }
        }
    };

    

    const handleSelectThread = async (threadId: string, source: 'email' | 'facebook', isInitialLoad = false) => {
        if (!isInitialLoad) {
            setSelectedThreadId(threadId);
            const lastIdKey = source === 'email' ? LAST_EMAIL_THREAD_ID_LS_KEY : LAST_FB_THREAD_ID_LS_KEY;
            
            safeLocalStorageSet(lastIdKey, threadId);
        }
        setIsLoadingConversation(true);
        setDraftReply('');
        setDraftReplyTranslation('');
        setError(null);
        let cachedConvo: any[] | undefined;
        try {
            if (source === 'email') {
                cachedConvo = await getSupportEmailConversationCache(threadId); // Correct
                if (cachedConvo) setCurrentEmailConversation(cachedConvo);
                else setCurrentEmailConversation([]);
            } else {
                cachedConvo = await getSupportFbConversationCache(threadId);
                const formattedFbConvo = cachedConvo?.map(msg => ({
                    ...msg,
                    date: new Date(String(msg.created_time || Date.now())).getTime()
                })).sort((a, b) => a.date - b.date) || [];
                
                setCurrentFbConversation(formattedFbConvo as FacebookMessage[]);
            }
            
        } catch (e) {
            sendClientErrorEmail(`Error loading ${source} conversation cache for ${threadId}:`, e);

            if (source === 'email')
                setCurrentEmailConversation([]);
            else
                setCurrentFbConversation([]);
        }
        try {
            let fetchedConversation: any[] = [];
            if (source === 'email') {
                const data = await fetchJsonPost('/api/admin/email', {
                    action: 'get_thread',
                    thread_id: threadId
                });
                fetchedConversation = (data.conversation || []) as EmailMessage[]; // Cast here
                setCurrentEmailConversation(fetchedConversation);
                
                await setSupportEmailConversationCache(threadId, fetchedConversation); // Cache immediately
                
                if (!data.admin_from)
                    throw new Error("Admin from email not found in thread data.");

                setAdminFromEmail(String(data.admin_from).toLowerCase());
                
                fetchedConversation.forEach((msg: EmailMessage) => {
                    // Only trigger if no translation exists (allows cache to work)
                    if (!msg.translated_text) {
                        // Temporarily disabled
                    }
                });
            } else {
                const data = await fetchJsonPost('/api/admin/facebook', {
                    action: 'get_thread',
                    conversation_id: threadId
                });
                fetchedConversation = data.conversation || [];
                const formattedFbConversation = fetchedConversation.map(msg => ({
                    ...msg,
                    date: new Date(String(msg.created_time || Date.now())).getTime()
                })).sort((a, b) => a.date - b.date);
                setCurrentFbConversation(formattedFbConversation as FacebookMessage[]);
                await setSupportFbConversationCache(threadId, formattedFbConversation as FacebookMessage[]);
            }

        } catch (err: any) {
            setError(`Failed to load ${source} conversation: ${err.message}`);
            if (!cachedConvo) {
                if (source === 'email') setCurrentEmailConversation([]);
                else setCurrentFbConversation([]);
            }
            sendClientErrorEmail(`Error fetching ${source} support conversation:`, err);
        } finally {
            setIsLoadingConversation(false);
        }
    };

    // Helper function to process the streamed reply
    const processStreamedReply = async (response: Response) => {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("Failed to get stream reader.");
        }

        const decoder = new TextDecoder();
        setDraftReply(''); // Clear previous draft before streaming starts
        setDraftReplyTranslation(''); // Also clear previous translation

        let fullResponse = ''; // Accumulate the full response

        try {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) 
                    break;
                
                const chunk = decoder.decode(value, { stream: true });
                fullResponse += chunk; // Accumulate full response
                setDraftReply(fullResponse); // Show the full response as it streams in
            }
        } finally {
            reader.releaseLock();
        }

        // Parse the response to extract original and translation
        if (fullResponse.trim()) {
            try {
                // Find the original reply (content between [ORIGINAL] and [/ORIGINAL])
                const originalRegex = /\[ORIGINAL\]([\s\S]*?)\[\/ORIGINAL\]/;
                const originalMatch = fullResponse.match(originalRegex);
                
                // Find the translation (content between [TRANSLATION] and [/TRANSLATION])
                const translationRegex = /\[TRANSLATION\]([\s\S]*?)\[\/TRANSLATION\]/;
                const translationMatch = fullResponse.match(translationRegex);
                
                if (originalMatch && originalMatch[1]) {
                    const originalReply = originalMatch[1].trim();
                    setDraftReply(originalReply);
                    
                    if (translationMatch && translationMatch[1]) {
                        const translation = translationMatch[1].trim();
                        setDraftReplyTranslation(translation);
                    } else {
                        setDraftReplyTranslation('(Translation not found in response)');
                    }
                } else {
                    // If no match found, keep the full response as is
                    setDraftReply(fullResponse.trim());
                    setDraftReplyTranslation('(Could not parse response format)');
                }
            } catch (error) {
                setDraftReplyTranslation(`(Error parsing response: ${error instanceof Error ? error.message : 'Unknown'})`);
                sendClientErrorEmail(`Error parsing AI response format:`, error);
            }
        }
    };

    const handleGenerateReply = async () => {
        if (!selectedThreadId || (activeSource === 'email' && currentEmailConversation.length === 0) || (activeSource === 'facebook' && currentFbConversation.length === 0)) return;
        setIsGeneratingReply(true);
        setDraftReply('');
        setDraftReplyTranslation('');
        setError(null);
        try {
            const response = await fetch('/api/admin/generate-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    conversation: activeSource === 'email' ? currentEmailConversation : currentFbConversation, 
                    translation_only: false 
                }),
            });

            await processStreamedReply(response); // Process the stream

        } catch (err: any) {
            setError(`Failed to generate reply: ${err.message}`);
            sendClientErrorEmail("Error generating AI reply:", err);
        } finally {
            setIsGeneratingReply(false);
        }
    };

    const handleReadjustReply = async () => {
        if (!selectedThreadId || !readjustInstructions.trim() || !draftReply || (activeSource === 'email' && currentEmailConversation.length === 0) || (activeSource === 'facebook' && currentFbConversation.length === 0)) return;

        setIsGeneratingReply(true); // Keep using the same loading state
        setIsReadjustModalOpen(false); // Close modal immediately
        setDraftReply(''); // Clear the old reply before streaming the new one
        setDraftReplyTranslation(''); // Reset translation
        setError(null);
        try {
            const payload = activeSource === 'email'
                ? {
                    conversation: currentEmailConversation,
                    previous_reply: draftReply, // Send the previous draft for context
                    instruction: readjustInstructions,
                    translation_only: false
                }
                : {
                    conversation: currentFbConversation,
                    previous_reply: draftReply, // Send the previous draft for context
                    instruction: readjustInstructions,
                    translation_only: false
                };

            // Use fetch directly to handle stream
            const response = await fetch('/api/admin/generate-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            await processStreamedReply(response); // Process the stream
            setReadjustInstructions(''); // Clear instructions after successful stream

        } catch (err: any) {
            setError(`Failed to generate readjusted reply: ${err.message}`);
            sendClientErrorEmail("Error generating readjusted AI reply:", err);
            // Consider restoring the previous draft on error?
        } finally {
            setIsGeneratingReply(false);
            // Modal is already closed
        }
    };

    const handleSendReply = async () => {
        if (!selectedThreadId || !draftReply.trim()) return;
        setIsSendingReply(true);
        setError(null);
        try {
            if (activeSource === 'email') {
                if (currentEmailConversation.length === 0) throw new Error("Email conversation not loaded.");
                const lastCustomerMessage = [...currentEmailConversation].reverse().find(msg => msg.sender.address.toLowerCase() !== process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase());
                if (!lastCustomerMessage) throw new Error("Could not find the last customer message to reply to.");
                await fetchJsonPost('/api/admin/email', {
                    action: 'send_reply',
                    recipient_email: selectedThreadId,
                    subject: `Re: ${lastCustomerMessage.subject}`,
                    reply_body: draftReply,
                    in_reply_to: lastCustomerMessage.id,
                    references: lastCustomerMessage.references ? `${lastCustomerMessage.references} ${lastCustomerMessage.id}` : lastCustomerMessage.id
                });
                handleSelectThread(selectedThreadId, 'email');
            } else {
                if (currentFbConversation.length === 0) throw new Error("Facebook conversation not loaded.");
                const fbThreadSummary = facebookThreads.find(t => t.threadId === selectedThreadId);
                if (!fbThreadSummary) throw new Error("Facebook thread summary not found.");
                const participant = fbThreadSummary.participants[0];
                if (!participant || !participant.id) throw new Error("Could not find participant PSID to reply to.");
                await fetchJsonPost('/api/admin/facebook', {
                    action: 'send_reply',
                    recipient_psid: participant.id,
                    reply_body: draftReply,
                });
                handleSelectThread(selectedThreadId, 'facebook');
            }
            setDraftReply('');
            setDraftReplyTranslation('');
        } catch (err: any) {
            setError(`Failed to send ${activeSource} reply: ${err.message}`);
            sendClientErrorEmail(`Error sending ${activeSource} support reply:`, err);
        } finally {
            setIsSendingReply(false);
        }
    };

    const handleDeleteThread = async (threadIdToDelete: string) => {
        if (activeSource !== 'email') 
            return;
        
        setOpenDropdownThreadId(null);
        
        if (!confirm(`Are you sure you want to move the email thread with ${threadIdToDelete} to Trash?`)) 
            return;
        
        setDeletingThreadId(threadIdToDelete);
        setError(null);
        
        try {
            await fetchJsonPost('/api/admin/email', {
                action: 'delete_thread',
                thread_id: threadIdToDelete
            });
            
            const updatedThreads = emailThreads.filter(t => t.threadId !== threadIdToDelete);
            
            setEmailThreads(updatedThreads);
            
            await setSupportEmailThreadsCache(updatedThreads); // Correct
            await deleteSupportEmailConversationCache(threadIdToDelete); // Correct
            
            if (selectedThreadId === threadIdToDelete) {
                setSelectedThreadId(null);
                setCurrentEmailConversation([]);
                setDraftReply('');
                safeLocalStorageSet(LAST_EMAIL_THREAD_ID_LS_KEY, '');
            }
        } catch (err: any) {
            setError(`Failed to delete email thread: ${err.message}`);
            sendClientErrorEmail("Error deleting email support thread:", err);
        } finally {
            setDeletingThreadId(null);
        }
    };

    const handleMoveToTickets = async (threadIdToMove: string) => {
        if (activeSource !== 'email') return;
        setOpenDropdownThreadId(null);
        setMovingThreadId(threadIdToMove);
        setError(null);
        try {
            await fetchJsonPost('/api/admin/email', {
                action: 'move_thread',
                thread_id: threadIdToMove
            });
            const updatedThreads = emailThreads.filter(t => t.threadId !== threadIdToMove);
            
            setEmailThreads(updatedThreads);
            
            await setSupportEmailThreadsCache(updatedThreads); // Correct
            await deleteSupportEmailConversationCache(threadIdToMove); // Correct
            
            if (selectedThreadId === threadIdToMove) {
                setSelectedThreadId(null);
                setCurrentEmailConversation([]);
                setDraftReply('');
                safeLocalStorageSet(LAST_EMAIL_THREAD_ID_LS_KEY, '');
            }
        } catch (err: any) {
            setError(`Failed to move email thread: ${err.message}`);
            sendClientErrorEmail("Error moving email support thread:", err);
        } finally {
            setMovingThreadId(null);
        }
    };

    const selectedThreadInfo = useMemo(() => {
        if (!selectedThreadId) return null;
        if (activeSource === 'email') {
            // For email, the sender object already has 'address'
            return emailThreads.find(t => t.threadId === selectedThreadId);
        } else {
            const fbThread = facebookThreads.find(t => t.threadId === selectedThreadId);
            if (!fbThread) return null;

            // For Facebook, adapt the participant structure to match the expected sender structure
            const participant = fbThread.participants[0]; // Get the first participant
            return {
                subject: fbThread.snippet, // Use snippet as subject for FB
                sender: {
                    name: participant?.name || 'Unknown FB User',
                    // Use participant ID as the 'address' for display purposes, or threadId as fallback
                    address: participant?.id || fbThread.threadId
                }
            };
        }
    }, [selectedThreadId, activeSource, emailThreads, facebookThreads]);

    // --- RENDER ---
    return (
        <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Support Inbox</h2>
            
            {/* Mobile Navigation */}
            <div className="lg:hidden mb-4">
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/50 border border-neutral-700/50 rounded-lg text-white"
                >
                    <span className="text-sm font-medium">
                        {activeSource === 'email' ? 'Email' : 'Facebook'}
                    </span>
                    {mobileMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {mobileMenuOpen && (
                    <div className="mt-2 bg-neutral-900/50 border border-neutral-700/50 rounded-lg overflow-hidden">
                        <button
                            onClick={() => {
                                handleSourceChange('email');
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                                activeSource === 'email'
                                    ? 'bg-purple-600/20 text-purple-300'
                                    : 'text-gray-300 hover:bg-neutral-800/50'
                            } border-b border-neutral-700/50`}
                        >
                            <Mail className="w-4 h-4 inline-block mr-2 opacity-70" />
                            Email
                        </button>
                        <button
                            onClick={() => {
                                handleSourceChange('facebook');
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                                activeSource === 'facebook'
                                    ? 'bg-purple-600/20 text-purple-300'
                                    : 'text-gray-300 hover:bg-neutral-800/50'
                            }`}
                        >
                            <Facebook className="w-4 h-4 inline-block mr-2 opacity-70" />
                            Facebook
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-red-400" />
                        <p className="text-red-400 text-xs sm:text-sm">{error}</p>
                    </div>
                </div>
            )}
            
            <div className="flex flex-col lg:flex-row overflow-hidden">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block lg:w-64 lg:flex-shrink-0 lg:min-h-[600px]">
                    <nav className="space-y-1">
                        <button
                            className={`w-full text-left px-4 py-2 rounded-lg flex items-center text-sm font-medium ${
                                activeSource === 'email'
                                    ? 'bg-purple-900/50 text-purple-200'
                                    : 'text-gray-300 hover:bg-gray-800/50'
                            }`}
                            onClick={() => handleSourceChange('email')}
                        >
                            <Mail className="w-4 h-4 mr-3 opacity-70" />
                            Email
                        </button>
                        <button
                            className={`w-full text-left px-4 py-2 rounded-lg flex items-center text-sm font-medium ${
                                activeSource === 'facebook'
                                    ? 'bg-purple-900/50 text-purple-200'
                                    : 'text-gray-300 hover:bg-gray-800/50'
                            }`}
                            onClick={() => handleSourceChange('facebook')}
                        >
                            <Facebook className="w-4 h-4 mr-3 opacity-70" />
                            Facebook
                        </button>
                    </nav>
                </div>
                
                {/* Main Content Area */}
                <div className="flex-1 lg:p-6 lg:pt-0 flex flex-col lg:flex-row gap-4 lg:gap-6 xl:gap-8 h-auto lg:h-[calc(100vh-300px)] lg:min-w-0">
                    {/* Thread List - Mobile Collapsible on smaller screens */}
                    <div className={`w-full lg:w-1/3 xl:w-1/4 bg-neutral-800/50 rounded-lg flex flex-col border border-neutral-700/50 ${!mobileThreadsOpen && selectedThreadId ? 'hidden lg:flex' : 'flex'}`}>
                        <div className="flex justify-between items-center p-3 border-b border-neutral-700/50">
                            <h3 className="text-base sm:text-lg font-semibold text-white">
                                {activeSource === 'email' ? 'Email Threads' : 'Facebook Chats'}
                            </h3>
                            <button
                                onClick={() => fetchThreads(activeSource)}
                                disabled={isLoadingThreads || isRefreshingThreads || (activeSource === 'facebook' && !currentUser?.user_metadata?.facebook_integration?.pageId)}
                                className="p-1.5 rounded-md text-gray-300 hover:bg-neutral-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Refresh threads"
                            >
                                {isRefreshingThreads ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-grow p-2 sm:p-3">
                            {isLoadingThreads && (activeSource === 'email' ? emailThreads.length === 0 : facebookThreads.length === 0) ? (
                                <div className="flex justify-center items-center h-32">
                                    <Loader2 className="w-5 sm:w-6 h-5 sm:h-6 animate-spin text-purple-400" />
                                </div>
                            ) : (activeSource === 'email' && emailThreads.length === 0) || (activeSource === 'facebook' && facebookThreads.length === 0) ? (
                                <p className="text-gray-400 text-xs sm:text-sm text-center py-4">No {activeSource} threads found.</p>
                            ) : (
                                <ul className="space-y-1.5 sm:space-y-2">
                                    {activeSource === 'email' && emailThreads.map(thread => (
                                        <li key={thread.threadId} className="relative">
                                            <div className={`flex items-center justify-between p-2.5 sm:p-3 rounded-md transition-colors group ${selectedThreadId === thread.threadId && activeSource === 'email' ? 'bg-purple-900/60' : 'hover:bg-neutral-700/40'}`}>
                                                <button
                                                    onClick={() => {
                                                        handleSelectThread(thread.threadId, 'email');
                                                        setMobileThreadsOpen(false);
                                                    }}
                                                    className={`w-full text-left overflow-hidden mr-2`}
                                                    disabled={isLoadingConversation && selectedThreadId === thread.threadId}
                                                >
                                                    <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                                                        <span className="text-xs sm:text-sm font-medium text-white truncate block" title={thread.sender.name || thread.sender.address}>
                                                            {thread.sender.name || thread.sender.address}
                                                        </span>
                                                        <span className="text-[10px] sm:text-xs text-gray-400 flex-shrink-0 ml-2">
                                                            {formatDate(thread.latestMessageDate)}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] sm:text-xs text-gray-300 font-medium truncate mb-0.5 sm:mb-1 block">{thread.subject}</p>
                                                </button>
                                                <button
                                                    onClick={() => setOpenDropdownThreadId(openDropdownThreadId === thread.threadId ? null : thread.threadId)}
                                                    className="p-1 rounded-md text-gray-400 hover:bg-neutral-600/50 hover:text-white transition-colors flex-shrink-0"
                                                    aria-label="Thread options"
                                                >
                                                    <MoreVertical className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                                                </button>
                                            </div>
                                            {openDropdownThreadId === thread.threadId && activeSource === 'email' && (
                                                <div className="absolute right-0 top-full mt-1 w-44 sm:w-48 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg py-1 z-10">
                                                    <button
                                                        onClick={() => handleMoveToTickets(thread.threadId)}
                                                        disabled={movingThreadId === thread.threadId}
                                                        className="w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-blue-400 hover:bg-blue-900/30 hover:text-blue-300 flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {movingThreadId === thread.threadId ? (<Loader2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 animate-spin" />) : (<Archive className="w-3.5 sm:w-4 h-3.5 sm:h-4" />)}
                                                        {movingThreadId === thread.threadId ? 'Moving...' : 'Move To Tickets'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteThread(thread.threadId)}
                                                        disabled={deletingThreadId === thread.threadId || movingThreadId === thread.threadId}
                                                        className="w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {deletingThreadId === thread.threadId ? (<Loader2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 animate-spin" />) : (<Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />)}
                                                        {deletingThreadId === thread.threadId ? 'Deleting...' : 'Move To Trash'}
                                                    </button>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                    {activeSource === 'facebook' && facebookThreads.map(thread => {
                                        const isSelected = selectedThreadId === thread.threadId && activeSource === 'facebook';
                                        const pageId = currentUser?.user_metadata?.facebook_integration?.pageId;
                                        const lastMessageFromPage = !!pageId && thread.lastSenderId === pageId;

                                        return (
                                            <li key={thread.threadId} className="relative">
                                                <div className={`flex items-center justify-between p-2.5 sm:p-3 rounded-md transition-colors group ${isSelected ? 'bg-purple-900/60' : 'hover:bg-neutral-700/40'} ${lastMessageFromPage ? '' : 'bg-red-900/30'}`}>
                                                    <button
                                                        onClick={() => {
                                                            handleSelectThread(thread.threadId, 'facebook');
                                                            setMobileThreadsOpen(false);
                                                        }}
                                                        className={`w-full text-left overflow-hidden mr-2`}
                                                        disabled={isLoadingConversation && selectedThreadId === thread.threadId}
                                                    >
                                                        <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                                                            <span className="text-xs sm:text-sm font-medium text-white truncate block" title={thread.participants[0]?.name || thread.participants[0]?.id}>
                                                                {thread.participants[0]?.name || thread.participants[0]?.id || 'Unknown User'}
                                                            </span>
                                                            <span className="text-[10px] sm:text-xs text-gray-400 flex-shrink-0 ml-2 flex items-center">
                                                                {lastMessageFromPage && <Check className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-green-400 mr-1" />}
                                                                {formatDate(new Date(thread.latestMessageTimestamp))}
                                                            </span>
                                                        </div>
                                                        <p className={`text-[11px] sm:text-xs truncate block ${thread.unreadCount > 0 ? 'text-white font-semibold' : 'text-gray-400'}`}>
                                                            {cleanClientSnippet(thread.snippet) || '(No preview)'}
                                                        </p>
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Conversation Panel - Full width on mobile when thread is selected */}
                    <div className={`relative flex-1 flex flex-col bg-neutral-800/50 rounded-lg border border-neutral-700/50 overflow-hidden ${mobileThreadsOpen && selectedThreadId ? 'hidden lg:flex' : 'flex'}`}>
                        {selectedThreadId ? (
                            <>
                                <div className="relative z-10 p-3 sm:p-4 border-b border-neutral-700/50 bg-neutral-900/30">
                                    {/* Mobile back button */}
                                    <button
                                        onClick={() => setMobileThreadsOpen(true)}
                                        className="lg:hidden mb-2 text-purple-400 hover:text-purple-300 text-xs sm:text-sm flex items-center gap-1"
                                    >
                                        <ChevronUp className="w-3.5 sm:w-4 h-3.5 sm:h-4 rotate-90" />
                                        Back to threads
                                    </button>
                                    <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                                        {selectedThreadInfo?.subject || (activeSource === 'facebook' ? 'Facebook Chat' : 'Conversation')}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-400 truncate">
                                        With: {selectedThreadInfo?.sender?.name || 'Unknown'} {selectedThreadInfo?.sender?.address ? `(${selectedThreadInfo?.sender?.address})` : ''}
                                    </p>
                                </div>
                                <div
                                    className="relative z-10 flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4"
                                    ref={conversationContainerRef}
                                >
                                    {isLoadingConversation ? (
                                        <div className="flex justify-center items-center h-full">
                                            <Loader2 className="w-5 sm:w-6 h-5 sm:h-6 animate-spin text-purple-400" />
                                        </div>
                                    ) : (activeSource === 'email' && currentEmailConversation.length === 0) || (activeSource === 'facebook' && currentFbConversation.length === 0) ? (
                                        <p className="text-gray-400 text-center py-6 text-sm">No messages in this conversation.</p>
                                    ) : (
                                        <>
                                            {activeSource === 'email' && currentEmailConversation.map((msg, index) => {
                                                const senderLower = msg.sender.address.toLowerCase();
                                                const isAdminMessage = senderLower === adminFromEmail;

                                                return (
                                                <div key={msg.id || index} className={`flex mb-3 sm:mb-4 ${isAdminMessage ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`${isAdminMessage ? 'text-right' : 'text-left'} max-w-full sm:max-w-[85%] lg:max-w-[75%]`}>
                                                        <div className={`text-[11px] sm:text-xs text-gray-500 mb-1 flex items-center ${isAdminMessage ? 'justify-end' : ''}`}>
                                                            <span className="font-medium text-gray-400">{msg.sender.name || msg.sender.address}</span>
                                                            <span className="ml-1.5 sm:ml-2">{formatDate(msg.date)}</span>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                                                            <div
                                                                className={`w-full sm:w-1/2 inline-block p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm text-white whitespace-pre-wrap text-left ${
                                                                    isAdminMessage ? 'bg-purple-800/70 sm:ml-auto' : 'bg-neutral-700/70'
                                                                }`}
                                                            >
                                                                <EmailMessageContent bodyHtml={msg.bodyHtml} bodyText={msg.bodyText} />
                                                            </div>
                                                            {msg.translated_text && msg.translated_text !== (msg.bodyHtml || msg.bodyText) && (
                                                                <div className="w-full sm:w-1/2 inline-block text-[11px] sm:text-xs text-white/50 whitespace-pre-wrap text-left p-2.5 sm:p-3 bg-neutral-800/40 rounded-lg border border-neutral-700/30"
                                                                    dangerouslySetInnerHTML={{ __html: msg.translated_text.replace(/\n/g, '<br />') }}
                                                                >
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                );
                                            })}
                                            {activeSource === 'facebook' && currentFbConversation.map((msg, index) => {
                                                const pageId = currentUser?.user_metadata?.facebook_integration?.pageId;
                                                const isFromPage = msg.from?.id === pageId;
                                                return (
                                                    <div key={msg.id || index} className={`flex mb-3 sm:mb-4 ${isFromPage ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`${isFromPage ? 'text-right' : 'text-left'} max-w-full sm:max-w-[85%] lg:max-w-[75%]`}>
                                                            <div className="text-[11px] sm:text-xs text-gray-500 mb-1">
                                                                <span className="font-medium text-gray-400">{msg.from.name || msg.from.id}</span>
                                                                <span className="ml-1.5 sm:ml-2">{(msg as any).date ? formatDate((msg as any).date) : 'Invalid Date'}</span>
                                                            </div>
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                                {/* Conditionally render translation first if message is from page */}
                                                                {isFromPage && msg.translated_text && msg.translated_text !== msg.message && (
                                                                    <div className="inline-block text-[11px] sm:text-xs text-white/50 whitespace-pre-wrap text-left p-2.5 sm:p-3 sm:bg-neutral-800/40 sm:rounded-lg">
                                                                        {msg.translated_text}
                                                                    </div>
                                                                )}
                                                                {/* Original Message */}
                                                                <div
                                                                    className={`inline-block p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm text-white whitespace-pre-wrap text-left ${isFromPage
                                                                        ? 'bg-blue-800/70'
                                                                        : 'bg-neutral-700/70'
                                                                        }`}
                                                                >
                                                                    {msg.message || '(Message not available)'}
                                                                </div>
                                                                {/* Conditionally render translation second if message is NOT from page */}
                                                                {!isFromPage && msg.translated_text && msg.translated_text !== msg.message && (
                                                                    <div className="inline-block text-[11px] sm:text-xs text-white/50 whitespace-pre-wrap text-left p-2.5 sm:p-3 sm:bg-neutral-800/40 sm:rounded-lg">
                                                                        {msg.translated_text}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>
                                <div className="p-3 sm:p-4 border-t border-neutral-700/50 bg-neutral-900">
                                    <div className="mb-2 sm:mb-3 flex flex-col sm:flex-row gap-2">
                                        <button
                                            onClick={handleGenerateReply}
                                            disabled={isGeneratingReply || isLoadingConversation || (activeSource === 'email' && currentEmailConversation.length === 0) || (activeSource === 'facebook' && currentFbConversation.length === 0)}
                                            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isGeneratingReply && !isReadjustModalOpen ? (<><Loader2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1.5 sm:mr-2 animate-spin" /> Generating...</>) : (<><Zap className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1.5 sm:mr-2" /> Generate Response</>)}
                                        </button>
                                        <button
                                            onClick={() => setIsReadjustModalOpen(true)}
                                            disabled={isGeneratingReply || !draftReply || (activeSource === 'email' && currentEmailConversation.length === 0) || (activeSource === 'facebook' && currentFbConversation.length === 0)}
                                            className="w-full sm:w-auto bg-neutral-700 hover:bg-neutral-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isGeneratingReply && isReadjustModalOpen ? (<><Loader2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1.5 sm:mr-2 animate-spin" /> Readjusting...</>) : (<><RefreshCw className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1.5 sm:mr-2" /> Readjust</>)}
                                        </button>
                                    </div>
                                    <div className="flex flex-col lg:flex-row gap-2">
                                        <textarea
                                            ref={textareaRef}
                                            value={draftReply}
                                            onChange={(e) => {
                                                setDraftReply(e.target.value);
                                            }}
                                            className="w-full lg:w-1/2 p-2.5 sm:p-3 bg-neutral-700/60 border border-neutral-600 rounded-md text-white text-xs sm:text-sm focus:ring-purple-500 focus:border-purple-500 resize-none overflow-hidden"
                                            rows={5}
                                            placeholder={
                                                isGeneratingReply ? "Generating draft..." :
                                                    "AI draft will appear here, or type your reply..."
                                            }
                                            disabled={isGeneratingReply}
                                        />
                                        <div className="w-full lg:w-1/2 p-2.5 sm:p-3 bg-neutral-800/40 border border-neutral-700/30 rounded-md text-xs sm:text-sm text-white/70 relative overflow-y-auto" style={{ minHeight: 'calc(1.5em * 5 + 1.5rem)' }}>
                                            {isGeneratingReply ? (
                                                <div className="absolute inset-0 flex items-center justify-center bg-neutral-800/50">
                                                    <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin text-purple-400" />
                                                    <span className="ml-2 text-gray-400 text-xs sm:text-sm">Generating...</span>
                                                </div>
                                            ) : draftReplyTranslation ? (
                                                <div className="whitespace-pre-wrap">{draftReplyTranslation}</div>
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-500 text-xs sm:text-sm">
                                                    Translation will appear here after generation.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSendReply}
                                        disabled={isSendingReply || !draftReply.trim() || (activeSource === 'facebook' && !facebookThreads.find(t => t.threadId === selectedThreadId)?.canReply)}
                                        className="w-full mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 sm:px-5 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSendingReply ? (<><Loader2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1.5 sm:mr-2 animate-spin" /> Sending...</>) : (<><Mail className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1.5 sm:mr-2" /> Send Reply</>)}
                                    </button>
                                    {activeSource === 'facebook' && !facebookThreads.find(t => t.threadId === selectedThreadId)?.canReply && selectedThreadId && (
                                        <p className="text-[10px] sm:text-xs text-yellow-400 mt-2">Cannot reply to this Facebook conversation (possibly due to time limits or user settings).</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="relative z-10 flex items-center justify-center h-full p-4">
                                <p className="text-gray-400 text-sm sm:text-lg text-center">Select a {activeSource} thread to view the conversation.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isReadjustModalOpen && (
                <ReadjustReplyModal
                    isOpen={isReadjustModalOpen}
                    onClose={() => setIsReadjustModalOpen(false)}
                    instruction={readjustInstructions}
                    onInstructionChange={setReadjustInstructions}
                    onSubmit={handleReadjustReply}
                    isLoading={isGeneratingReply}
                />
            )}
        </div>
    );
}

// Add ReadjustReplyModal component before the SupportTab function
function ReadjustReplyModal({
    isOpen,
    onClose,
    instruction,
    onInstructionChange,
    onSubmit,
    isLoading
}: {
    isOpen: boolean,
    onClose: () => void,
    instruction: string,
    onInstructionChange: (value: string) => void,
    onSubmit: () => void,
    isLoading: boolean
}) {
    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-black/80 backdrop-filter backdrop-blur-md overflow-hidden flex items-center justify-center p-4"
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                isolation: 'isolate'
            }}
        >
            <div
                className="max-w-lg w-full bg-neutral-900 rounded-lg overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                style={{ position: 'relative', zIndex: 10000 }}
            >
                <div className="p-4 bg-neutral-800 flex justify-between items-center">
                    <h3 className="text-white font-medium">
                        Readjust Reply
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Instructions for readjustment
                    </label>
                    <textarea
                        value={instruction}
                        onChange={(e) => onInstructionChange(e.target.value)}
                        className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:ring-orange-500 focus:border-orange-500"
                        rows={5}
                        placeholder="Enter any additional instructions for the AI to consider..."
                    />
                    <div className="flex justify-end mt-4 space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md inline-flex items-center"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSubmit}
                            disabled={!instruction.trim() || isLoading}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Readjust Reply
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
