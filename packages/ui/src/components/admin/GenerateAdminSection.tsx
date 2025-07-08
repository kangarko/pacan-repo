'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Download, Image as ImageIcon, Loader2, ArrowUpRight, Grid, ChevronDown, ChevronUp, RefreshCw, XCircle } from 'lucide-react';
import { fetchJsonPost, formatDate } from '@repo/ui/lib/utils';
import { sendClientErrorEmail } from '@repo/ui/lib/clientUtils';

interface GeneratedImage {
    id: number;
    prompt: string;
    flux_task_id: string;
    image_url?: string;
    aspect_ratio: string;
    status: string;
    created_at: string;
    user_id: string;
    error_message?: string;
}

interface GenerateTabProps {
    userRole?: string | null;
}

export function GenerateTab({ userRole }: GenerateTabProps) {
    const [subTab, setSubTab] = useState<'generator' | 'gallery'>('generator');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Media Generation</h2>

            {/* Mobile Navigation */}
            <div className="lg:hidden mb-4">
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/50 border border-neutral-700/50 rounded-lg text-white"
                >
                    <span className="text-sm font-medium">
                        {subTab === 'generator' ? 'Generate New' : 'Image Gallery'}
                    </span>
                    {mobileMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {mobileMenuOpen && (
                    <div className="mt-2 bg-neutral-900/50 border border-neutral-700/50 rounded-lg overflow-hidden">
                        <button
                            onClick={() => {
                                setSubTab('generator');
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${subTab === 'generator'
                                    ? 'bg-purple-600/20 text-purple-300'
                                    : 'text-gray-300 hover:bg-neutral-800/50'
                                } border-b border-neutral-700/50`}
                        >
                            <ImageIcon className="w-4 h-4 inline-block mr-2 opacity-70" />
                            Generate New
                        </button>
                        <button
                            onClick={() => {
                                setSubTab('gallery');
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${subTab === 'gallery'
                                    ? 'bg-purple-600/20 text-purple-300'
                                    : 'text-gray-300 hover:bg-neutral-800/50'
                                }`}
                        >
                            <Grid className="w-4 h-4 inline-block mr-2 opacity-70" />
                            Image Gallery
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row overflow-hidden">
                {/* Desktop Left Navigation Panel */}
                <div className="hidden lg:block lg:w-64 lg:min-h-[600px]">
                    <nav className="space-y-1">
                        <button
                            className={`w-full text-left px-4 py-2 rounded-lg flex items-center text-sm font-medium ${subTab === 'generator'
                                ? 'bg-purple-900/50 text-purple-200'
                                : 'text-gray-300 hover:bg-gray-800/50'
                                }`}
                            onClick={() => setSubTab('generator')}
                        >
                            <ImageIcon className="w-4 h-4 mr-3 opacity-70" />
                            Generate New
                        </button>
                        <button
                            className={`w-full text-left px-4 py-2 rounded-lg flex items-center text-sm font-medium ${subTab === 'gallery'
                                ? 'bg-purple-900/50 text-purple-200'
                                : 'text-gray-300 hover:bg-gray-800/50'
                                }`}
                            onClick={() => setSubTab('gallery')}
                        >
                            <Grid className="w-4 h-4 mr-3 opacity-70" />
                            Image Gallery
                        </button>
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 lg:p-6 lg:pt-0">
                    {subTab === 'generator' && <ImageGeneratorSubTab onImageGenerated={() => setSubTab('gallery')} />}
                    {subTab === 'gallery' && <ImageGallerySubTab userRole={userRole} />}
                </div>
            </div>
        </div>
    );
}

function ImageGeneratorSubTab({ onImageGenerated }: { onImageGenerated: () => void }) {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [enhanceBySamOvens, setEnhanceBySamOvens] = useState(true);
    const [model, setModel] = useState('flux-pro-1.1-ultra');

    const handleGenerateImage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }

        try {
            setIsGenerating(true);
            setError(null);

            const response = await fetchJsonPost('/api/admin/image', {
                action: 'generate_image',
                prompt,
                aspect_ratio: aspectRatio,
                enhance_by_sam_ovens: enhanceBySamOvens,
                model: model
            });

            if (response.task_id && response.image_id) {
                // Successfully generated, redirect to gallery
                onImageGenerated();
                setPrompt(''); // Clear the prompt for next use
            }

        } catch (error) {
            setError('Failed to generate image');
            sendClientErrorEmail("Failed to generate image: ", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <h3 className="text-xl font-semibold text-white mb-4">Generate Image</h3>

            <form onSubmit={handleGenerateImage} className="space-y-4">
                <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">
                        Prompt
                    </label>
                    <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-md text-white focus:ring-orange-500 focus:border-orange-500"
                        rows={3}
                        placeholder="Enter a detailed description of the image you want to generate..."
                        required
                    />
                </div>

                <div>
                    <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-300 mb-1">
                        Aspect Ratio
                    </label>
                    <select
                        id="aspectRatio"
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-md text-white focus:ring-orange-500 focus:border-orange-500"
                    >
                        <option value="16:9">16:9 - Landscape</option>
                        <option value="1:1">1:1 - Square</option>
                        <option value="4:3">4:3 - Standard</option>
                        <option value="9:16">9:16 - Portrait</option>
                        <option value="7:10">7:10 - B5 Book</option>
                        <option value="1:1.414">1:1.414 - A4 Paper</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-1">
                        Model
                    </label>
                    <select
                        id="model"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-md text-white focus:ring-orange-500 focus:border-orange-500"
                    >
                        <option value="flux-pro-1.1-ultra">Flux Pro 1.1 Ultra (Higher Quality)</option>
                        <option value="flux-kontext-max">Flux Kontext Max (Better Instruction Following)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-400">
                        Ultra model produces higher quality, larger images. Try Kontext model if instructions aren&apos;t being followed properly.
                    </p>
                </div>

                {/* Added checkbox for "Enhance by Sam Ovens" */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="enhanceBySamOvens"
                        checked={enhanceBySamOvens}
                        onChange={(e) => setEnhanceBySamOvens(e.target.checked)}
                        className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-600 bg-neutral-700 rounded"
                    />
                    <label htmlFor="enhanceBySamOvens" className="ml-2 block text-sm text-gray-300 group">
                        <b>Use Sam Ovens&apos; lexical bias</b>
                        <span className="invisible group-hover:visible absolute z-10 bg-neutral-900/95 border border-neutral-700 p-4 rounded-lg shadow-lg max-w-xl mt-2 text-xs">
                            Include humans in the frame (preferably one male and one female) with visible faces showing natural smiles while standing, not sitting. Eyes open and gazing directly at the viewer. Set the scene outdoors with natural elements like sky, trees, grass or water visible in the background. Use bright daylight lighting with clear blue skies and vibrant yet natural colors throughout the composition. Consider adding an animal or pet. Make the image appear authentic and candid rather than posed, using a wide shot that provides environmental context while keeping humans as the focal point. Avoid negative or threatening elements. Create the feeling of a casual moment captured naturally with high contrast and bright lighting to enhance visual appeal and engagement
                        </span>
                    </label>
                </div>

                {error && (
                    <div className="p-3 bg-red-900/40 border border-red-800 rounded-md text-red-200 text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-md flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <ImageIcon className="w-5 h-5 mr-2" />
                            Generate Image
                        </>
                    )}
                </button>
            </form>
        </>
    );
}

function ImageGallerySubTab({ userRole }: { userRole?: string | null }) {
    const [images, setImages] = useState<GeneratedImage[]>([]);
    const [loadingImages, setLoadingImages] = useState(true);
    const [pendingImages, setPendingImages] = useState<{ imageId: number, taskId: string, progress?: number }[]>([]);
    const [editingImageId, setEditingImageId] = useState<number | null>(null);
    const [editPrompt, setEditPrompt] = useState('');
    const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedPrompts, setExpandedPrompts] = useState<Set<number>>(new Set());

    // Add states for regeneration prompt modal
    const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
    const [regenerateImageId, setRegenerateImageId] = useState<number | null>(null);
    const [regeneratePrompt, setRegeneratePrompt] = useState('');
    const [regenerateModel, setRegenerateModel] = useState('flux-pro-1.1-ultra');

    const isMarketer = userRole === 'marketer';

    const fetchImages = useCallback(async () => {
        try {
            setLoadingImages(true);
            const response = await fetchJsonPost('/api/admin/image', {
                action: 'list_images'
            });

            setImages(response.images || []);

            // Create array of pending images to poll
            const pending = (response.images || [])
                .filter((img: GeneratedImage) => img.status === 'pending')
                .map((img: GeneratedImage) => ({
                    imageId: img.id,
                    taskId: img.flux_task_id,
                    progress: 0
                }));

            setPendingImages(pending);

        } catch (error) {
            sendClientErrorEmail("Failed to fetch images: ", error);
        } finally {
            setLoadingImages(false);
        }
    }, []);

    // Fetch all images when the component mounts
    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    const checkPendingImages = useCallback(async () => {
        // Create a copy of the pending images
        const updatedPending = [...pendingImages];
        let shouldRefetch = false;
        let removed = false;

        // Process one at a time to avoid race conditions
        for (let i = 0; i < updatedPending.length; i++) {
            try {
                const { imageId, taskId } = updatedPending[i];
                const response = await fetchJsonPost('/api/admin/image', {
                    action: 'check_image',
                    image_id: imageId,
                    task_id: taskId
                });

                // Update progress if available
                if (response.progress !== undefined) {
                    updatedPending[i].progress = response.progress;
                }

                if (response.status === 'Ready' || response.status === 'Error' || response.status === 'error' || response.status === 'deleted') {
                    // Remove this item immediately from state to prevent further checks
                    setPendingImages(prev => prev.filter(p => !(p.imageId === imageId && p.taskId === taskId)));

                    // Also remove from our local copy to avoid checking other entries that might have been removed
                    updatedPending.splice(i, 1);
                    i--;
                    shouldRefetch = true;
                    removed = true;

                    // If we got a Ready response, immediately break to prevent checking others
                    // until next polling cycle
                    if (response.status === 'Ready') {
                        // If we have a temporary URL, update the image in our state
                        if (response.image_url) {
                            setImages(prevImages =>
                                prevImages.map(img =>
                                    img.id === imageId
                                        ? { ...img, image_url: response.image_url, status: 'completed' }
                                        : img
                                )
                            );
                        }
                        break;
                    } else if (response.status === 'error' || response.status === 'Error') {
                        // Update the image status to error with the message
                        setImages(prevImages =>
                            prevImages.map(img =>
                                img.id === imageId
                                    ? { ...img, status: 'error', error_message: response.message || 'Image generation failed' }
                                    : img
                            )
                        );
                        break;
                    }
                }
            } catch (error) {
                sendClientErrorEmail('Error checking image status', error);
            }
        }

        // Only update state if we didn't remove anything above
        if (!removed) {
            setPendingImages(updatedPending);
        }

        if (shouldRefetch) {
            fetchImages();
        }
    }, [pendingImages, setPendingImages, fetchImages, setImages]);

    // Poll for pending images status
    useEffect(() => {
        if (pendingImages.length === 0) return;

        const intervalId = setInterval(() => {
            checkPendingImages();
        }, 3000);

        return () => clearInterval(intervalId);
    }, [pendingImages, checkPendingImages]);

    const handleDeleteImage = async (imageId: number) => {
        if (!confirm('Are you sure you want to delete this image?')) return;

        try {
            await fetchJsonPost('/api/admin/image', {
                action: 'delete_image',
                image_id: imageId
            });

            // Remove from state
            setImages(images.filter(img => img.id !== imageId));
            setPendingImages(pendingImages.filter(p => p.imageId !== imageId));

        } catch (error) {
            sendClientErrorEmail("Error deleting image: ", error);
        }
    };

    const startEditPrompt = (image: GeneratedImage) => {
        setEditingImageId(image.id);
        setEditPrompt(image.prompt);
    };

    const cancelEditPrompt = () => {
        setEditingImageId(null);
        setEditPrompt('');
    };

    const saveEditPrompt = async (imageId: number) => {
        try {
            await fetchJsonPost('/api/admin/image', {
                action: 'update_image',
                image_id: imageId,
                prompt: editPrompt
            });

            // Update in the state with proper typing
            setImages(images.map((img: GeneratedImage) =>
                img.id === imageId
                    ? { ...img, prompt: editPrompt }
                    : img
            ));

            cancelEditPrompt();

        } catch (error) {
            sendClientErrorEmail("Failed to update prompt: ", error);
        }
    };

    const openImageModal = (image: GeneratedImage) => {
        setSelectedImage(image);
        setIsModalOpen(true);
        // Prevent background scrolling when modal is open
        document.body.style.overflow = 'hidden';
    };

    const closeImageModal = () => {
        setSelectedImage(null);
        setIsModalOpen(false);
        // Restore scrolling when modal is closed
        document.body.style.overflow = '';
    };

    const downloadImage = (url: string, filename: string) => {
        fetch(url)
            .then(response => response.blob())
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
            })
            .catch(error => {
                sendClientErrorEmail("Failed to download image: ", error);
            });
    };

    const openRegenerateModal = (image: GeneratedImage) => {
        setRegenerateImageId(image.id);
        setRegeneratePrompt(image.prompt);
        setRegenerateModel('flux-pro-1.1-ultra'); // Reset to default
        setIsRegenerateModalOpen(true);
    };

    const closeRegenerateModal = () => {
        setIsRegenerateModalOpen(false);
        setRegenerateImageId(null);
        setRegeneratePrompt('');
        setRegenerateModel('flux-pro-1.1-ultra');
    };

    const handleRegenerateSubmit = async () => {
        if (!regenerateImageId || !regeneratePrompt.trim())
            return;

        try {
            setIsRegenerateModalOpen(false);

            const response = await fetchJsonPost('/api/admin/image', {
                action: 'generate_image',
                prompt: regeneratePrompt,
                aspect_ratio: images.find(img => img.id === regenerateImageId)?.aspect_ratio || '16:9',
                image_id: regenerateImageId,
                enhance_by_sam_ovens: false,
                model: regenerateModel
            });

            if (response.task_id && response.image_id) {
                setPendingImages([...pendingImages, {
                    imageId: response.image_id,
                    taskId: response.task_id
                }]);

                await fetchImages(); // Refresh the images list
            }

        } catch (error) {
            sendClientErrorEmail("Failed to regenerate image: ", error);
        }
    };

    const togglePromptExpansion = (imageId: number) => {
        setExpandedPrompts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(imageId)) {
                newSet.delete(imageId);
            } else {
                newSet.add(imageId);
            }
            return newSet;
        });
    };

    return (
        <>
            <h3 className="text-xl font-semibold text-white mb-4">Generated Images</h3>

            {loadingImages ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
            ) : images.length === 0 ? (
                <p className="text-gray-400 text-center py-10">No images generated yet</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images.map((image: GeneratedImage) => {
                        // Find if this image is in the pendingImages array
                        const pendingInfo = pendingImages.find(p => p.imageId === image.id);
                        const isGenerating = image.status === 'pending' || Boolean(pendingInfo);
                        const isError = image.status === 'error';
                        const progress = pendingInfo?.progress || 0;

                        return (
                            <div key={image.id} className="bg-neutral-900/70 rounded-lg overflow-hidden border border-neutral-800">
                                <div className="relative aspect-[16/9] bg-neutral-950 flex items-center justify-center">
                                    {isError ? (
                                        <div className="flex flex-col items-center justify-center h-full p-4 w-full">
                                            <XCircle className="w-12 h-12 text-red-500 mb-3" />
                                            <p className="text-red-400 text-sm font-medium mb-2">Generation Failed</p>
                                            <p className="text-gray-400 text-xs text-center">
                                                {image.error_message || 'Unknown error occurred'}
                                            </p>
                                        </div>
                                    ) : !isGenerating && image.image_url ? (
                                        <div
                                            className="w-full h-full relative cursor-pointer"
                                            onClick={() => openImageModal(image)}
                                        >
                                            <Image
                                                width={image.aspect_ratio === '16:9' ? 1600 : image.aspect_ratio === '4:3' ? 1200 : 800}
                                                height={image.aspect_ratio === '16:9' ? 900 : image.aspect_ratio === '4:3' ? 900 : 800}
                                                src={image.image_url}
                                                alt={image.prompt}
                                                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full p-4 w-full">
                                            <div className="mb-3 relative w-16 h-16">
                                                {/* Progress circle */}
                                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                                    {/* Base circle */}
                                                    <circle
                                                        cx="50" cy="50" r="40"
                                                        fill="none"
                                                        stroke="#2d2d2d"
                                                        strokeWidth="8"
                                                    />
                                                    {/* Progress circle */}
                                                    <circle
                                                        cx="50" cy="50" r="40"
                                                        fill="none"
                                                        stroke="#f97316"
                                                        strokeWidth="8"
                                                        strokeLinecap="round"
                                                        strokeDasharray="251.2"
                                                        strokeDashoffset={251.2 - (251.2 * (progress || 0))}
                                                        transform="rotate(-90 50 50)"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-orange-500">
                                                    {Math.round((progress || 0) * 100)}%
                                                </div>
                                            </div>
                                            <p className="text-gray-400 text-sm text-center animate-pulse">
                                                {progress === 1 ? "Finalizing image..." : "Generating image..."}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4">
                                    {editingImageId === image.id ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={editPrompt}
                                                onChange={(e) => setEditPrompt(e.target.value)}
                                                className="w-full px-3 py-2 bg-neutral-700/50 border border-neutral-600 rounded-md text-white text-sm"
                                                rows={3}
                                            />
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => saveEditPrompt(image.id)}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={cancelEditPrompt}
                                                    className="px-3 py-1 bg-neutral-600 hover:bg-neutral-700 text-white text-sm rounded-md"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`flex flex-col ${expandedPrompts.has(image.id) ? '' : 'h-[160px]'} justify-between`}>
                                            <div className="mb-2">
                                                <p className={`text-gray-300 text-sm ${expandedPrompts.has(image.id) ? '' : 'line-clamp-3'}`}>
                                                    {image.prompt}
                                                </p>
                                                {image.prompt.length > 150 && (
                                                    <button
                                                        onClick={() => togglePromptExpansion(image.id)}
                                                        className="text-xs text-gray-400 hover:text-gray-300 mt-1"
                                                    >
                                                        {expandedPrompts.has(image.id) ? 'Show less' : 'Show more'}
                                                    </button>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-xs text-gray-500">
                                                        {formatDate(image.created_at)}
                                                    </span>
                                                    <span className="text-xs uppercase px-2 py-1 rounded bg-neutral-800 text-gray-400">
                                                        {image.aspect_ratio}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 justify-between">
                                                    <div className="flex gap-2">
                                                        {!isMarketer && (
                                                            <>
                                                                <button
                                                                    onClick={() => startEditPrompt(image)}
                                                                    disabled={isGenerating || isError}
                                                                    className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-medium rounded-md inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteImage(image.id)}
                                                                    disabled={isGenerating}
                                                                    className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium rounded-md inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={() => openRegenerateModal(image)}
                                                            disabled={isGenerating}
                                                            className="px-3 py-1.5 bg-orange-600/80 hover:bg-orange-600 text-white text-xs font-medium rounded-md inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Regenerate
                                                        </button>
                                                    </div>
                                                    {!isGenerating && image.image_url && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => downloadImage(image.image_url!, `image-${image.id}.jpeg`)}
                                                                className="px-3 py-1.5 bg-green-600/80 hover:bg-green-600 text-white text-xs font-medium rounded-md inline-flex items-center"
                                                            >
                                                                <Download className="w-3 h-3 mr-1" />
                                                                Download
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Full-size Image Modal */}
            {isModalOpen && selectedImage && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-filter backdrop-blur-md overflow-hidden flex items-start justify-center pt-16"
                    onClick={closeImageModal}
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
                        className="max-w-4xl w-full bg-neutral-900 rounded-lg overflow-hidden shadow-2xl max-h-[80vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: 'relative', zIndex: 10000 }}
                    >
                        <div className="p-4 bg-neutral-800 flex justify-between items-center">
                            <h3 className="text-white font-medium line-clamp-1">
                                {selectedImage.prompt}
                            </h3>
                            <button
                                onClick={closeImageModal}
                                className="text-gray-400 hover:text-white"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-4 overflow-hidden flex-grow">
                            <Image
                                src={selectedImage.image_url || ''}
                                alt={selectedImage.prompt}
                                className="w-full h-auto object-contain"
                                width={selectedImage.aspect_ratio === '16:9' ? 1600 : selectedImage.aspect_ratio === '4:3' ? 1200 : 800}
                                height={selectedImage.aspect_ratio === '16:9' ? 900 : selectedImage.aspect_ratio === '4:3' ? 900 : 800}
                                style={{ maxHeight: '100vh' }}
                            />
                        </div>
                        <div className="p-4 bg-neutral-800">
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-400">
                                    Created: {new Date(selectedImage.created_at).toLocaleString()}
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => downloadImage(selectedImage.image_url!, `image-${selectedImage.id}.jpeg`)}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md inline-flex items-center"
                                    >
                                        <Download className="w-4 h-4 mr-1" />
                                        Download
                                    </button>
                                    <a
                                        href={selectedImage.image_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md inline-flex items-center"
                                    >
                                        <ArrowUpRight className="w-4 h-4 mr-1" />
                                        Open Original
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Regenerate Prompt Modal */}
            <RegeneratePromptModal
                isOpen={isRegenerateModalOpen}
                onClose={closeRegenerateModal}
                prompt={regeneratePrompt}
                onPromptChange={setRegeneratePrompt}
                model={regenerateModel}
                onModelChange={setRegenerateModel}
                onSubmit={handleRegenerateSubmit}
            />


            {/* Full-size Image Modal using Portal */}
            <FullSizeImageModal
                isOpen={isModalOpen}
                onClose={closeImageModal}
                image={selectedImage}
                downloadImage={downloadImage}
            />
        </>
    );
}

// Add RegeneratePromptModal component before the GenerateTab function
function RegeneratePromptModal({
    isOpen,
    onClose,
    prompt,
    onPromptChange,
    model,
    onModelChange,
    onSubmit
}: {
    isOpen: boolean,
    onClose: () => void,
    prompt: string,
    onPromptChange: (value: string) => void,
    model: string,
    onModelChange: (value: string) => void,
    onSubmit: () => void
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
                        Customize Regeneration Prompt
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
                        Edit prompt for regeneration
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => onPromptChange(e.target.value)}
                        className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:ring-orange-500 focus:border-orange-500"
                        rows={5}
                        placeholder="Enter a detailed description of the image you want to generate..."
                    />

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Model
                        </label>
                        <select
                            value={model}
                            onChange={(e) => onModelChange(e.target.value)}
                            className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:ring-orange-500 focus:border-orange-500"
                        >
                            <option value="flux-pro-1.1-ultra">Flux Pro 1.1 Ultra (Higher Quality)</option>
                            <option value="flux-kontext-max">Flux Kontext Max (Better Instruction Following)</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-400">
                            Ultra model produces higher quality, larger images. Try Kontext model if instructions aren&apos;t being followed properly.
                        </p>
                    </div>

                    <div className="flex justify-end mt-4 space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md inline-flex items-center"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSubmit}
                            disabled={!prompt.trim()}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Regenerate
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

// Add FullSizeImageModal component before GenerateTab
function FullSizeImageModal({
    isOpen,
    onClose,
    image,
    downloadImage
}: {
    isOpen: boolean,
    onClose: () => void,
    image: GeneratedImage | null,
    downloadImage: (url: string, filename: string) => void
}) {
    if (!isOpen || !image) return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-black/80 backdrop-filter backdrop-blur-md overflow-hidden flex items-start justify-center pt-16"
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
                className="max-w-4xl w-full bg-neutral-900 rounded-lg overflow-hidden shadow-2xl max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
                style={{ position: 'relative', zIndex: 10000 }}
            >
                <div className="p-4 bg-neutral-800 flex justify-between items-center">
                    <h3 className="text-white font-medium line-clamp-1">
                        {image.prompt}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-4 overflow-hidden flex-grow">
                    <Image
                        src={image.image_url || ''}
                        alt={image.prompt}
                        className="w-full h-auto object-contain"
                        width={image.aspect_ratio === '16:9' ? 1600 : image.aspect_ratio === '4:3' ? 1200 : 800}
                        height={image.aspect_ratio === '16:9' ? 900 : image.aspect_ratio === '4:3' ? 900 : 800}
                        style={{ maxHeight: '100vh' }}
                    />
                </div>
                <div className="p-4 bg-neutral-800">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-400">
                            Created: {new Date(image.created_at).toLocaleString()}
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => downloadImage(image.image_url!, `image-${image.id}.jpeg`)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md inline-flex items-center"
                            >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                            </button>
                            <a
                                href={image.image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md inline-flex items-center"
                            >
                                <ArrowUpRight className="w-4 h-4 mr-1" />
                                Open Original
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}