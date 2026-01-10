
import React from 'react';
import { Hash, Users } from 'lucide-react';

/**
 * TopicsParticipants - Secondary section showing topics and mentioned people
 */
const TopicsParticipants = ({ topics = [], participants = [], isLoading = false }) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border-4 border-black p-4 shadow-neo-sm animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-3 border-2 border-black"></div>
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-8 w-24 bg-gray-200 rounded-full border-2 border-black"></div>
                        ))}
                    </div>
                </div>
                <div className="bg-white border-4 border-black p-4 shadow-neo-sm animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-3 border-2 border-black"></div>
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-8 w-28 bg-gray-200 rounded-full border-2 border-black"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Topics */}
            <div className="bg-white border-4 border-black p-4 shadow-neo-sm">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-600 mb-3">
                    <Hash size={16} />
                    Topics Discussed
                </h3>
                <div className="flex flex-wrap gap-2">
                    {topics.length === 0 ? (
                        <span className="text-gray-500 font-medium">No topics identified</span>
                    ) : (
                        topics.map((topic, index) => (
                            <span
                                key={index}
                                className="
                                    px-3 py-1.5 text-sm font-bold
                                    bg-neo-teal border-2 border-black rounded-full
                                    cursor-default select-none
                                    hover:bg-blue-200 transition-colors
                                "
                            >
                                {topic}
                            </span>
                        ))
                    )}
                </div>
            </div>

            {/* Participants */}
            <div className="bg-white border-4 border-black p-4 shadow-neo-sm">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-600 mb-3">
                    <Users size={16} />
                    Participants
                </h3>
                <div className="flex flex-wrap gap-2">
                    {participants.length === 0 ? (
                        <span className="text-gray-500 font-medium">No participants identified</span>
                    ) : (
                        participants.map((person, index) => (
                            <span
                                key={index}
                                className="
                                    px-3 py-1.5 text-sm font-bold
                                    bg-neo-dark border-2 border-black rounded-full
                                    cursor-default select-none
                                    hover:bg-purple-200 transition-colors
                                "
                            >
                                {person}
                            </span>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TopicsParticipants;
