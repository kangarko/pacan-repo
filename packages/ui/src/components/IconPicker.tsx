import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { availableIcons, getIconByName } from '@repo/ui/lib/iconMapping';

interface IconPickerProps {
    selectedIcon: string;
    onChange: (iconName: string) => void;
}

// Format icon name from camelCase to Title Case with spaces
const formatIconName = (name: string): string => {
    if (!name)
        throw new Error('Icon name cannot be null or empty');
    
    // Add space before each capital letter and uppercase the first letter
    return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
};

const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right' | 'center'>('left');
    const pickerRef = useRef<HTMLDivElement>(null);
    const itemsPerPage = 48; // 8 columns × 6 rows

    // Validate that selectedIcon is provided
    if (!selectedIcon)
        throw new Error('IconPicker requires a selectedIcon prop');

    // Handle clicking outside to close the picker
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(0);
    }, [searchTerm]);

    // Filter icons based on search term
    const filteredIcons = searchTerm
        ? availableIcons.filter(name => {
            const searchTermLower = searchTerm.toLowerCase();
            return (
                name.toLowerCase().includes(searchTermLower) ||
                formatIconName(name).toLowerCase().includes(searchTermLower)
            );
        })
        : availableIcons;

    // Paginate icons
    const totalPages = Math.ceil(filteredIcons.length / itemsPerPage);
    const paginatedIcons = filteredIcons.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
    );

    // Calculate dropdown position when opening
    useEffect(() => {
        if (isOpen && pickerRef.current) {
            const rect = pickerRef.current.getBoundingClientRect();
            const dropdownWidth = 600;
            const windowWidth = window.innerWidth;
            
            // Check if dropdown would overflow on the right
            if (rect.left + dropdownWidth > windowWidth - 20) {
                // Check if it would fit on the left
                if (rect.right - dropdownWidth > 20) {
                    setDropdownPosition('right');
                } else {
                    // Center it if neither left nor right works well
                    setDropdownPosition('center');
                }
            } else {
                setDropdownPosition('left');
            }
        }
    }, [isOpen]);

    return (
        <div className="relative" ref={pickerRef}>
            <div
                className="flex items-center p-3 bg-neutral-800/80 border border-purple-600/30 rounded-lg text-white cursor-pointer hover:bg-neutral-700/80 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="w-8 h-8 flex items-center justify-center mr-3 bg-purple-900/30 rounded-lg">
                    {getIconByName(selectedIcon, { size: 20 })}
                </div>
                <span className="flex-1">{formatIconName(selectedIcon)}</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-400"
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>

            {isOpen && (
                <div 
                    className={`absolute z-50 mt-2 w-[600px] bg-gray-900 border border-purple-600/40 rounded-lg shadow-xl
                        ${dropdownPosition === 'left' ? 'left-0' : ''}
                        ${dropdownPosition === 'right' ? 'right-0' : ''}
                        ${dropdownPosition === 'center' ? 'left-1/2 -translate-x-1/2' : ''}
                        lg:w-[600px] md:w-[480px] sm:w-[360px] w-full
                    `} 
                    style={{ minWidth: '360px' }}
                >
                    <div className="p-3 border-b border-gray-700/50">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search icons..."
                                className="w-full px-3 py-2 pl-9 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                        </div>
                    </div>

                    <div className="overflow-y-auto p-3" style={{ maxHeight: '360px' }}>
                        {paginatedIcons.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">No icons found</div>
                        ) : (
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                {paginatedIcons.map((name) => (
                                    <div
                                        key={name}
                                        onClick={() => {
                                            onChange(name);
                                            setIsOpen(false);
                                        }}
                                        className={`p-3 flex flex-col items-center justify-center rounded-lg cursor-pointer hover:bg-purple-800/30 transition-colors gap-1
                      ${selectedIcon === name ? 'bg-purple-700/30 border border-purple-500/50' : 'border border-transparent'}
                    `}
                                        title={formatIconName(name)}
                                    >
                                        <div className="w-8 h-8 flex items-center justify-center">
                                            {getIconByName(name, { size: 24 })}
                                        </div>
                                        <span className="text-[10px] text-center text-gray-400 truncate w-full">
                                            {name.length > 10 ? `${name.substring(0, 8)}...` : name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="p-2 border-t border-gray-700/50 flex justify-between items-center">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                disabled={currentPage === 0}
                                className={`p-1 rounded text-xs ${currentPage === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-purple-400 hover:text-purple-300'}`}
                            >
                                Previous
                            </button>

                            <span className="text-xs text-gray-500">
                                Page {currentPage + 1} of {totalPages}
                            </span>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                disabled={currentPage === totalPages - 1}
                                className={`p-1 rounded text-xs ${currentPage === totalPages - 1 ? 'text-gray-600 cursor-not-allowed' : 'text-purple-400 hover:text-purple-300'}`}
                            >
                                Next
                            </button>
                        </div>
                    )}

                    <div className="p-2 border-t border-gray-700/50 text-xs text-gray-500 text-center">
                        {filteredIcons.length} icons available
                    </div>
                </div>
            )}
        </div>
    );
};

export default IconPicker; 