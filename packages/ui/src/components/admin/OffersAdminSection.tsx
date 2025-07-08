'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Package, PlusCircle, Edit, Trash2, AlertCircle, Loader2, X, ChevronDown, ChevronUp, Save, ShoppingBag, Upload, FileText, Search, Plus, Minus } from 'lucide-react';
import { sendClientErrorEmail } from '@repo/ui/lib/clientUtils';
import { fetchJsonPost } from '@repo/ui/lib/utils';
import { Offer, OfferType, RegionPrice } from '@repo/ui/lib/types';
import Image from 'next/image';
import IconPicker from '@repo/ui/components/IconPicker';
import { DEFAULT_ICON } from '@repo/ui/lib/iconMapping';

// Country data for the dropdown
const COUNTRIES = [
    { code: 'AF', name: 'Afghanistan' },
    { code: 'AL', name: 'Albania' },
    { code: 'DZ', name: 'Algeria' },
    { code: 'AD', name: 'Andorra' },
    { code: 'AO', name: 'Angola' },
    { code: 'AG', name: 'Antigua and Barbuda' },
    { code: 'AR', name: 'Argentina' },
    { code: 'AM', name: 'Armenia' },
    { code: 'AU', name: 'Australia' },
    { code: 'AT', name: 'Austria' },
    { code: 'AZ', name: 'Azerbaijan' },
    { code: 'BS', name: 'Bahamas' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BB', name: 'Barbados' },
    { code: 'BY', name: 'Belarus' },
    { code: 'BE', name: 'Belgium' },
    { code: 'BZ', name: 'Belize' },
    { code: 'BJ', name: 'Benin' },
    { code: 'BT', name: 'Bhutan' },
    { code: 'BA', name: 'Bosnia and Herzegovina' },
    { code: 'BW', name: 'Botswana' },
    { code: 'BR', name: 'Brazil' },
    { code: 'BN', name: 'Brunei' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'BF', name: 'Burkina Faso' },
    { code: 'BI', name: 'Burundi' },
    { code: 'CV', name: 'Cabo Verde' },
    { code: 'KH', name: 'Cambodia' },
    { code: 'CM', name: 'Cameroon' },
    { code: 'CA', name: 'Canada' },
    { code: 'CF', name: 'Central African Republic' },
    { code: 'TD', name: 'Chad' },
    { code: 'CL', name: 'Chile' },
    { code: 'CN', name: 'China' },
    { code: 'CO', name: 'Colombia' },
    { code: 'KM', name: 'Comoros' },
    { code: 'CG', name: 'Congo' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'HR', name: 'Croatia' },
    { code: 'CU', name: 'Cuba' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'DK', name: 'Denmark' },
    { code: 'DJ', name: 'Djibouti' },
    { code: 'DM', name: 'Dominica' },
    { code: 'DO', name: 'Dominican Republic' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'EG', name: 'Egypt' },
    { code: 'SV', name: 'El Salvador' },
    { code: 'GQ', name: 'Equatorial Guinea' },
    { code: 'ER', name: 'Eritrea' },
    { code: 'EE', name: 'Estonia' },
    { code: 'ET', name: 'Ethiopia' },
    { code: 'FJ', name: 'Fiji' },
    { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'France' },
    { code: 'GA', name: 'Gabon' },
    { code: 'GM', name: 'Gambia' },
    { code: 'GE', name: 'Georgia' },
    { code: 'DE', name: 'Germany' },
    { code: 'GH', name: 'Ghana' },
    { code: 'GR', name: 'Greece' },
    { code: 'GD', name: 'Grenada' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'GN', name: 'Guinea' },
    { code: 'GW', name: 'Guinea-Bissau' },
    { code: 'GY', name: 'Guyana' },
    { code: 'HT', name: 'Haiti' },
    { code: 'HN', name: 'Honduras' },
    { code: 'HU', name: 'Hungary' },
    { code: 'IS', name: 'Iceland' },
    { code: 'IN', name: 'India' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'IR', name: 'Iran' },
    { code: 'IQ', name: 'Iraq' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IL', name: 'Israel' },
    { code: 'IT', name: 'Italy' },
    { code: 'JM', name: 'Jamaica' },
    { code: 'JP', name: 'Japan' },
    { code: 'JO', name: 'Jordan' },
    { code: 'KZ', name: 'Kazakhstan' },
    { code: 'KE', name: 'Kenya' },
    { code: 'KI', name: 'Kiribati' },
    { code: 'KP', name: 'North Korea' },
    { code: 'KR', name: 'South Korea' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'KG', name: 'Kyrgyzstan' },
    { code: 'LA', name: 'Laos' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LB', name: 'Lebanon' },
    { code: 'LS', name: 'Lesotho' },
    { code: 'LR', name: 'Liberia' },
    { code: 'LY', name: 'Libya' },
    { code: 'LI', name: 'Liechtenstein' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'MG', name: 'Madagascar' },
    { code: 'MW', name: 'Malawi' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'MV', name: 'Maldives' },
    { code: 'ML', name: 'Mali' },
    { code: 'MT', name: 'Malta' },
    { code: 'MH', name: 'Marshall Islands' },
    { code: 'MR', name: 'Mauritania' },
    { code: 'MU', name: 'Mauritius' },
    { code: 'MX', name: 'Mexico' },
    { code: 'FM', name: 'Micronesia' },
    { code: 'MD', name: 'Moldova' },
    { code: 'MC', name: 'Monaco' },
    { code: 'MN', name: 'Mongolia' },
    { code: 'ME', name: 'Montenegro' },
    { code: 'MA', name: 'Morocco' },
    { code: 'MZ', name: 'Mozambique' },
    { code: 'MM', name: 'Myanmar' },
    { code: 'NA', name: 'Namibia' },
    { code: 'NR', name: 'Nauru' },
    { code: 'NP', name: 'Nepal' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'NE', name: 'Niger' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'NO', name: 'Norway' },
    { code: 'OM', name: 'Oman' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'PW', name: 'Palau' },
    { code: 'PA', name: 'Panama' },
    { code: 'PG', name: 'Papua New Guinea' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'PE', name: 'Peru' },
    { code: 'PH', name: 'Philippines' },
    { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'QA', name: 'Qatar' },
    { code: 'RO', name: 'Romania' },
    { code: 'RU', name: 'Russia' },
    { code: 'RW', name: 'Rwanda' },
    { code: 'KN', name: 'Saint Kitts and Nevis' },
    { code: 'LC', name: 'Saint Lucia' },
    { code: 'VC', name: 'Saint Vincent and the Grenadines' },
    { code: 'WS', name: 'Samoa' },
    { code: 'SM', name: 'San Marino' },
    { code: 'ST', name: 'Sao Tome and Principe' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'SN', name: 'Senegal' },
    { code: 'RS', name: 'Serbia' },
    { code: 'SC', name: 'Seychelles' },
    { code: 'SL', name: 'Sierra Leone' },
    { code: 'SG', name: 'Singapore' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'SB', name: 'Solomon Islands' },
    { code: 'SO', name: 'Somalia' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'SS', name: 'South Sudan' },
    { code: 'ES', name: 'Spain' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'SD', name: 'Sudan' },
    { code: 'SR', name: 'Suriname' },
    { code: 'SZ', name: 'Eswatini' },
    { code: 'SE', name: 'Sweden' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'SY', name: 'Syria' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'TJ', name: 'Tajikistan' },
    { code: 'TZ', name: 'Tanzania' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TL', name: 'Timor-Leste' },
    { code: 'TG', name: 'Togo' },
    { code: 'TO', name: 'Tonga' },
    { code: 'TT', name: 'Trinidad and Tobago' },
    { code: 'TN', name: 'Tunisia' },
    { code: 'TR', name: 'Turkey' },
    { code: 'TM', name: 'Turkmenistan' },
    { code: 'TV', name: 'Tuvalu' },
    { code: 'UG', name: 'Uganda' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'UZ', name: 'Uzbekistan' },
    { code: 'VU', name: 'Vanuatu' },
    { code: 'VA', name: 'Vatican City' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'YE', name: 'Yemen' },
    { code: 'ZM', name: 'Zambia' },
    { code: 'ZW', name: 'Zimbabwe' }
];

export function OffersAdminSection() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [expandedOfferSlug, setExpandedOfferSlug] = useState<string | null>(null);

    // File upload related states
    const [fileUploading, setFileUploading] = useState(false);
    const [thumbnailUploading, setThumbnailUploading] = useState(false);
    const [fileUploadProgress, setFileUploadProgress] = useState(0);
    const [thumbnailUploadProgress, setThumbnailUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    // Country search and region states
    const [countrySearch, setCountrySearch] = useState('');
    const [addingRegionForCountry, setAddingRegionForCountry] = useState<string | null>(null);

    // Load offers data
    useEffect(() => {
        const fetchOffers = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const { offers: fetchedOffers } = await fetchJsonPost('/api/admin/offer', {
                    action: 'list'
                });

                setOffers(fetchedOffers);
                setIsLoading(false);

            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Failed to fetch offers';

                setError(errorMsg);
                sendClientErrorEmail('Error fetching offers:', err);
                setIsLoading(false);
            }
        };

        fetchOffers();
    }, []);

    const toggleOfferExpand = (slug: string) => {
        setExpandedOfferSlug(expandedOfferSlug === slug ? null : slug);
    };

    const handleEditOffer = (offer: Offer) => {
        setEditingOffer({ 
            ...offer, 
            metadata: offer.metadata || { order_form_heading: '' } // Ensure metadata exists
        });
        setIsCreatingNew(false);
        setCountrySearch('');
        setAddingRegionForCountry(null);
    };

    const handleCreateNew = () => {
        setEditingOffer({
            slug: '',
            name: '',
            short_description: '',
            description: '',
            type: OfferType.PRIMARY,
            file_path: '',
            thumbnail_url: '',
            price: 0,
            currency: 'EUR',
            price_eur: 0,
            region_prices: {},
            metadata: { order_form_heading: '' } // Initialize metadata
        });
        setIsCreatingNew(true);
        setCountrySearch('');
        setAddingRegionForCountry(null);
    };

    const handleCancelEdit = () => {
        setEditingOffer(null);
        setIsCreatingNew(false);
        setCountrySearch('');
        setAddingRegionForCountry(null);
    };

    // Helper functions to update offer fields
    const updateMetadataField = (field: string, val: string) => {
        setEditingOffer(prev => {
            if (!prev) return prev
            return {
                ...prev,
                metadata: {
                    ...(prev.metadata || {}),
                    [field]: val
                }
            }
        })
    }

    const updateRegionPriceField = (region: string, field: string, val: string) => {
        setEditingOffer(prev => {
            if (!prev) return prev
            const updatedRegionPrices = { ...prev.region_prices }
            const updatedRegion = { ...updatedRegionPrices[region] }

            if (field === 'price' || field === 'discounted_price' || field === 'discounted_price_eur')
                updatedRegion[field] = parseFloat(val) || 0
            else if (field === 'currency')
                updatedRegion.currency = val

            updatedRegionPrices[region] = updatedRegion

            return {
                ...prev,
                region_prices: updatedRegionPrices
            }
        })
    }

    const updateGeneralField = (name: string, val: string) => {
        // Handle auto-generate slug from name on create
        if (name === 'name' && isCreatingNew) {
            const generatedSlug = generateSlug(val)
            setEditingOffer(prev => {
                if (!prev) return prev
                return { ...prev, name: val, slug: generatedSlug }
            })
            return
        }
        
        setEditingOffer(prev => {
            if (!prev) return prev

            let processed: any = val
            if (name === 'price' || name === 'price_eur')
                processed = parseFloat(val) || 0

            return {
                ...prev,
                [name]: processed
            }
        })
    }

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!editingOffer) return

        const { name, value } = e.target

        // Metadata fields
        if (name.startsWith('metadata.')) {
            updateMetadataField(name.substring('metadata.'.length), value)
            return
        }

        // Region pricing fields
        if (name.includes('.')) {
            const [region, field] = name.split('.')
            if (!region || !field) return
            updateRegionPriceField(region, field, value)
            return
        }

        // Regular top-level fields
        updateGeneralField(name, value)
    }

    const validateForm = () => {
        if (!editingOffer) return false;
        
        // Check for required fields
        if (!editingOffer.name) {
            setError('Offer name is required');
            return false;
        }
        
        if (!editingOffer.slug) {
            setError('Offer slug is required');
            return false;
        }
        
        if (!editingOffer.description) {
            setError('Offer description is required');
            return false;
        }
        
        if (!editingOffer.type) {
            setError('Offer type is required');
            return false;
        }
        
        if (typeof editingOffer.price !== 'number' || editingOffer.price <= 0) {
            setError('Base price must be a positive number');
            return false;
        }
        
        if (!editingOffer.currency) {
            setError('Currency is required');
            return false;
        }
        
        if (typeof editingOffer.price_eur !== 'number' || editingOffer.price_eur <= 0) {
            setError('Euro price must be a positive number');
            return false;
        }
        
        return true;
    };

    const handleSaveOffer = async () => {
        if (!editingOffer) return;

        // Validate form before submitting
        if (!validateForm()) {
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // API call to save the offer
            const result = await fetchJsonPost('/api/admin/offer', {
                action: 'save',
                offer: editingOffer
            });

            if (!result.success) {
                // Handle validation errors returned from the API
                setError(result.message || 'Failed to save offer');
                setIsLoading(false);
                return;
            }

            // Refresh the offers list
            const { offers: updatedOffers } = await fetchJsonPost('/api/admin/offer', {
                action: 'list'
            });

            if (updatedOffers && updatedOffers.length > 0) {
                setOffers(updatedOffers);
            } else {
                // If API returns no data, update locally
                if (isCreatingNew) {
                    setOffers([...offers, editingOffer]);
                } else {
                    setOffers(offers.map(offer =>
                        offer.slug === editingOffer.slug ? editingOffer : offer
                    ));
                }
            }

            setEditingOffer(null);
            setIsCreatingNew(false);
            setIsLoading(false);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to save offer';
            setError(errorMsg);
            sendClientErrorEmail('Error saving offer:', err);
            setIsLoading(false);
        }
    };

    const handleDeleteOffer = async (slug: string) => {
        if (!confirm('Are you sure you want to delete this offer? This action cannot be undone.')) return;

        try {
            setIsLoading(true);
            setError(null);

            // API call to delete the offer
            const result = await fetchJsonPost('/api/admin/offer', {
                action: 'delete',
                slug
            });

            if (!result.success) {
                throw new Error(result.message || 'Failed to delete offer');
            }

            // Refresh the offers list
            const { offers: updatedOffers } = await fetchJsonPost('/api/admin/offer', {
                action: 'list'
            });

            if (updatedOffers) {
                setOffers(updatedOffers);
            } else {
                // If API returns no data, update locally
                setOffers(offers.filter(offer => offer.slug !== slug));
            }

            setIsLoading(false);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to delete offer';
            setError(errorMsg);
            sendClientErrorEmail('Error deleting offer:', err);
            setIsLoading(false);
        }
    };

    // Function to generate slug from name
    const generateSlug = (name: string): string => {
        return name
            .toLowerCase()
            .normalize('NFD') // Normalize to decomposed form for handling accents
            .replace(/[\u0300-\u036f]/g, '') // Remove accents/diacritics
            .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
            .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
            .trim();
    };

    // Handle file upload via the API route
    const uploadFile = async (file: File, type: 'file' | 'thumbnail', setProgress: (progress: number) => void): Promise<string> => {
        try {
            // Set initial progress
            setProgress(10);

            // Convert file to base64
            const reader = new FileReader();

            return new Promise((resolve, reject) => {
                reader.onload = async (event) => {
                    if (!event.target || !event.target.result) {
                        reject(new Error('Failed to read file'));
                        return;
                    }

                    const fileData = event.target.result.toString();

                    // Update progress
                    setProgress(30);

                    try {
                        // Send to server
                        const result = await fetchJsonPost('/api/admin/offer', {
                            action: 'upload',
                            fileData,
                            fileName: file.name,
                            contentType: file.type,
                            uploadType: type
                        });

                        // Update progress
                        setProgress(90);

                        if (!result.success || !result.url) {
                            throw new Error('Failed to upload file: ' + result.message);
                        }

                        // Set progress to 100% when complete
                        setProgress(100);

                        resolve(result.url);
                    } catch (error) {
                        reject(error);
                    }
                };

                reader.onerror = () => {
                    reject(new Error('Failed to read file'));
                };

                reader.readAsDataURL(file);
            });
        } catch (error) {
            sendClientErrorEmail('Error uploading file:', error);
            throw error;
        }
    };

    // Handle file input change
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'thumbnail') => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        if (!editingOffer) return;

        try {
            if (type === 'file') {
                setFileUploading(true);
                // Upload PDF file
                const fileUrl = await uploadFile(file, 'file', setFileUploadProgress);
                setEditingOffer({ ...editingOffer, file_path: fileUrl });
                setFileUploading(false);
            } else {
                setThumbnailUploading(true);
                // Upload thumbnail image
                const thumbnailUrl = await uploadFile(file, 'thumbnail', setThumbnailUploadProgress);
                setEditingOffer({ ...editingOffer, thumbnail_url: thumbnailUrl });
                setThumbnailUploading(false);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to upload file');
            if (type === 'file') setFileUploading(false);
            else setThumbnailUploading(false);
        }
    };

    // Add a new region pricing
    const addRegionPricing = (countryCode: string) => {
        if (!editingOffer) return;

        // Find the country name for the code
        const country = COUNTRIES.find(c => c.code === countryCode);
        if (!country) return;

        // Check if region already exists
        if (editingOffer.region_prices[countryCode]) {
            setError(`Pricing for ${country.name} already exists`);
            return;
        }

        // Create new region pricing object
        const newRegionPrice: RegionPrice = {
            price: 0,
            discounted_price: 0,
            currency: editingOffer.currency,
            discounted_price_eur: 0
        };

        // Add to region prices
        setEditingOffer({
            ...editingOffer,
            region_prices: {
                ...editingOffer.region_prices,
                [countryCode]: newRegionPrice
            }
        });

        setAddingRegionForCountry(null);
        setCountrySearch('');
    };

    // Remove a region pricing
    const removeRegionPricing = (countryCode: string) => {
        if (!editingOffer) return;

        // Create a copy of region prices
        const updatedRegionPrices = { ...editingOffer.region_prices };

        // Delete the region
        delete updatedRegionPrices[countryCode];

        // Update offer
        setEditingOffer({
            ...editingOffer,
            region_prices: updatedRegionPrices
        });
    };

    // Form to edit or create an offer
    const renderOfferForm = () => {
        if (!editingOffer) return null;

        // Filter countries for dropdown
        const filteredCountries = COUNTRIES.filter(
            country => country.name.toLowerCase().includes(countrySearch.toLowerCase())
        );

        return (
            <div className="bg-gradient-to-br from-purple-900/20 to-neutral-900/90 border border-purple-700/30 rounded-xl p-8 mb-8 shadow-lg">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <ShoppingBag className="mr-3 text-purple-400" size={24} />
                    {isCreatingNew ? 'Create New Offer' : 'Edit Offer'}
                </h3>

                {error && (
                    <div className="bg-red-900/40 border border-red-500/30 rounded-lg p-4 mb-6 shadow-md">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <p className="text-red-400 font-medium">{error}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main offer details column */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-purple-300 mb-2">
                                    Offer Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editingOffer.name}
                                    onChange={handleFormChange}
                                    className="w-full p-3 bg-neutral-800/80 border border-purple-600/30 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    placeholder="Enter offer name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-purple-300 mb-2">
                                    Slug Identifier <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="slug"
                                    value={editingOffer.slug}
                                    onChange={handleFormChange}
                                    className="w-full p-3 bg-neutral-800/80 border border-purple-600/30 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-60"
                                    disabled={!isCreatingNew}
                                    placeholder="Auto-generated from name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-purple-300 mb-2">
                                    Offer Type <span className="text-red-400">*</span>
                                </label>
                                <select
                                    name="type"
                                    value={editingOffer.type}
                                    onChange={handleFormChange}
                                    className="w-full p-3 bg-neutral-800/80 border border-purple-600/30 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none"
                                    style={{
                                        backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23a78bfa' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                                        backgroundPosition: "right 0.5rem center",
                                        backgroundRepeat: "no-repeat",
                                        backgroundSize: "1.5em 1.5em",
                                        paddingRight: "2.5rem"
                                    }}
                                >
                                    <option value={OfferType.PRIMARY}>Primary</option>
                                    <option value={OfferType.SECONDARY}>Secondary</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-purple-300 mb-2">
                                    Base Price <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={editingOffer.price}
                                    onChange={handleFormChange}
                                    className="w-full p-3 bg-neutral-800/80 border border-purple-600/30 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-purple-300 mb-2">
                                    Currency <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="currency"
                                    value={editingOffer.currency}
                                    onChange={handleFormChange}
                                    className="w-full p-3 bg-neutral-800/80 border border-purple-600/30 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all uppercase"
                                    placeholder="EUR"
                                    maxLength={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-purple-300 mb-2">
                                    Euro Price (for PayPal) <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="price_eur"
                                    value={editingOffer.price_eur}
                                    onChange={handleFormChange}
                                    className="w-full p-3 bg-neutral-800/80 border border-purple-600/30 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-purple-300 mb-2">Short Description</label>
                            <input
                                type="text"
                                name="short_description"
                                value={editingOffer.short_description || ''}
                                onChange={handleFormChange}
                                className="w-full p-3 bg-neutral-800/80 border border-purple-600/30 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                placeholder="Brief description for listings"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-purple-300 mb-2">
                                Full Description <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                name="description"
                                value={editingOffer.description}
                                onChange={handleFormChange}
                                rows={4}
                                className="w-full p-3 bg-neutral-800/80 border border-purple-600/30 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-y"
                                placeholder="Detailed offer description"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-purple-300 mb-2">Order Form Heading</label>
                            <input
                                type="text"
                                name="metadata.order_form_heading"
                                value={editingOffer.metadata?.order_form_heading || ''}
                                onChange={handleFormChange}
                                className="w-full p-3 bg-neutral-800/80 border border-purple-600/30 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                placeholder="e.g., Naručite svoj primjerak danas"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-purple-300 mb-2">Order Form Subtitle</label>
                            <input
                                type="text"
                                name="metadata.order_form_subtitle"
                                value={editingOffer.metadata?.order_form_subtitle || ''}
                                onChange={handleFormChange}
                                className="w-full p-3 bg-neutral-800/80 border border-purple-600/30 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                placeholder="e.g., Dobit ćete bonus poglavlje za regulaciju živčanog sustava"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-purple-300 mb-2">Order Form Icon</label>
                            <IconPicker
                                selectedIcon={editingOffer.metadata?.icon_name || DEFAULT_ICON}
                                onChange={(icon) => updateMetadataField('icon_name', icon)}
                            />
                        </div>
                    </div>

                    {/* Upload & preview column */}
                    <div className="space-y-6">
                        <div className="bg-neutral-800/40 p-4 rounded-lg border border-neutral-700/40">
                            <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                                <FileText className="mr-2 text-purple-400" size={18} />
                                Digital Product File
                            </h4>
                            
                            <div className="space-y-3">
                                <div className="flex">
                                    <input
                                        type="text"
                                        value={editingOffer.file_path}
                                        readOnly
                                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700/30 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="No file uploaded"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={fileUploading}
                                        className="px-4 bg-[#6B498F] hover:bg-[#4b2c5e] text-white rounded-r-lg flex items-center justify-center transition-colors disabled:opacity-50 min-w-[50px]"
                                    >
                                        {fileUploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => handleFileUpload(e, 'file')}
                                        className="hidden"
                                    />
                                </div>

                                {fileUploading && (
                                    <div>
                                        <div className="h-2 w-full bg-neutral-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 transition-all duration-300"
                                                style={{ width: `${fileUploadProgress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Uploading: {fileUploadProgress}%</p>
                                    </div>
                                )}

                                {editingOffer.file_path && (
                                    <div className="mt-2">
                                        <a
                                            href={editingOffer.file_path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-2 transition-colors"
                                        >
                                            <FileText size={14} /> View Uploaded File
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-neutral-800/40 p-4 rounded-lg border border-neutral-700/40">
                            <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Thumbnail Image
                            </h4>

                            <div className="space-y-3">
                                <div className="flex">
                                    <input
                                        type="text"
                                        value={editingOffer.thumbnail_url || ''}
                                        readOnly
                                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700/30 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="No image uploaded"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => thumbnailInputRef.current?.click()}
                                        disabled={thumbnailUploading}
                                        className="px-4 bg-[#6B498F] hover:bg-[#4b2c5e] text-white rounded-r-lg flex items-center justify-center transition-colors disabled:opacity-50 min-w-[50px]"
                                    >
                                        {thumbnailUploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                                    </button>
                                    <input
                                        ref={thumbnailInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, 'thumbnail')}
                                        className="hidden"
                                    />
                                </div>

                                {thumbnailUploading && (
                                    <div>
                                        <div className="h-2 w-full bg-neutral-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 transition-all duration-300"
                                                style={{ width: `${thumbnailUploadProgress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Uploading: {thumbnailUploadProgress}%</p>
                                    </div>
                                )}
                            </div>

                            {editingOffer.thumbnail_url && (
                                <div className="mt-4 border border-neutral-700/60 rounded-lg overflow-hidden bg-neutral-900/50 p-1">
                                    <div className="relative w-full h-64 rounded-md overflow-hidden">
                                        <Image
                                            src={editingOffer.thumbnail_url}
                                            alt="Thumbnail preview"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Regional pricing section */}
                <div className="mt-10">
                    <div className="flex justify-between items-center mb-5">
                        <h4 className="text-xl font-semibold text-white flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Regional Pricing
                        </h4>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setAddingRegionForCountry(addingRegionForCountry ? null : 'new')}
                                className="px-4 py-2 bg-[#6B498F] hover:bg-[#4b2c5e] text-white rounded-lg flex items-center gap-2 transition-colors shadow-md"
                            >
                                <Plus size={18} /> Add Region
                            </button>

                            {addingRegionForCountry && (
                                <div className="absolute right-0 mt-2 w-80 bg-neutral-800 border border-purple-700/40 rounded-lg p-4 shadow-xl z-10">
                                    <div className="mb-3">
                                        <div className="relative">
                                            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                                            <input
                                                type="text"
                                                value={countrySearch}
                                                onChange={(e) => setCountrySearch(e.target.value)}
                                                placeholder="Search countries..."
                                                className="w-full pl-10 p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                        {filteredCountries.length === 0 ? (
                                            <p className="text-sm text-gray-400 p-2 text-center">No countries found</p>
                                        ) : (
                                            <ul className="space-y-1">
                                                {filteredCountries.map(country => (
                                                    <li key={country.code}>
                                                        <button
                                                            type="button"
                                                            onClick={() => addRegionPricing(country.code)}
                                                            className="w-full text-left p-2 hover:bg-purple-800/30 rounded text-sm text-white flex items-center transition-colors"
                                                        >
                                                            <span className="inline-block w-8 text-center mr-2 text-purple-300">{country.code}</span>
                                                            {country.name}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(editingOffer.region_prices).map(([region, pricing]) => {
                            // Find country name for the region code
                            const country = COUNTRIES.find(c => c.code === region);
                            const countryName = country ? country.name : region;

                            return (
                                <div key={region} className="p-4 bg-neutral-800/40 border border-purple-600/20 rounded-lg shadow-md hover:shadow-lg transition-all hover:border-purple-600/40">
                                    <div className="flex justify-between items-center mb-3">
                                        <h5 className="font-semibold text-purple-300 flex items-center">
                                            <span className="inline-block mr-2 text-xs px-2 py-1 bg-purple-900/40 rounded-md border border-purple-700/30">
                                                {region}
                                            </span>
                                            {countryName}
                                        </h5>
                                        <button
                                            type="button"
                                            onClick={() => removeRegionPricing(region)}
                                            className="text-red-400 hover:text-red-300 p-1 hover:bg-red-900/20 rounded-full transition-all"
                                        >
                                            <Minus size={16} />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Regular Price ({pricing.currency})</label>
                                                <input
                                                    type="number"
                                                    name={`${region}.price`}
                                                    value={pricing.price}
                                                    onChange={handleFormChange}
                                                    className="w-full p-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Discounted Price ({pricing.currency})</label>
                                                <input
                                                    type="number"
                                                    name={`${region}.discounted_price`}
                                                    value={pricing.discounted_price}
                                                    onChange={handleFormChange}
                                                    className="w-full p-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Euro Price (for PayPal)</label>
                                                <input
                                                    type="number"
                                                    name={`${region}.discounted_price_eur`}
                                                    value={pricing.discounted_price_eur}
                                                    onChange={handleFormChange}
                                                    className="w-full p-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1">Currency</label>
                                            <input
                                                type="text"
                                                name={`${region}.currency`}
                                                value={pricing.currency}
                                                onChange={handleFormChange}
                                                className="w-full p-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white uppercase"
                                                maxLength={3}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                    <button
                        onClick={handleCancelEdit}
                        className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg flex items-center gap-2 transition-colors border border-neutral-700"
                    >
                        <X size={18} /> Cancel
                    </button>
                    <button
                        onClick={handleSaveOffer}
                        className="px-5 py-2.5 bg-[#6B498F] hover:bg-[#4b2c5e] text-white rounded-lg flex items-center gap-2 transition-colors shadow-md"
                    >
                        <Save size={18} /> Save Offer
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Offers Management</h2>
                <button
                    onClick={handleCreateNew}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 text-sm"
                >
                    <PlusCircle className="w-4 h-4" />
                    Create New Offer
                </button>
            </div>

            {error && (
                <div className="bg-red-900/30 border-l-4 border-red-500 text-white p-3 sm:p-4 mb-4 sm:mb-6 rounded-r-md">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5" />
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex flex-col justify-center items-center h-64 space-y-3">
                    <div className="animate-spin rounded-full h-10 sm:h-12 w-10 sm:w-12 border-t-2 border-b-2 border-purple-500"></div>
                    <p className="text-gray-300 text-sm">Loading offers...</p>
                </div>
            ) : editingOffer ? (
                renderOfferForm()
            ) : (
                <div className="space-y-3 sm:space-y-4">
                    {offers.length === 0 ? (
                        <div className="text-center py-12 bg-neutral-900/50 border border-neutral-700/50 rounded-lg">
                            <Package className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-400">No offers found. Create your first offer to get started.</p>
                        </div>
                    ) : (
                        offers.map((offer) => (
                            <div
                                key={offer.slug}
                                className="bg-neutral-900/50 border border-neutral-700/50 rounded-lg overflow-hidden"
                            >
                                <div
                                    className="p-3 sm:p-4 cursor-pointer hover:bg-neutral-800/50 transition-colors"
                                    onClick={() => toggleOfferExpand(offer.slug)}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex items-start sm:items-center gap-3">
                                            <div className="bg-purple-600/20 p-2 rounded-lg flex-shrink-0">
                                                <Package className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-base sm:text-lg font-semibold text-white truncate">{offer.name}</h3>
                                                <p className="text-xs sm:text-sm text-gray-400 truncate">{offer.short_description}</p>
                                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                                                    <span className="text-xs px-2 py-1 bg-purple-600/20 text-purple-300 rounded">
                                                        {offer.type}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {offer.price} {offer.currency}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditOffer(offer);
                                                }}
                                                className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteOffer(offer.slug);
                                                }}
                                                className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            {expandedOfferSlug === offer.slug ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {expandedOfferSlug === offer.slug && (
                                    <div className="border-t border-neutral-700/50 p-3 sm:p-4 bg-neutral-800/30">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Slug</p>
                                                <p className="text-sm text-gray-300">{offer.slug}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Base Price</p>
                                                <p className="text-sm text-gray-300">{offer.price} {offer.currency}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">EUR Price</p>
                                                <p className="text-sm text-gray-300">{offer.price_eur} EUR</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">File Path</p>
                                                <p className="text-sm text-gray-300 truncate">{offer.file_path || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Icon</p>
                                                <p className="text-sm text-gray-300">{offer.metadata?.icon_name || 'default'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Region Prices</p>
                                                <p className="text-sm text-gray-300">{Object.keys(offer.region_prices || {}).length} regions</p>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <p className="text-xs text-gray-500 mb-1">Description</p>
                                            <p className="text-sm text-gray-300">{offer.description}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
} 