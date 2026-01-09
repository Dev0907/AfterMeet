
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NeoCard from '../components/ui/NeoCard';
import NeoButton from '../components/ui/NeoButton';
import { NeoSkeletonCard } from '../components/ui/NeoSkeleton';
import {
    getMeetings,
    analyzeMeeting,
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
} from 'lucide-react';

/**
 * MeetingsList - List of all meetings with upload functionality
 */
const MeetingsList = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [meetings, setMeetings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // Fetch meetings on mount
    useEffect(() => {
        const fetchMeetings = async () => {
            setIsLoading(true);
            try {
                const data = await getMeetings();
                setMeetings(data);
            } catch (err) {
                console.log('Using demo meeting:', err.message);
                // Add demo meeting for testing
                await simulateApiDelay(null, 500);
                setMeetings([
                    {
                        id: 'demo',
                        ...MOCK_MEETING_SUMMARY,
                        status: 'completed',
                    }
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMeetings();
    }, []);

    const handleFileUpload = async (file) => {
        if (!file) return;

        // Validate file type
        const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'video/mp4', 'audio/m4a'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|mp4|m4a)$/i)) {
            setUploadStatus({ type: 'error', message: 'Please upload an audio or video file (MP3, WAV, MP4, M4A)' });
            return;
        }

        setIsUploading(true);
        setUploadStatus({ type: 'processing', message: 'Uploading and analyzing...' });

        try {
            const result = await analyzeMeeting(file);
            setUploadStatus({ type: 'success', message: 'Meeting uploaded successfully!' });

            // Add new meeting to list
            setMeetings(prev => [
                {
                    id: result.meetingId,
                    title: file.name.replace(/\.[^/.]+$/, ''),
                    date: new Date().toISOString(),
                    status: 'processing',
                },
                ...prev
            ]);

            // Clear status after 3 seconds
            setTimeout(() => setUploadStatus(null), 3000);
        } catch (err) {
            console.log('Demo mode: simulating upload');
            // Demo mode: simulate upload
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
            setUploadStatus({ type: 'success', message: 'Meeting uploaded! (Demo Mode)' });
            setTimeout(() => setUploadStatus(null), 3000);
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
            <header className="bg-neo-yellow border-b-4 border-black">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tight">
                                Your Meetings
                            </h1>
                            <p className="font-medium text-gray-700 mt-1">
                                Upload recordings and get AI-powered insights
                            </p>
                        </div>
                        <NeoButton
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-neo-teal"
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
                            Upload your first meeting recording to get started
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
                                onClick={() => navigate(`/meetings/${meeting.id}`)}
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
            <footer className="mt-12 border-t-4 border-black bg-neo-yellow py-6">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <p className="font-bold text-sm">
                        AfterMeet • Meeting Intelligence Platform
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default MeetingsList;
