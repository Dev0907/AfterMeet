
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import NeoCard from '../components/ui/NeoCard';
import NeoButton from '../components/ui/NeoButton';
import ExecutiveSummary from '../components/meeting/ExecutiveSummary';
import ActionItems from '../components/meeting/ActionItems';
import TopicsParticipants from '../components/meeting/TopicsParticipants';
import TranscriptViewer from '../components/meeting/TranscriptViewer';
import MeetingChat from '../components/meeting/MeetingChat';
import SemanticSearch from '../components/meeting/SemanticSearch';
import {
    MOCK_MEETING_SUMMARY,
    MOCK_TRANSCRIPT,
    getMeetingSummary,
    getMeetingTranscript,
    chatWithMeeting,
    searchMeeting,
    simulateApiDelay,
} from '../services/meetingApi';
import { ArrowLeft, RefreshCw, Download, Share2, BarChart3 } from 'lucide-react';

/**
 * MeetingDetail - Main meeting intelligence dashboard page
 */
const MeetingDetail = () => {
    const { teamId, meetingId } = useParams();
    const navigate = useNavigate();

    const [meetingData, setMeetingData] = useState(null);
    const [transcript, setTranscript] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [highlightedTranscriptId, setHighlightedTranscriptId] = useState(null);
    const [showSearch, setShowSearch] = useState(false);

    // Fetch meeting data
    useEffect(() => {
        const fetchMeetingData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Try real API first, fallback to mock data
                if (meetingId && meetingId !== 'demo') {
                    const [summaryData, transcriptData] = await Promise.all([
                        getMeetingSummary(meetingId),
                        getMeetingTranscript(meetingId),
                    ]);
                    setMeetingData(summaryData);
                    setTranscript(transcriptData);
                } else {
                    // Use mock data for demo
                    await simulateApiDelay(null, 800);
                    setMeetingData(MOCK_MEETING_SUMMARY);
                    setTranscript(MOCK_TRANSCRIPT);
                }
            } catch (err) {
                console.log('Using mock data for demo:', err.message);
                // Fallback to mock data on error
                await simulateApiDelay(null, 500);
                setMeetingData(MOCK_MEETING_SUMMARY);
                setTranscript(MOCK_TRANSCRIPT);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMeetingData();
    }, [meetingId]);

    const handleTimestampClick = (entry) => {
        setHighlightedTranscriptId(entry.id);
        // Clear highlight after 3 seconds
        setTimeout(() => setHighlightedTranscriptId(null), 3000);
    };

    const handleSearchResultClick = (result) => {
        setHighlightedTranscriptId(result.id);
        setShowSearch(false);
        setTimeout(() => setHighlightedTranscriptId(null), 3000);
    };

    const handleChatMessage = async (message) => {
        try {
            if (meetingId && meetingId !== 'demo') {
                return await chatWithMeeting(meetingId, message);
            }
            // Demo response handled in MeetingChat component
            return null;
        } catch (err) {
            console.error('Chat error:', err);
            throw err;
        }
    };

    const handleSearch = async (query) => {
        try {
            if (meetingId && meetingId !== 'demo') {
                return await searchMeeting(meetingId, query);
            }
            return null; // Let component use local search
        } catch (err) {
            console.error('Search error:', err);
            return null;
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-neo-yellow flex items-center justify-center p-4">
                <NeoCard className="max-w-md text-center">
                    <h2 className="text-2xl font-black uppercase mb-4">Error Loading Meeting</h2>
                    <p className="font-medium mb-6">{error}</p>
                    <NeoButton onClick={() => navigate(teamId ? `/teams/${teamId}/meetings` : '/teams')}>
                        Back to Meetings
                    </NeoButton>
                </NeoCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neo-white">
            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-50 bg-neo-yellow border-b-4 border-black">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                to={teamId ? `/teams/${teamId}/meetings` : '/teams'}
                                className="p-2 border-2 border-black bg-white hover:bg-neo-white transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </Link>
                            <h1 className="text-xl font-black uppercase tracking-tight">
                                {isLoading ? 'Loading...' : meetingData?.title || 'Meeting Details'}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                to={`/teams/${teamId}/meetings/${meetingId}/analytics`}
                                className="flex items-center gap-1 px-3 py-2 border-2 border-black bg-neo-dark font-bold text-sm hover:shadow-neo-sm transition-all"
                            >
                                <BarChart3 size={16} />
                                Analytics
                            </Link>
                            <button
                                onClick={() => setShowSearch(!showSearch)}
                                className={`
                                    p-2 border-2 border-black transition-all
                                    ${showSearch ? 'bg-black text-white' : 'bg-white hover:bg-neo-teal'}
                                `}
                            >
                                Search
                            </button>
                            <button className="p-2 border-2 border-black bg-white hover:bg-neo-teal transition-colors">
                                <Download size={18} />
                            </button>
                            <button className="p-2 border-2 border-black bg-white hover:bg-neo-teal transition-colors">
                                <Share2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Search Panel (Toggleable) */}
                {showSearch && (
                    <div className="mb-6">
                        <SemanticSearch
                            meetingId={meetingId}
                            onSearch={handleSearch}
                            onResultClick={handleSearchResultClick}
                            transcript={transcript}
                        />
                    </div>
                )}

                {/* Executive Summary */}
                <div className="mb-6">
                    <ExecutiveSummary
                        title={meetingData?.title}
                        date={meetingData?.date}
                        duration={meetingData?.duration}
                        summary={meetingData?.executiveSummary}
                        sentiment={meetingData?.sentiment}
                        isLoading={isLoading}
                    />
                </div>

                {/* Two Column Layout for Desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Action Items (Primary) */}
                        <ActionItems
                            items={meetingData?.actionItems || []}
                            isLoading={isLoading}
                        />

                        {/* Topics & Participants */}
                        <TopicsParticipants
                            topics={meetingData?.topics || []}
                            participants={meetingData?.participants || []}
                            isLoading={isLoading}
                        />

                        {/* Transcript Viewer */}
                        <TranscriptViewer
                            transcript={transcript}
                            isLoading={isLoading}
                            highlightedId={highlightedTranscriptId}
                            onTimestampClick={handleTimestampClick}
                        />
                    </div>

                    {/* Right Column - Chat Panel */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <MeetingChat
                                meetingId={meetingId}
                                onSendMessage={handleChatMessage}
                                isLoading={isLoading}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-12 border-t-4 border-black bg-neo-yellow py-6">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="font-bold text-sm">
                        Meeting Intelligence Dashboard • AfterMeet
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default MeetingDetail;
