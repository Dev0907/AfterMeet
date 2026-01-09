
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import NeoCard from '../components/ui/NeoCard';
import NeoButton from '../components/ui/NeoButton';
import { NeoSkeletonCard } from '../components/ui/NeoSkeleton';
import {
    MOCK_MEETING_SUMMARY,
    simulateApiDelay,
} from '../services/meetingApi';
import {
    Upload,
    FileAudio,
    Calendar,
    Clock,
    ChevronRight,
    Plus,
    Loader2,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    Users,
} from 'lucide-react';

// Mock team names for demo
const MOCK_TEAM_NAMES = {
    'team-1': 'Product Team',
    'team-2': 'Engineering',
    'team-3': 'Design Sprint',
};

// Mock meetings per team
const MOCK_TEAM_MEETINGS = {
    'team-1': [
        { id: 'demo', ...MOCK_MEETING_SUMMARY, status: 'completed' },
        { id: 'meeting-2', title: 'Sprint Retrospective', date: '2026-01-08T15:00:00Z', duration: '30 min', status: 'completed', sentiment: 'positive' },
    ],
    'team-2': [
        { id: 'meeting-3', title: 'Architecture Review', date: '2026-01-09T11:00:00Z', duration: '60 min', status: 'completed', sentiment: 'neutral' },
        { id: 'meeting-4', title: 'Code Review Session', date: '2026-01-07T14:00:00Z', duration: '45 min', status: 'completed', sentiment: 'positive' },
        { id: 'meeting-5', title: 'Incident Postmortem', date: '2026-01-06T10:00:00Z', duration: '40 min', status: 'completed', sentiment: 'negative' },
    ],
    'team-3': [
        { id: 'meeting-6', title: 'Design Kickoff', date: '2026-01-07T09:00:00Z', duration: '90 min', status: 'completed', sentiment: 'positive' },
    ],
};

/**
 * TeamMeetings - List of meetings for a specific team
 */
