
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import NeoCard from '../components/ui/NeoCard';
import NeoButton from '../components/ui/NeoButton';
import { NeoSkeletonCard } from '../components/ui/NeoSkeleton';
import {
    Upload,
    FileAudio,
    FileText,
    Calendar,
    Clock,
    ChevronRight,
    Plus,
    Loader2,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    Users,
    X,
    Link2,
    Copy,
    Video,
    Settings,
    Trash2,
    Edit3,
    UserMinus,
} from 'lucide-react';
import NeoInput from '../components/ui/NeoInput';

const API_BASE = 'http://localhost:3000';

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
    const [userRole, setUserRole] = useState('member');
    const [inviteCode, setInviteCode] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [copiedInvite, setCopiedInvite] = useState(false);

    // Transcript upload modal
    const [showTranscriptModal, setShowTranscriptModal] = useState(false);
    const [transcriptText, setTranscriptText] = useState('');
    const [meetingTitle, setMeetingTitle] = useState('');

    // Schedule meeting modal
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleData, setScheduleData] = useState({
        title: '',
        date: '',
        time: '',
        duration: '30',
        platform: 'Zoom'
    });

    // Team settings modal
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [editTeamName, setEditTeamName] = useState('');
    const [teamMembers, setTeamMembers] = useState([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);

    // Fetch meetings for this team
    useEffect(() => {
        const userId = localStorage.getItem('userId');

        const fetchMeetings = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE}/api/teams/${teamId}/meetings`);
                if (response.ok) {
                    const data = await response.json();
                    setMeetings(data);
                } else {
                    setMeetings([]);
                }
            } catch (err) {
                console.error('Error fetching meetings:', err);
                setMeetings([]);
            } finally {
                setIsLoading(false);
            }
        };

        // Fetch team name and role
        const fetchTeamData = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/teams?userId=${userId}`);
                if (response.ok) {
                    const teams = await response.json();
                    const team = teams.find(t => t.id === teamId);
                    setTeamName(team?.name || 'Team');
                    setUserRole(team?.role || 'member');

                    // Fetch real invite code from API if host
                    if (team?.role === 'owner') {
                        try {
                            const inviteResponse = await fetch(`${API_BASE}/api/teams/${teamId}/invite?userId=${userId}`);
                            if (inviteResponse.ok) {
                                const inviteData = await inviteResponse.json();
                                setInviteCode(inviteData.inviteCode);
                            }
                        } catch (inviteErr) {
                            console.error('Error fetching invite code:', inviteErr);
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching team:', err);
            }
        };

        fetchMeetings();
        fetchTeamData();
    }, [teamId]);

    // Schedule a new meeting (Host only)
    const handleScheduleMeeting = async (e) => {
        e.preventDefault();

        const userId = localStorage.getItem('userId');
        const scheduledStart = new Date(`${scheduleData.date}T${scheduleData.time}`);

        try {
            const response = await fetch(`${API_BASE}/api/teams/${teamId}/meetings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: scheduleData.title,
                    userId,
                    platform: scheduleData.platform,
                    scheduledStart: scheduledStart.toISOString(),
                    duration: parseInt(scheduleData.duration)
                })
            });

            if (response.ok) {
                const newMeeting = await response.json();
                setMeetings(prev => [newMeeting, ...prev]);
                setShowScheduleModal(false);
                setScheduleData({ title: '', date: '', time: '', duration: '30', platform: 'Zoom' });
                setUploadStatus({ type: 'success', message: 'Meeting scheduled!' });
                setTimeout(() => setUploadStatus(null), 3000);
            }
        } catch (err) {
            console.error('Error scheduling meeting:', err);
        }
    };

    const copyInviteLink = () => {
        const link = `${window.location.origin}/join/${inviteCode}`;
        navigator.clipboard.writeText(link);
        setCopiedInvite(true);
        setTimeout(() => setCopiedInvite(false), 2000);
    };

    const openSettings = async () => {
        setEditTeamName(teamName);
        setShowSettingsModal(true);
        await fetchMembers();
    };

    const fetchMembers = async () => {
        setIsLoadingMembers(true);
        try {
            const response = await fetch(`${API_BASE}/api/teams/${teamId}/members`);
            if (response.ok) {
                const data = await response.json();
                setTeamMembers(data);
            }
        } catch (err) {
            console.error('Error fetching members:', err);
        } finally {
            setIsLoadingMembers(false);
        }
    };

    const updateTeamName = async () => {
        const userId = localStorage.getItem('userId');
        try {
            const response = await fetch(`${API_BASE}/api/teams/${teamId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editTeamName, userId })
            });

            if (response.ok) {
                setTeamName(editTeamName);
                setUploadStatus({ type: 'success', message: 'Team name updated!' });
                setTimeout(() => setUploadStatus(null), 3000);
            }
        } catch (err) {
            console.error('Error updating team:', err);
        }
    };

    const deleteTeam = async () => {
        if (!window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
            return;
        }

        const userId = localStorage.getItem('userId');
        try {
            const response = await fetch(`${API_BASE}/api/teams/${teamId}?userId=${userId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                navigate('/teams');
            } else {
                const data = await response.json();
                setUploadStatus({ type: 'error', message: data.error });
            }
        } catch (err) {
            console.error('Error deleting team:', err);
        }
    };

    const removeMember = async (memberId, memberName) => {
        if (!window.confirm(`Remove ${memberName} from this team?`)) {
            return;
        }

        const userId = localStorage.getItem('userId');
        try {
            const response = await fetch(`${API_BASE}/api/teams/${teamId}/members/${memberId}?userId=${userId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setTeamMembers(prev => prev.filter(m => m.id !== memberId));
                setUploadStatus({ type: 'success', message: `${memberName} removed from team` });
                setTimeout(() => setUploadStatus(null), 3000);
            } else {
                const data = await response.json();
                setUploadStatus({ type: 'error', message: data.error });
            }
        } catch (err) {
            console.error('Error removing member:', err);
        }
    };

    // Parse VTT format (WebVTT captions)
    const parseVTT = (vttString) => {
        const lines = vttString.split(/\r?\n/);
        const results = [];
        let current = null;
        const timestampRegex = /(\d{2}:\d{2}:\d{2}\.\d{3})\s-->\s(\d{2}:\d{2}:\d{2}\.\d{3})/;

        for (let line of lines) {
            line = line.trim();

            // skip headers and garbage
            if (!line || line.startsWith('WEBVTT') || line.startsWith('NOTE') ||
                line.startsWith('STYLE') || /^[0-9]+$/.test(line)) {
                continue;
            }

            // timestamps line
            const ts = timestampRegex.exec(line);
            if (ts) {
                if (current) results.push(current);
                current = {
                    start: ts[1],
                    end: ts[2],
                    speaker: null,
                    text: ''
                };
                continue;
            }

            // speaker name format: SPEAKER: text...
            if (current && line.includes(':')) {
                const parts = line.split(':');
                current.speaker = parts[0].trim();
                current.text += parts.slice(1).join(':').trim();
                continue;
            }

            // otherwise normal dialogue text
            if (current) {
                current.text += (current.text ? ' ' : '') + line;
            }
        }

        if (current) results.push(current);

        // Convert to transcript format for backend
        return results.map(r => `${r.speaker || 'Speaker'}: ${r.text}`).join('\n');
    };

    const handleFileUpload = async (file) => {
        if (!file) return;

        // Check if it's a text/transcript file
        const isTextFile = file.type === 'text/plain' || file.name.match(/\.(txt|vtt|srt)$/i);

        if (isTextFile) {
            // Read text file and parse
            const reader = new FileReader();
            reader.onload = (e) => {
                let content = e.target.result;

                // Parse VTT files specially
                if (file.name.match(/\.vtt$/i)) {
                    content = parseVTT(content);
                }

                setTranscriptText(content);
                setMeetingTitle(file.name.replace(/\.[^/.]+$/, ''));
                setShowTranscriptModal(true);
            };
            reader.readAsText(file);
            return;
        }

        const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'video/mp4', 'audio/m4a'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|mp4|m4a)$/i)) {
            setUploadStatus({ type: 'error', message: 'Please upload an audio, video, or text transcript file' });
            return;
        }

        setIsUploading(true);
        setUploadStatus({ type: 'processing', message: 'Uploading...' });

        try {
            // For audio/video, create meeting without transcript for now
            const userId = localStorage.getItem('userId');
            const response = await fetch(`${API_BASE}/api/teams/${teamId}/meetings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: file.name.replace(/\.[^/.]+$/, ''),
                    userId,
                    platform: 'Audio Upload'
                })
            });

            if (response.ok) {
                const newMeeting = await response.json();
                setMeetings(prev => [newMeeting, ...prev]);
                setUploadStatus({ type: 'success', message: 'Meeting created! Add transcript to analyze.' });
                setTimeout(() => setUploadStatus(null), 3000);
            } else {
                throw new Error('Failed to create meeting');
            }
        } catch (err) {
            setUploadStatus({ type: 'error', message: 'Upload failed. Please try again.' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleTranscriptUpload = async () => {
        if (!transcriptText.trim()) return;

        setIsUploading(true);
        setUploadStatus({ type: 'processing', message: 'Creating meeting with transcript...' });
        setShowTranscriptModal(false);

        try {
            const userId = localStorage.getItem('userId');
            const response = await fetch(`${API_BASE}/api/teams/${teamId}/meetings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: meetingTitle || 'Uploaded Transcript',
                    userId,
                    transcript: transcriptText,
                    platform: 'Transcript Upload'
                })
            });

            if (response.ok) {
                const newMeeting = await response.json();
                setMeetings(prev => [newMeeting, ...prev]);
                setUploadStatus({ type: 'success', message: 'Meeting created with transcript!' });
                setTimeout(() => setUploadStatus(null), 3000);
                setTranscriptText('');
                setMeetingTitle('');
            } else {
                throw new Error('Failed to create meeting');
            }
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
            pending: 'bg-gray-200 border-gray-500',
            transcribed: 'bg-neo-yellow border-yellow-500',
            analyzed: 'bg-green-200 border-green-500',
            failed: 'bg-neo-red border-red-500',
        };

        const icons = {
            pending: <Clock size={12} />,
            transcribed: <FileText size={12} />,
            analyzed: <CheckCircle size={12} />,
            failed: <AlertCircle size={12} />,
        };

        return (
            <span className={`
                inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold uppercase
                border-2 border-black rounded-full
                ${styles[status] || styles.pending}
            `}>
                {icons[status] || icons.pending}
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
                                    {userRole === 'owner' && (
                                        <span className="text-xs bg-neo-yellow px-2 py-0.5 border-2 border-black ml-2">HOST</span>
                                    )}
                                </div>
                                <h1 className="text-3xl font-black uppercase tracking-tight">
                                    Team Meetings
                                </h1>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {userRole === 'owner' && (
                                <>
                                    <NeoButton
                                        onClick={() => setShowInviteModal(true)}
                                        className="bg-white"
                                    >
                                        <Link2 size={18} className="mr-2" />
                                        Invite
                                    </NeoButton>
                                    <NeoButton
                                        onClick={() => setShowScheduleModal(true)}
                                        className="bg-neo-yellow"
                                    >
                                        <Video size={18} className="mr-2" />
                                        Schedule
                                    </NeoButton>
                                    <NeoButton
                                        onClick={openSettings}
                                        className="bg-white"
                                    >
                                        <Settings size={18} className="mr-2" />
                                        Settings
                                    </NeoButton>
                                </>
                            )}
                        </div>
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
                        accept=".mp3,.wav,.mp4,.m4a,.txt,.vtt,.srt,audio/*,video/*,text/plain"
                        onChange={(e) => handleFileUpload(e.target.files[0])}
                        className="hidden"
                    />

                    {isUploading ? (
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 size={48} className="animate-spin text-neo-dark" />
                            <p className="font-bold text-lg">Processing...</p>
                        </div>
                    ) : (
                        <>
                            <Upload size={48} className="mx-auto mb-3 text-gray-600" />
                            <p className="font-bold text-lg mb-1">
                                Drop your meeting file here
                            </p>
                            <p className="text-sm text-gray-500 font-medium">
                                or click to browse • Supports audio, video, and <strong>text transcripts</strong> (TXT, VTT, SRT)
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
                            Upload a recording or paste a transcript to get started
                        </p>
                        <div className="flex justify-center gap-3">
                            <NeoButton
                                onClick={() => setShowTranscriptModal(true)}
                                className="bg-neo-yellow"
                            >
                                <FileText size={18} className="mr-2" />
                                Paste Transcript
                            </NeoButton>
                            <NeoButton
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-neo-teal"
                            >
                                <Upload size={18} className="mr-2" />
                                Upload File
                            </NeoButton>
                        </div>
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
                                    <div className="p-2 bg-neo-dark border-2 border-black">
                                        {meeting.hasTranscript ? <FileText size={20} /> : <FileAudio size={20} />}
                                    </div>
                                    {getStatusBadge(meeting.status || 'pending')}
                                </div>

                                <h3 className="font-black text-lg mb-2 line-clamp-2">
                                    {meeting.title}
                                </h3>

                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 font-medium">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        {formatDate(meeting.createdAt)}
                                    </span>
                                    {meeting.platform && (
                                        <span className="text-xs bg-gray-100 px-2 py-0.5 border border-gray-300">
                                            {meeting.platform}
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

            {/* Transcript Upload Modal */}
            {showTranscriptModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <NeoCard className="w-full max-w-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
                        <button
                            onClick={() => setShowTranscriptModal(false)}
                            className="absolute top-4 right-4 p-1 border-2 border-black hover:bg-neo-red transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-black uppercase mb-4">Upload Transcript</h2>

                        <p className="text-sm font-medium text-gray-600 mb-4">
                            Paste your meeting transcript below. Supported formats:
                        </p>
                        <div className="text-xs font-mono bg-neo-white border-2 border-black p-3 mb-4">
                            <p className="font-bold mb-1">Format examples:</p>
                            <p>Speaker Name: What they said</p>
                            <p>[00:01:30] Speaker: Text with timestamp</p>
                        </div>

                        <input
                            type="text"
                            placeholder="Meeting Title"
                            value={meetingTitle}
                            onChange={(e) => setMeetingTitle(e.target.value)}
                            className="w-full mb-3 p-3 border-4 border-black font-bold focus:bg-neo-white outline-none"
                        />

                        <textarea
                            placeholder="Paste your transcript here..."
                            value={transcriptText}
                            onChange={(e) => setTranscriptText(e.target.value)}
                            className="w-full flex-1 min-h-[200px] p-4 border-4 border-black font-medium resize-none focus:bg-neo-white outline-none"
                        />

                        <div className="flex gap-3 mt-4">
                            <NeoButton
                                onClick={() => setShowTranscriptModal(false)}
                                className="bg-white"
                            >
                                Cancel
                            </NeoButton>
                            <NeoButton
                                onClick={handleTranscriptUpload}
                                className="bg-neo-teal flex-1"
                                disabled={!transcriptText.trim()}
                            >
                                <Upload size={18} className="mr-2" />
                                Create Meeting
                            </NeoButton>
                        </div>
                    </NeoCard>
                </div>
            )}

            {/* Schedule Meeting Modal (Host Only) */}
            {showScheduleModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <NeoCard className="w-full max-w-md relative">
                        <button
                            onClick={() => setShowScheduleModal(false)}
                            className="absolute top-4 right-4 p-1 border-2 border-black hover:bg-neo-red transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-black uppercase mb-4">Schedule Meeting</h2>

                        <form onSubmit={handleScheduleMeeting} className="space-y-4">
                            <div>
                                <label className="block font-bold text-sm uppercase mb-1">Title</label>
                                <input
                                    type="text"
                                    value={scheduleData.title}
                                    onChange={(e) => setScheduleData({ ...scheduleData, title: e.target.value })}
                                    placeholder="Weekly Standup"
                                    className="w-full p-3 border-4 border-black font-medium focus:bg-neo-white outline-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-sm uppercase mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={scheduleData.date}
                                        onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                                        className="w-full p-3 border-4 border-black font-medium focus:bg-neo-white outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-sm uppercase mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={scheduleData.time}
                                        onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                                        className="w-full p-3 border-4 border-black font-medium focus:bg-neo-white outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-sm uppercase mb-1">Duration</label>
                                    <select
                                        value={scheduleData.duration}
                                        onChange={(e) => setScheduleData({ ...scheduleData, duration: e.target.value })}
                                        className="w-full p-3 border-4 border-black font-medium focus:bg-neo-white outline-none"
                                    >
                                        <option value="15">15 min</option>
                                        <option value="30">30 min</option>
                                        <option value="45">45 min</option>
                                        <option value="60">1 hour</option>
                                        <option value="90">1.5 hours</option>
                                        <option value="120">2 hours</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-sm uppercase mb-1">Platform</label>
                                    <select
                                        value={scheduleData.platform}
                                        onChange={(e) => setScheduleData({ ...scheduleData, platform: e.target.value })}
                                        className="w-full p-3 border-4 border-black font-medium focus:bg-neo-white outline-none"
                                    >
                                        <option value="Zoom">Zoom</option>
                                        <option value="Google Meet">Google Meet</option>
                                        <option value="Teams">Microsoft Teams</option>
                                        <option value="Offline">In-Person</option>
                                    </select>
                                </div>
                            </div>

                            <NeoButton type="submit" className="w-full bg-neo-yellow mt-4">
                                <Calendar size={18} className="mr-2" />
                                Schedule Meeting
                            </NeoButton>
                        </form>
                    </NeoCard>
                </div>
            )}

            {/* Invite Members Modal (Host Only) */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <NeoCard className="w-full max-w-md relative">
                        <button
                            onClick={() => setShowInviteModal(false)}
                            className="absolute top-4 right-4 p-1 border-2 border-black hover:bg-neo-red transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-black uppercase mb-4">Invite Members</h2>

                        <p className="font-medium text-gray-600 mb-4">
                            Share this code or link with people to invite them to your team.
                        </p>

                        <div className="bg-neo-white border-4 border-black p-4 mb-4">
                            <label className="block font-bold text-sm uppercase mb-2">Invite Code</label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 font-mono text-2xl font-black tracking-widest">
                                    {inviteCode || 'Loading...'}
                                </div>
                                <button
                                    onClick={copyInviteLink}
                                    className="p-2 border-2 border-black bg-white hover:bg-neo-yellow transition-colors"
                                >
                                    {copiedInvite ? <CheckCircle size={20} /> : <Copy size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="bg-neo-teal border-4 border-black p-4">
                            <label className="block font-bold text-sm uppercase mb-2">Invite Link</label>
                            <div className="text-sm font-mono break-all">
                                {`${window.location.origin}/join/${inviteCode}`}
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 font-medium mt-4 text-center">
                            Members who join will have read access to all meetings
                        </p>
                    </NeoCard>
                </div>
            )}

            {/* Team Settings Modal (Host Only) */}
            {showSettingsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <NeoCard className="w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setShowSettingsModal(false)}
                            className="absolute top-4 right-4 p-1 border-2 border-black hover:bg-neo-red transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-black uppercase mb-6">Team Settings</h2>

                        {/* Rename Team */}
                        <div className="mb-6">
                            <label className="block font-bold text-sm uppercase mb-2">Team Name</label>
                            <div className="flex gap-2">
                                <NeoInput
                                    name="teamName"
                                    value={editTeamName}
                                    onChange={(e) => setEditTeamName(e.target.value)}
                                    className="flex-1"
                                />
                                <NeoButton
                                    onClick={updateTeamName}
                                    className="bg-neo-teal"
                                    disabled={editTeamName === teamName || !editTeamName.trim()}
                                >
                                    <Edit3 size={16} className="mr-1" />
                                    Save
                                </NeoButton>
                            </div>
                        </div>

                        {/* Members List */}
                        <div className="mb-6">
                            <label className="block font-bold text-sm uppercase mb-3">
                                Team Members ({teamMembers.length})
                            </label>
                            {isLoadingMembers ? (
                                <div className="text-center py-4">
                                    <Loader2 size={24} className="animate-spin mx-auto" />
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {teamMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-3 border-4 border-black bg-white"
                                        >
                                            <div>
                                                <p className="font-bold">{member.name || member.email}</p>
                                                <p className="text-xs text-gray-600">{member.email}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`
                                                    text-xs font-bold uppercase px-2 py-0.5 border-2 border-black
                                                    ${member.role === 'owner' ? 'bg-neo-yellow' : 'bg-neo-teal'}
                                                `}>
                                                    {member.role}
                                                </span>
                                                {member.role !== 'owner' && (
                                                    <button
                                                        onClick={() => removeMember(member.id, member.name || member.email)}
                                                        className="p-1 border-2 border-black hover:bg-neo-red transition-colors"
                                                        title="Remove member"
                                                    >
                                                        <UserMinus size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Danger Zone */}
                        <div className="pt-4 border-t-4 border-black">
                            <label className="block font-bold text-sm uppercase mb-2 text-red-600">
                                Danger Zone
                            </label>
                            <NeoButton
                                onClick={deleteTeam}
                                className="bg-neo-red text-white w-full"
                            >
                                <Trash2 size={18} className="mr-2" />
                                Delete Team
                            </NeoButton>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                This will permanently delete the team and all its meetings.
                            </p>
                        </div>
                    </NeoCard>
                </div>
            )}

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
