'use client';

const TopAnnouncementBar = () => {
    return (
        <div className="group relative bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 text-white shadow-lg">
            <div className="container mx-auto px-4 py-3 text-center">
                <p className="flex items-center justify-center text-sm font-medium">
                    <span className="mr-3 flex h-5 w-5 flex-shrink-0 items-center">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    </span>
                    <span className="inline">Today is July 9. You could have your AI business up and running and have your first paying customer by July 29.</span>
                </p>
            </div>
        </div>
    );
};

export default TopAnnouncementBar; 