const TeamMeetings = () => {
    const navigate = useNavigate();
    const { teamId } = useParams();
    const fileInputRef = useRef(null);

    const [meetings, setMeetings] = useState([]);
    const [teamName, setTeamName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // Fetch meetings for this team
    useEffect(() => {
        const fetchMeetings = async () => {
            setIsLoading(true);
            try {
                // TODO: Replace with actual API call
                // const response = await fetch(`/api/teams/${teamId}/meetings`);
                // const data = await response.json();

                await simulateApiDelay(null, 500);
                setTeamName(MOCK_TEAM_NAMES[teamId] || 'Team');
                setMeetings(MOCK_TEAM_MEETINGS[teamId] || []);
            } catch (err) {
                console.error('Error fetching meetings:', err);
                setMeetings([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMeetings();
    }, [teamId]);

    const handleFileUpload = async (file) => {
        if (!file) return;

        const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'video/mp4', 'audio/m4a'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|mp4|m4a)$/i)) {
            setUploadStatus({ type: 'error', message: 'Please upload an audio or video file (MP3, WAV, MP4, M4A)' });
            return;
        }

        setIsUploading(true);
        setUploadStatus({ type: 'processing', message: 'Uploading and analyzing...' });

        try {
            await simulateApiDelay(null, 2000);

            const demoMeeting = {
                id: `meeting-${Date.now()}`,
                title: file.name.replace(/\.[^/.]+$/, ''),
                date: new Date().toISOString(),
                duration: '30 min',
                status: 'completed',
                sentiment: 'positive',
            };

            setMeetings(prev => [demoMeeting, ...prev]);
            setUploadStatus({ type: 'success', message: 'Meeting uploaded!' });
            setTimeout(() => setUploadStatus(null), 3000);
        } catch (err) {
            setUploadStatus({ type: 'error', message: 'Upload failed. Please try again.' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getStatusBadge = (status) => {
        const styles = {
            processing: 'bg-neo-yellow border-yellow-500',
            completed: 'bg-green-200 border-green-500',
            failed: 'bg-neo-red border-red-500',
        };

        const icons = {
            processing: <Loader2 size={12} className="animate-spin" />,
            completed: <CheckCircle size={12} />,
            failed: <AlertCircle size={12} />,
        };

        return (
            <span className={`
                inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold uppercase
                border-2 border-black rounded-full
                ${styles[status] || styles.completed}
            `}>
                {icons[status]}
                {status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-neo-white">
            {/* Header */}
            <header className="bg-neo-teal border-b-4 border-black">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link
                                to="/teams"
                                className="p-2 border-2 border-black bg-white hover:bg-neo-white transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <div className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
                                    <Users size={14} />
                                    <span>{teamName}</span>
                                </div>
                                <h1 className="text-3xl font-black uppercase tracking-tight">
                                    Team Meetings
                                </h1>
                            </div>
                        </div>
                        <NeoButton
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-neo-yellow"
                            disabled={isUploading}
                        >
                            <Plus size={18} className="mr-2" />
                            New Meeting
                        </NeoButton>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Upload Zone */}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`
                        mb-8 p-8 border-4 border-dashed border-black
                        text-center transition-all cursor-pointer
                        ${isDragging ? 'bg-neo-teal scale-[1.02]' : 'bg-white hover:bg-neo-white'}
                        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".mp3,.wav,.mp4,.m4a,audio/*,video/*"
                        onChange={(e) => handleFileUpload(e.target.files[0])}
                        className="hidden"
                    />

                    {isUploading ? (
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 size={48} className="animate-spin text-neo-dark" />
                            <p className="font-bold text-lg">Uploading and analyzing...</p>
                        </div>
                    ) : (
                        <>
                            <Upload size={48} className="mx-auto mb-3 text-gray-600" />
                            <p className="font-bold text-lg mb-1">
                                Drop your meeting recording here
                            </p>
                            <p className="text-sm text-gray-500 font-medium">
                                or click to browse • Supports MP3, WAV, MP4, M4A
                            </p>
                        </>
                    )}
                </div>

                {/* Upload Status Message */}
                {uploadStatus && (
                    <div className={`
                        mb-6 p-4 border-4 border-black font-bold flex items-center gap-2
                        ${uploadStatus.type === 'success' ? 'bg-green-200' : ''}
                        ${uploadStatus.type === 'error' ? 'bg-neo-red' : ''}
                        ${uploadStatus.type === 'processing' ? 'bg-neo-yellow' : ''}
                    `}>
                        {uploadStatus.type === 'success' && <CheckCircle size={20} />}
                        {uploadStatus.type === 'error' && <AlertCircle size={20} />}
                        {uploadStatus.type === 'processing' && <Loader2 size={20} className="animate-spin" />}
                        {uploadStatus.message}
                    </div>
                )}

                {/* Meetings Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <NeoSkeletonCard />
                        <NeoSkeletonCard />
                        <NeoSkeletonCard />
                    </div>
                ) : meetings.length === 0 ? (
                    <NeoCard className="text-center py-12">
                        <FileAudio size={64} className="mx-auto mb-4 text-gray-400" />
                        <h2 className="text-2xl font-black uppercase mb-2">No Meetings Yet</h2>
                        <p className="font-medium text-gray-600 mb-6">
                            Upload your first meeting recording for this team
                        </p>
                        <NeoButton
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-neo-teal"
                        >
                            <Upload size={18} className="mr-2" />
                            Upload Recording
                        </NeoButton>
                    </NeoCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {meetings.map((meeting) => (
                            <button
                                key={meeting.id}
                                onClick={() => navigate(`/teams/${teamId}/meetings/${meeting.id}`)}
                                className="
                                    text-left bg-white border-4 border-black shadow-neo p-5
                                    hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-hover
                                    active:translate-x-2 active:translate-y-2 active:shadow-none
                                    transition-all group
                                "
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <FileAudio size={24} className="text-neo-dark" />
                                    {getStatusBadge(meeting.status || 'completed')}
                                </div>

                                <h3 className="font-black text-lg mb-2 line-clamp-2">
                                    {meeting.title}
                                </h3>

                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 font-medium">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        {formatDate(meeting.date)}
                                    </span>
                                    {meeting.duration && (
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {meeting.duration}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-end text-sm font-bold text-gray-500 group-hover:text-black transition-colors">
                                    View Details
                                    <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="mt-12 border-t-4 border-black bg-neo-teal py-6">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <p className="font-bold text-sm">
                        AfterMeet • Meeting Intelligence Platform
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default TeamMeetings;
