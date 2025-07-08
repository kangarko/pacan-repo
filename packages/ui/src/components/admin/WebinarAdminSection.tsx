'use client';

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { Calendar, Plus, Save, Edit2, Trash2, AlertCircle, Loader2, X, Clock, CheckCircle, ChevronDown, ChevronUp, MessageSquare, Upload } from 'lucide-react';
import { Webinar, WebinarSchedule, WebinarOffer, Offer, WebinarMessage } from '@repo/ui/lib/types';
import { sendClientErrorEmail } from '@repo/ui/lib/clientUtils';
import { fetchJsonPost } from '@repo/ui/lib/utils';

interface WebinarFormData {
    id?: string;
    title: string;
    video_url: string;
    url: string;
    offer: WebinarOffer;
    schedules?: WebinarSchedule[];
    metadata?: any;
    duration_seconds?: number;
    created_at?: string;
    background_image_url?: string;
    thank_you_video_url?: string;
}

export function WebinarAdminSection() {
    const [webinars, setWebinars] = useState<Webinar[]>([]);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [expandedWebinarId, setExpandedWebinarId] = useState<string | null>(null);
    const [formData, setFormData] = useState<WebinarFormData>({
        title: '',
        video_url: '',
        url: '',
        offer: {
            time: 0,
            button_text: '',
            button_url: '',
            offer_headline: '',
            offer_description: '',
            offer_image_url: '',
            offer_slug: ''
        },
        schedules: [],
        metadata: {}
    });
    const [durationMessage, setDurationMessage] = useState<string | null>(null);
    const backgroundImageInputRef = useRef<HTMLInputElement>(null);
    const offerImageInputRef = useRef<HTMLInputElement>(null);
    const [backgroundUploading, setBackgroundUploading] = useState(false);
    const [offerImageUploading, setOfferImageUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ background: number; offer: number }>({
        background: 0,
        offer: 0
    });
    const [activeSubTab, setActiveSubTab] = useState<'list' | 'create' | 'import' | 'chats'>('list');
    const [availableTimeOptions, setAvailableTimeOptions] = useState<number[]>([]);
    const [selectedWebinarForChat, setSelectedWebinarForChat] = useState<string>('');
    const [chatMessages, setChatMessages] = useState<WebinarMessage[]>([]);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [editingMessage, setEditingMessage] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState<WebinarMessage>({
        id: '',
        webinar_id: '',
        user_id: 0,
        user_name: '',
        message: '',
        time_seconds: 0
    });
    const [selectedWebinarForImport, setSelectedWebinarForImport] = useState<string>('');
    const [parsedMessagesInput, setParsedMessagesInput] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        fetchWebinars();
        fetchOffers();
    }, []);

    const fetchWebinars = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { webinars: fetchedWebinars } = await fetchJsonPost('/api/admin/webinar', { action: 'list' });
            setWebinars(fetchedWebinars || []);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to fetch webinars';
            setError(errorMsg);
            sendClientErrorEmail('Error fetching webinars:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOffers = async () => {
        try {
            const { offers: fetchedOffers } = await fetchJsonPost('/api/admin/offer', { action: 'list' });
            setOffers(fetchedOffers || []);
        } catch (err) {
            sendClientErrorEmail('Error fetching offers:', err);
        }
    };

    const toggleWebinarExpand = (id: string) => {
        setExpandedWebinarId(expandedWebinarId === id ? null : id);
    };

    const editWebinar = (webinar: Webinar) => {
        setFormData({
            id: webinar.id,
            title: webinar.title,
            video_url: webinar.video_url,
            url: webinar.url,
            offer: webinar.offer,
            schedules: webinar.schedules || [],
            metadata: webinar.metadata || {},
            duration_seconds: webinar.duration_seconds,
            background_image_url: webinar.background_image_url,
            thank_you_video_url: webinar.thank_you_video_url
        });
        setIsEditMode(true);
        setActiveSubTab('create');
    };

    const handleDeleteWebinar = async (id: string) => {
        if (!confirm('Are you sure you want to delete this webinar?')) return;
        
        try {
            await fetchJsonPost('/api/admin/webinar', { action: 'delete', id });
            setSuccessMessage('Webinar deleted successfully');
            fetchWebinars();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to delete webinar';
            setError(errorMsg);
            sendClientErrorEmail('Error deleting webinar:', err);
        }
    };

    const handleFormSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        try {
            const action = isEditMode ? 'update' : 'create';
            await fetchJsonPost('/api/admin/webinar', {
                action,
                webinar: formData
            });
            
            setSuccessMessage(`Webinar ${isEditMode ? 'updated' : 'created'} successfully`);
            fetchWebinars();
            resetForm();
            setActiveSubTab('list');
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to save webinar';
            setError(errorMsg);
            sendClientErrorEmail('Error saving webinar:', err);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            video_url: '',
            url: '',
            offer: {
                time: 0,
                button_text: '',
                button_url: '',
                offer_headline: '',
                offer_description: '',
                offer_image_url: '',
                offer_slug: ''
            },
            schedules: [],
            metadata: {}
        });
        setIsEditMode(false);
        setDurationMessage(null);
    };

    const uploadFile = async (file: File, type: 'background' | 'offer'): Promise<string> => {
        const reader = new FileReader();
        
        return new Promise((resolve, reject) => {
            reader.onload = async (event) => {
                if (!event.target || !event.target.result) {
                    reject(new Error('Failed to read file'));
                    return;
                }

                const fileData = event.target.result.toString();
                const setProgress = type === 'background' 
                    ? (p: number) => setUploadProgress(prev => ({ ...prev, background: p }))
                    : (p: number) => setUploadProgress(prev => ({ ...prev, offer: p }));

                setProgress(30);

                try {
                    const result = await fetchJsonPost('/api/admin/webinar', {
                        action: type === 'background' ? 'upload_background' : 'upload_offer_thumbnail',
                        fileData,
                        fileName: file.name,
                        contentType: file.type
                    });

                    setProgress(90);

                    if (!result.success || !result.url) {
                        throw new Error('Failed to upload file');
                    }

                    setProgress(100);
                    resolve(result.url);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'background' | 'offer') => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        
        try {
            if (type === 'background') {
                setBackgroundUploading(true);
                const url = await uploadFile(file, 'background');
                setFormData({ ...formData, background_image_url: url });
                setBackgroundUploading(false);
            } else {
                setOfferImageUploading(true);
                const url = await uploadFile(file, 'offer');
                setFormData({ 
                    ...formData, 
                    offer: { ...formData.offer, offer_image_url: url }
                });
                setOfferImageUploading(false);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to upload file');
            if (type === 'background') setBackgroundUploading(false);
            else setOfferImageUploading(false);
        }
    };

    const renderForm = (editMode: boolean) => (
        <div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">
                {editMode ? 'Edit Webinar' : 'Create New Webinar'}
            </h3>
            
            <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6">
                <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4 sm:p-6">
                    <h4 className="text-base sm:text-lg font-medium text-white mb-4">Basic Information</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full p-3 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                URL Path <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                className="w-full p-3 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                placeholder="/webinar/your-webinar"
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Video URL <span className="text-red-400">*</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={formData.video_url}
                                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                    className="flex-1 p-3 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                    placeholder="https://vimeo.com/..."
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Video Duration (seconds) <span className="text-red-400">*</span>
                            </label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="number"
                                    value={formData.duration_seconds || ''}
                                    onChange={(e) => {
                                        const seconds = parseInt(e.target.value) || 0;
                                        setFormData({ ...formData, duration_seconds: seconds });
                                        
                                        // Update available time options
                                        const options = [];
                                        for (let i = 0; i < seconds; i += 60) {
                                            options.push(i / 60);
                                        }
                                        setAvailableTimeOptions(options);
                                    }}
                                    className="flex-1 p-3 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                    placeholder="e.g., 3600 for 1 hour"
                                    required
                                />
                                {formData.duration_seconds && formData.duration_seconds > 0 && (
                                    <span className="text-sm text-gray-400">
                                        {Math.floor(formData.duration_seconds / 60)}m {formData.duration_seconds % 60}s
                                    </span>
                                )}
                            </div>
                            {durationMessage && (
                                <p className="mt-2 text-sm text-gray-400">{durationMessage}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Background Image
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.background_image_url || ''}
                                    onChange={(e) => setFormData({ ...formData, background_image_url: e.target.value })}
                                    className="flex-1 p-3 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                    placeholder="Image URL"
                                />
                                <button
                                    type="button"
                                    onClick={() => backgroundImageInputRef.current?.click()}
                                    disabled={backgroundUploading}
                                    className="px-4 bg-[#6B498F] hover:bg-[#4b2c5e] text-white rounded-lg flex items-center"
                                >
                                    {backgroundUploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                                </button>
                                <input
                                    ref={backgroundImageInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'background')}
                                    className="hidden"
                                />
                            </div>
                            {backgroundUploading && (
                                <div className="mt-2">
                                    <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-500 transition-all"
                                            style={{ width: `${uploadProgress.background}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Thank You Video URL
                            </label>
                            <input
                                type="url"
                                value={formData.thank_you_video_url || ''}
                                onChange={(e) => setFormData({ ...formData, thank_you_video_url: e.target.value })}
                                className="w-full p-3 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                placeholder="https://vimeo.com/..."
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4 sm:p-6">
                    <h4 className="text-base sm:text-lg font-medium text-white mb-4">Offer Configuration</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Show Offer at (minutes) <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.offer.time}
                                onChange={(e) => setFormData({ 
                                    ...formData, 
                                    offer: { ...formData.offer, time: parseInt(e.target.value) || 0 }
                                })}
                                className="w-full p-3 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Offer Slug
                            </label>
                            <select
                                value={formData.offer.offer_slug || ''}
                                onChange={(e) => setFormData({ 
                                    ...formData, 
                                    offer: { ...formData.offer, offer_slug: e.target.value }
                                })}
                                className="w-full p-3 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                            >
                                <option value="">Select an offer</option>
                                {offers.map(offer => (
                                    <option key={offer.slug} value={offer.slug}>
                                        {offer.name} - {offer.price} {offer.currency}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Button Text <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.offer.button_text}
                                onChange={(e) => setFormData({ 
                                    ...formData, 
                                    offer: { ...formData.offer, button_text: e.target.value }
                                })}
                                className="w-full p-3 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Button URL <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="url"
                                value={formData.offer.button_url}
                                onChange={(e) => setFormData({ 
                                    ...formData, 
                                    offer: { ...formData.offer, button_url: e.target.value }
                                })}
                                className="w-full p-3 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Offer Headline
                            </label>
                            <input
                                type="text"
                                value={formData.offer.offer_headline || ''}
                                onChange={(e) => setFormData({ 
                                    ...formData, 
                                    offer: { ...formData.offer, offer_headline: e.target.value }
                                })}
                                className="w-full p-3 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Offer Description
                            </label>
                            <textarea
                                value={formData.offer.offer_description || ''}
                                onChange={(e) => setFormData({ 
                                    ...formData, 
                                    offer: { ...formData.offer, offer_description: e.target.value }
                                })}
                                className="w-full p-3 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                rows={3}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Offer Image
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.offer.offer_image_url || ''}
                                    onChange={(e) => setFormData({ 
                                        ...formData, 
                                        offer: { ...formData.offer, offer_image_url: e.target.value }
                                    })}
                                    className="flex-1 p-3 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                    placeholder="Image URL"
                                />
                                <button
                                    type="button"
                                    onClick={() => offerImageInputRef.current?.click()}
                                    disabled={offerImageUploading}
                                    className="px-4 bg-[#6B498F] hover:bg-[#4b2c5e] text-white rounded-lg flex items-center"
                                >
                                    {offerImageUploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                                </button>
                                <input
                                    ref={offerImageInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'offer')}
                                    className="hidden"
                                />
                            </div>
                            {offerImageUploading && (
                                <div className="mt-2">
                                    <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-500 transition-all"
                                            style={{ width: `${uploadProgress.offer}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        type="submit"
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        {editMode ? 'Update Webinar' : 'Create Webinar'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            resetForm();
                            setActiveSubTab('list');
                        }}
                        className="bg-neutral-700 hover:bg-neutral-600 text-white px-6 py-3 rounded-lg flex items-center gap-2"
                    >
                        <X className="w-5 h-5" />
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );

    const renderImportChat = () => (
        <div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Import Chat Messages</h3>
            
            <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4 sm:p-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Select Webinar
                    </label>
                    <select
                        value={selectedWebinarForImport}
                        onChange={(e) => setSelectedWebinarForImport(e.target.value)}
                        className="w-full p-3 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                    >
                        <option value="">Select a webinar</option>
                        {webinars.map(webinar => (
                            <option key={webinar.id} value={webinar.id}>
                                {webinar.title}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Import Mode
                    </label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                            <input
                                type="radio"
                                name="importMode"
                                value="append"
                                defaultChecked
                                className="text-purple-600"
                            />
                            Append to existing
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                            <input
                                type="radio"
                                name="importMode"
                                value="replace"
                                className="text-purple-600"
                            />
                            Replace all
                        </label>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Paste Chat Messages (Format: HH:MM:SS Name: Message)
                    </label>
                    <textarea
                        value={parsedMessagesInput}
                        onChange={(e) => setParsedMessagesInput(e.target.value)}
                        className="w-full p-3 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white font-mono text-sm"
                        rows={10}
                        placeholder="00:05:23 John Doe: Hello everyone!&#10;00:06:15 Jane Smith: Thanks for the webinar..."
                    />
                </div>

                <button
                    onClick={async () => {
                        if (!selectedWebinarForImport || !parsedMessagesInput) return;

                        try {
                            // Parse the messages
                            const lines = parsedMessagesInput.split('\n').filter(line => line.trim());
                            const messages: Omit<WebinarMessage, 'id' | 'webinar_id' | 'user_id'>[] = [];

                            for (const line of lines) {
                                // Parse format: HH:MM:SS Name: Message
                                const match = line.match(/^(\d{2}):(\d{2}):(\d{2})\s+(.+?):\s+(.+)$/);
                                if (match) {
                                    const [, hours, minutes, seconds, userName, message] = match;
                                    const timeSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
                                    messages.push({
                                        user_name: userName.trim(),
                                        message: message.trim(),
                                        time_seconds: timeSeconds
                                    });
                                }
                            }

                            if (messages.length === 0) {
                                setError('No valid messages found. Please check the format.');
                                return;
                            }

                            const mode = (document.querySelector('input[name="importMode"]:checked') as HTMLInputElement)?.value || 'append';

                            const response = await fetchJsonPost('/api/admin/webinar', {
                                action: 'import_chat',
                                webinar_id: selectedWebinarForImport,
                                messages,
                                mode
                            });

                            setSuccessMessage(`Successfully imported ${response.count} messages`);
                            setParsedMessagesInput('');
                            setSelectedWebinarForImport('');
                        } catch (err) {
                            const errorMsg = err instanceof Error ? err.message : 'Failed to import messages';
                            setError(errorMsg);
                            sendClientErrorEmail('Error importing messages:', err);
                        }
                    }}
                    disabled={!selectedWebinarForImport || !parsedMessagesInput}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg disabled:opacity-50"
                >
                    Import Messages
                </button>
            </div>
        </div>
    );

    const renderChats = () => (
        <div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Manage Chat Messages</h3>
            
            <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4 sm:p-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Select Webinar
                    </label>
                    <select
                        value={selectedWebinarForChat}
                        onChange={async (e) => {
                            const webinarId = e.target.value;
                            setSelectedWebinarForChat(webinarId);
                            
                            if (webinarId) {
                                setIsLoadingChat(true);
                                try {
                                    const { messages } = await fetchJsonPost('/api/admin/webinar', {
                                        action: 'get_chat_messages',
                                        webinar_id: webinarId
                                    });
                                    setChatMessages(messages || []);
                                } catch (err) {
                                    setError('Failed to load chat messages');
                                    sendClientErrorEmail('Error loading chat messages:', err);
                                } finally {
                                    setIsLoadingChat(false);
                                }
                            } else {
                                setChatMessages([]);
                            }
                        }}
                        className="w-full p-3 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                    >
                        <option value="">Select a webinar</option>
                        {webinars.map(webinar => (
                            <option key={webinar.id} value={webinar.id}>
                                {webinar.title}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedWebinarForChat && (
                    <div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                            <h4 className="text-base font-medium text-white">
                                Chat Messages ({chatMessages.length})
                            </h4>
                            {chatMessages.length > 0 && (
                                <button
                                    onClick={async () => {
                                        if (!confirm('Are you sure you want to clear all messages?')) return;
                                        
                                        try {
                                            await fetchJsonPost('/api/admin/webinar', {
                                                action: 'clear_chat_messages',
                                                webinar_id: selectedWebinarForChat
                                            });
                                            setChatMessages([]);
                                            setSuccessMessage('All messages cleared');
                                        } catch (err) {
                                            setError('Failed to clear messages');
                                            sendClientErrorEmail('Error clearing messages:', err);
                                        }
                                    }}
                                    className="text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1.5 rounded-lg"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        {/* Add New Message Form */}
                        <div className="bg-neutral-700/30 p-4 rounded-lg mb-4">
                            <h5 className="text-sm font-medium text-gray-300 mb-3">Add New Message</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                <input
                                    type="text"
                                    placeholder="User name"
                                    value={newMessage.user_name}
                                    onChange={(e) => setNewMessage({ ...newMessage, user_name: e.target.value })}
                                    className="p-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white text-sm"
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Time (seconds)"
                                        value={newMessage.time_seconds || ''}
                                        onChange={(e) => setNewMessage({ ...newMessage, time_seconds: parseInt(e.target.value) || 0 })}
                                        className="flex-1 p-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white text-sm"
                                    />
                                    <select
                                        value={newMessage.time_seconds}
                                        onChange={(e) => setNewMessage({ ...newMessage, time_seconds: parseInt(e.target.value) })}
                                        className="p-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white text-sm"
                                    >
                                        <option value="">Quick select</option>
                                        {availableTimeOptions.map(minutes => (
                                            <option key={minutes} value={minutes * 60}>
                                                {minutes}:00
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Message"
                                    value={newMessage.message}
                                    onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                                    className="flex-1 p-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white text-sm"
                                />
                                <button
                                    onClick={async () => {
                                        if (!newMessage.user_name || !newMessage.message) {
                                            setError('Please fill in all fields');
                                            return;
                                        }

                                        try {
                                            const { message } = await fetchJsonPost('/api/admin/webinar', {
                                                action: 'add_chat_message',
                                                message: {
                                                    ...newMessage,
                                                    webinar_id: selectedWebinarForChat
                                                }
                                            });
                                            setChatMessages([...chatMessages, message].sort((a, b) => a.time_seconds - b.time_seconds));
                                            setNewMessage({
                                                id: '',
                                                webinar_id: '',
                                                user_id: 0,
                                                user_name: '',
                                                message: '',
                                                time_seconds: 0
                                            });
                                            setSuccessMessage('Message added');
                                        } catch (err) {
                                            setError('Failed to add message');
                                            sendClientErrorEmail('Error adding message:', err);
                                        }
                                    }}
                                    disabled={!newMessage.user_name || !newMessage.message}
                                    className="px-4 py-2 bg-[#6B498F] hover:bg-[#4b2c5e] disabled:bg-gray-600 text-white rounded-lg text-sm"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {isLoadingChat ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                            </div>
                        ) : chatMessages.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">No messages found for this webinar.</p>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {chatMessages.map(message => (
                                    <div key={message.id} className="bg-neutral-700/50 p-3 rounded-lg">
                                        {editingMessage === message.id ? (
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={message.user_name}
                                                        onChange={(e) => {
                                                            const updated = chatMessages.map(m => 
                                                                m.id === message.id ? { ...m, user_name: e.target.value } : m
                                                            );
                                                            setChatMessages(updated);
                                                        }}
                                                        className="flex-1 p-1.5 bg-neutral-600 rounded text-sm text-white"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={message.time_seconds}
                                                        onChange={(e) => {
                                                            const updated = chatMessages.map(m => 
                                                                m.id === message.id ? { ...m, time_seconds: parseInt(e.target.value) || 0 } : m
                                                            );
                                                            setChatMessages(updated);
                                                        }}
                                                        className="w-24 p-1.5 bg-neutral-600 rounded text-sm text-white"
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={message.message}
                                                    onChange={(e) => {
                                                        const updated = chatMessages.map(m => 
                                                            m.id === message.id ? { ...m, message: e.target.value } : m
                                                        );
                                                        setChatMessages(updated);
                                                    }}
                                                    className="w-full p-1.5 bg-neutral-600 rounded text-sm text-white"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await fetchJsonPost('/api/admin/webinar', {
                                                                    action: 'update_chat_message',
                                                                    message
                                                                });
                                                                setEditingMessage(null);
                                                                setSuccessMessage('Message updated');
                                                            } catch (err) {
                                                                setError('Failed to update message');
                                                                sendClientErrorEmail('Error updating message:', err);
                                                            }
                                                        }}
                                                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingMessage(null)}
                                                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{message.user_name}</p>
                                                    <p className="text-sm text-gray-300 break-words">{message.message}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {Math.floor(message.time_seconds / 60)}:{(message.time_seconds % 60).toString().padStart(2, '0')}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1 ml-2 flex-shrink-0">
                                                    <button
                                                        onClick={() => setEditingMessage(message.id)}
                                                        className="p-1.5 text-blue-400 hover:bg-blue-600/20 rounded"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('Delete this message?')) return;
                                                            
                                                            try {
                                                                await fetchJsonPost('/api/admin/webinar', {
                                                                    action: 'delete_chat_message',
                                                                    message_id: message.id,
                                                                    webinar_id: selectedWebinarForChat
                                                                });
                                                                setChatMessages(chatMessages.filter(m => m.id !== message.id));
                                                                setSuccessMessage('Message deleted');
                                                            } catch (err) {
                                                                setError('Failed to delete message');
                                                                sendClientErrorEmail('Error deleting message:', err);
                                                            }
                                                        }}
                                                        className="p-1.5 text-red-400 hover:bg-red-600/20 rounded"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    const renderWebinarList = () => (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
                <h3 className="text-lg sm:text-xl font-semibold text-white">Existing Webinars ({webinars.length})</h3>
                <button
                    onClick={() => setActiveSubTab('create')}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Create New Webinar
                </button>
            </div>

            {webinars.length === 0 ? (
                <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-6 sm:p-8 text-center">
                    <Calendar className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-500" />
                    <h4 className="text-base sm:text-lg font-medium text-gray-300 mb-2">No Webinars Found</h4>
                    <p className="text-gray-500 mb-4 sm:mb-6 text-sm">Create your first webinar to get started.</p>
                    <button
                        onClick={() => setActiveSubTab('create')}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Create Webinar
                    </button>
                </div>
            ) : (
                <div className="space-y-3 sm:space-y-4">
                    {webinars.map((webinar) => (
                        <div
                            key={webinar.id}
                            className="bg-neutral-900/50 border border-neutral-700/50 rounded-lg overflow-hidden"
                        >
                            <div
                                className="p-3 sm:p-4 cursor-pointer hover:bg-neutral-800/50 transition-colors"
                                onClick={() => toggleWebinarExpand(webinar.id)}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="flex items-start sm:items-center gap-3">
                                        <div className="bg-purple-600/20 p-2 rounded-lg flex-shrink-0">
                                            <Calendar className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-base sm:text-lg font-semibold text-white truncate">{webinar.title}</h3>
                                            <p className="text-xs sm:text-sm text-gray-400 truncate">{webinar.url}</p>
                                            <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-gray-500">
                                                {webinar.schedules && webinar.schedules.length > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {webinar.schedules.length} schedule{webinar.schedules.length !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                                {webinar.duration_seconds && (
                                                    <span>{Math.floor(webinar.duration_seconds / 60)} min</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                editWebinar(webinar);
                                            }}
                                            className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteWebinar(webinar.id);
                                            }}
                                            className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        {expandedWebinarId === webinar.id ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {expandedWebinarId === webinar.id && (
                                <div className="border-t border-neutral-700/50 p-3 sm:p-4 bg-neutral-800/30">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Video URL</p>
                                            <p className="text-sm text-gray-300 truncate">{webinar.video_url || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Offer Time</p>
                                            <p className="text-sm text-gray-300">{webinar.offer?.time ? `${webinar.offer.time} min` : '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Offer Button</p>
                                            <p className="text-sm text-gray-300">
                                                {webinar.offer?.button_text || '-'}
                                            </p>
                                        </div>
                                        <div className="sm:col-span-2 lg:col-span-3">
                                            <p className="text-xs text-gray-500 mb-1">Schedules</p>
                                            {webinar.schedules && webinar.schedules.length > 0 ? (
                                                <div className="space-y-1">
                                                    {webinar.schedules.map((schedule, idx) => (
                                                        <p key={idx} className="text-sm text-gray-300">
                                                            {schedule.label} - {schedule.type}
                                                            {schedule.recurrence && ` (${schedule.recurrence.days.join(', ')} at ${schedule.recurrence.time})`}
                                                            {schedule.daily && ` (Daily at ${schedule.daily.time})`}
                                                        </p>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-300">No schedules</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Webinar Management</h2>

            {/* Mobile Navigation */}
            <div className="lg:hidden mb-4">
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/50 border border-neutral-700/50 rounded-lg text-white"
                >
                    <span className="text-sm font-medium">
                        {activeSubTab === 'list' ? 'Webinar List' :
                         activeSubTab === 'create' ? 'Create Webinar' :
                         activeSubTab === 'import' ? 'Import Chat' :
                         'Manage Chats'}
                    </span>
                    {mobileMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {mobileMenuOpen && (
                    <div className="mt-2 bg-neutral-900/50 border border-neutral-700/50 rounded-lg overflow-hidden">
                        <button
                            onClick={() => {
                                setActiveSubTab('list');
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                                activeSubTab === 'list'
                                    ? 'bg-purple-600/20 text-purple-300'
                                    : 'text-gray-300 hover:bg-neutral-800/50'
                            } border-b border-neutral-700/50`}
                        >
                            <Calendar className="w-4 h-4 inline-block mr-2 opacity-70" />
                            Webinar List
                        </button>
                        <button
                            onClick={() => {
                                setActiveSubTab('create');
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                                activeSubTab === 'create'
                                    ? 'bg-purple-600/20 text-purple-300'
                                    : 'text-gray-300 hover:bg-neutral-800/50'
                            } border-b border-neutral-700/50`}
                        >
                            <Plus className="w-4 h-4 inline-block mr-2 opacity-70" />
                            Create Webinar
                        </button>
                        <button
                            onClick={() => {
                                setActiveSubTab('import');
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                                activeSubTab === 'import'
                                    ? 'bg-purple-600/20 text-purple-300'
                                    : 'text-gray-300 hover:bg-neutral-800/50'
                            } border-b border-neutral-700/50`}
                        >
                            <MessageSquare className="w-4 h-4 inline-block mr-2 opacity-70" />
                            Import Chat
                        </button>
                        <button
                            onClick={() => {
                                setActiveSubTab('chats');
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                                activeSubTab === 'chats'
                                    ? 'bg-purple-600/20 text-purple-300'
                                    : 'text-gray-300 hover:bg-neutral-800/50'
                            }`}
                        >
                            <MessageSquare className="w-4 h-4 inline-block mr-2 opacity-70" />
                            Manage Chats
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row overflow-hidden">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block lg:w-64 lg:min-h-[600px]">
                    <nav className="space-y-1">
                        <button
                            className={`w-full text-left px-4 py-2 rounded-lg flex items-center text-sm font-medium ${activeSubTab === 'list'
                                ? 'bg-purple-900/50 text-purple-200'
                                : 'text-gray-300 hover:bg-gray-800/50'
                                }`}
                            onClick={() => setActiveSubTab('list')}
                        >
                            <Calendar className="w-4 h-4 mr-3 opacity-70" />
                            Webinar List
                        </button>
                        <button
                            className={`w-full text-left px-4 py-2 rounded-lg flex items-center text-sm font-medium ${activeSubTab === 'create'
                                ? 'bg-purple-900/50 text-purple-200'
                                : 'text-gray-300 hover:bg-gray-800/50'
                                }`}
                            onClick={() => setActiveSubTab('create')}
                        >
                            <Plus className="w-4 h-4 mr-3 opacity-70" />
                            Create Webinar
                        </button>
                        <button
                            className={`w-full text-left px-4 py-2 rounded-lg flex items-center text-sm font-medium ${activeSubTab === 'import'
                                ? 'bg-purple-900/50 text-purple-200'
                                : 'text-gray-300 hover:bg-gray-800/50'
                                }`}
                            onClick={() => setActiveSubTab('import')}
                        >
                            <MessageSquare className="w-4 h-4 mr-3 opacity-70" />
                            Import Chat
                        </button>
                        <button
                            className={`w-full text-left px-4 py-2 rounded-lg flex items-center text-sm font-medium ${activeSubTab === 'chats'
                                ? 'bg-purple-900/50 text-purple-200'
                                : 'text-gray-300 hover:bg-gray-800/50'
                                }`}
                            onClick={() => setActiveSubTab('chats')}
                        >
                            <MessageSquare className="w-4 h-4 mr-3 opacity-70" />
                            Manage Chats
                        </button>
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 lg:p-6 lg:pt-0">
                    {error && (
                        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-red-400" />
                                <p className="text-red-400 text-xs sm:text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-green-400" />
                                <p className="text-green-400 text-xs sm:text-sm">{successMessage}</p>
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex justify-center items-center py-16 sm:py-20">
                            <Loader2 className="w-8 sm:w-10 h-8 sm:h-10 animate-spin text-purple-500" />
                        </div>
                    ) : (
                        <>
                            {activeSubTab === 'list' && renderWebinarList()}
                            {activeSubTab === 'create' && renderForm(isEditMode)}
                            {activeSubTab === 'import' && renderImportChat()}
                            {activeSubTab === 'chats' && renderChats()}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
} 
