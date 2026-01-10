import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import NeoCard from '../components/ui/NeoCard';
import NeoButton from '../components/ui/NeoButton';
import NeoBadge from '../components/ui/NeoBadge';
import { NeoSkeletonCard } from '../components/ui/NeoSkeleton';
import MeetingChat from '../components/meeting/MeetingChat';
import SemanticSearch from '../components/meeting/SemanticSearch';
import {
    ArrowLeft, Calendar, Clock, Users, FileText, CheckCircle, AlertCircle,
    MessageSquare, ChevronDown, ChevronUp, BarChart3, Loader2, Sparkles, Filter,
} from 'lucide-react';
import { meetingsApi, aiApi } from '../services/api';

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const MeetingDetail = () => {
    const { teamId, meetingId } = useParams();
    const navigate = useNavigate();

    const [meeting, setMeeting] = useState(null);
    const [transcript, setTranscript] = useState([]);
    const [aiSummary, setAiSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [expandedSections, setExpandedSections] = useState({ summary: true, actionItems: true, decisions: false, transcript: true });
    const [filteredTranscript, setFilteredTranscript] = useState(null);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    useEffect(() => {
        const fetchMeeting = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { data } = await meetingsApi.getById(meetingId);
                setMeeting(data);
                if (data.transcript?.length > 0) setTranscript(data.transcript);
                if (data.summary) setAiSummary(data.summary);
            } catch (err) {
                console.error('Error fetching meeting:', err);
                setError('Meeting not found');
            } finally {
                setIsLoading(false);
            }
        };
        fetchMeeting();
    }, [meetingId]);

    const analyzeTranscript = async () => {
        if (!transcript.length) return;
        setIsAnalyzing(true);
        try {
            const transcriptText = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');
            const { data } = await aiApi.analyze({ transcript: transcriptText, meeting_id: meetingId });
            console.log('[Analyze Response]', data);
            
            const summaryData = {
                ...data.summary,
                topics: data.topics,
                tasks: data.tasks,
                speakers: data.speakers,
                sentiment: data.sentiment,
                overall_sentiment: data.overall_sentiment
            };
            setAiSummary(summaryData);
            
            if (data.transcript) {
                setTranscript(data.transcript.map((t, i) => ({
                    id: i, speaker: t.speaker_name || t.speaker || 'Speaker',
                    text: t.text, timestamp: t.timestamp || '--:--', sentiment: t.sentiment || 'neutral'
                })));
            }
        } catch (err) {
            console.error('Error analyzing transcript:', err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getSummaryText = () => {
        const summary = aiSummary || meeting?.summary;
        if (!summary) return 'Upload a transcript and click "Analyze with AI" to generate insights.';
        
        if (summary.summary_text) return summary.summary_text;
        if (summary.overview) return summary.overview;
        if (typeof summary === 'string') return summary;
        
        const parts = [];
        const topics = summary.topics || aiSummary?.topics;
        const tasks = summary.tasks || aiSummary?.tasks;
        const speakers = summary.speakers || aiSummary?.speakers;
        
        if (speakers && Object.keys(speakers).length > 0) {
            parts.push(`Meeting with ${Object.keys(speakers).length} participants: ${Object.keys(speakers).join(', ')}.`);
        }
        if (topics?.length > 0) {
            parts.push(`Key topics discussed: ${topics.slice(0, 5).join(', ')}.`);
        }
        if (tasks?.length > 0) {
            parts.push(`${tasks.length} action item(s) identified.`);
        }
        
        return parts.length > 0 ? parts.join(' ') : 'Analysis complete. See topics and action items below.';
    };

    const handleChat = async (question) => {
        try {
            console.log('[Chat] Sending question:', question, 'for meeting:', meetingId);
            const { data } = await aiApi.chat(meetingId, { question });
            console.log('[Chat] Response:', data);
            return { response: data.answer || data.response || 'No response received' };
        } catch (err) {
            console.error('[Chat] Error:', err);
            return { response: err.response?.data?.error || 'Failed to get AI response. Make sure the Python API is running.' };
        }
    };

    const handleSearch = async (query) => {
        if (!query.trim()) { setFilteredTranscript(null); return null; }
        try {
            const { data } = await aiApi.search(meetingId, { query, top_k: 5 });
            if (data.results?.length > 0) {
                const results = data.results.map(r => ({ speaker: r.speaker, text: r.text, timestamp: r.timestamp, score: r.score }));
                setFilteredTranscript(results);
                return results;
            }
        } catch (err) {
            console.error('Search error:', err);
        }
        const lowerQuery = query.toLowerCase();
        const matches = transcript.filter(entry => entry.text?.toLowerCase().includes(lowerQuery) || entry.speaker?.toLowerCase().includes(lowerQuery));
        setFilteredTranscript(matches.length > 0 ? matches : null);
        return matches;
    };

    const toggleSection = (section) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A';
    const getUrgencyColor = (urgency) => ({ critical: 'bg-red-400', high: 'bg-orange-300', medium: 'bg-neo-yellow', low: 'bg-green-300' }[urgency] || 'bg-neo-yellow');

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neo-white">
                <header className="bg-neo-teal border-b-4 border-black"><div className="max-w-6xl mx-auto px-4 py-6"><div className="h-8 w-48 bg-white/50 animate-pulse" /></div></header>
                <main className="max-w-6xl mx-auto px-4 py-8"><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2 space-y-4"><NeoSkeletonCard /><NeoSkeletonCard /></div><NeoSkeletonCard /></div></main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-neo-white flex items-center justify-center p-4">
                <NeoCard className="text-center max-w-md">
                    <AlertCircle size={64} className="mx-auto mb-4 text-neo-red" />
                    <h2 className="text-2xl font-black uppercase mb-2">Error Loading Meeting</h2>
                    <p className="font-medium text-gray-600 mb-6">{error}</p>
                    <NeoButton onClick={() => navigate(`/teams/${teamId}/meetings`)} className="bg-neo-teal">Back to Meetings</NeoButton>
                </NeoCard>
            </div>
        );
    }

    const displayTranscript = filteredTranscript || transcript;


    return (
        <div className="min-h-screen bg-neo-white">
            <header className="bg-neo-teal border-b-4 border-black">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link to={`/teams/${teamId}/meetings`} className="p-2 border-2 border-black bg-white hover:bg-neo-white transition-colors"><ArrowLeft size={20} /></Link>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">{meeting?.title || 'Meeting Details'}</h1>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm font-medium">
                                    <span className="flex items-center gap-1"><Calendar size={14} />{formatDate(meeting?.date || meeting?.createdAt)}</span>
                                    {meeting?.duration && <span className="flex items-center gap-1"><Clock size={14} />{meeting.duration}</span>}
                                    {meeting?.platform && <span className="px-2 py-0.5 bg-white border-2 border-black text-xs font-bold">{meeting.platform}</span>}
                                </div>
                            </div>
                        </div>
                        <Link to={`/teams/${teamId}/meetings/${meetingId}/analytics`} className="flex items-center gap-2 px-4 py-2 bg-neo-yellow border-4 border-black font-bold shadow-neo hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-hover transition-all">
                            <BarChart3 size={18} />Analytics
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <NeoCard>
                            <button onClick={() => toggleSection('summary')} className="w-full flex items-center justify-between font-black text-xl uppercase">
                                <span className="flex items-center gap-2"><FileText size={24} />Summary{aiSummary && <Sparkles size={16} className="text-neo-yellow" />}</span>
                                {expandedSections.summary ? <ChevronUp /> : <ChevronDown />}
                            </button>
                            {expandedSections.summary && (
                                <div className="mt-4 pt-4 border-t-2 border-black">
                                    {transcript.length > 0 && !aiSummary && (
                                        <div className="mb-4">
                                            <NeoButton onClick={analyzeTranscript} className="bg-neo-yellow w-full" disabled={isAnalyzing}>
                                                {isAnalyzing ? <><Loader2 size={18} className="mr-2 animate-spin" />Analyzing with AI...</> : <><Sparkles size={18} className="mr-2" />Analyze with AI</>}
                                            </NeoButton>
                                        </div>
                                    )}
                                    <p className="font-medium leading-relaxed">{getSummaryText()}</p>
                                    {(aiSummary?.topics || meeting?.summary?.topics || meeting?.topics)?.length > 0 && (
                                        <div className="mt-4">
                                            <p className="font-bold text-sm uppercase mb-2">Topics Discussed</p>
                                            <div className="flex flex-wrap gap-2">{(aiSummary?.topics || meeting?.summary?.topics || meeting?.topics).map((topic, i) => <span key={i} className="px-3 py-1 bg-neo-yellow border-2 border-black font-bold text-sm">{topic}</span>)}</div>
                                        </div>
                                    )}
                                    {aiSummary?.named_entities?.length > 0 && (
                                        <div className="mt-4">
                                            <p className="font-bold text-sm uppercase mb-2">Key People & Entities</p>
                                            <div className="flex flex-wrap gap-2">{aiSummary.named_entities.map((entity, i) => <span key={i} className="px-3 py-1 bg-neo-teal border-2 border-black font-bold text-sm">{entity}</span>)}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </NeoCard>

                        {(aiSummary?.tasks || meeting?.summary?.tasks || aiSummary?.action_items || meeting?.summary?.action_items)?.length > 0 && (
                            <NeoCard>
                                <button onClick={() => toggleSection('actionItems')} className="w-full flex items-center justify-between font-black text-xl uppercase">
                                    <span className="flex items-center gap-2"><CheckCircle size={24} />Meeting Minutes ({(aiSummary?.tasks || meeting?.summary?.tasks || aiSummary?.action_items || meeting?.summary?.action_items)?.length})</span>
                                    {expandedSections.actionItems ? <ChevronUp /> : <ChevronDown />}
                                </button>
                                {expandedSections.actionItems && (
                                    <div className="mt-4 pt-4 border-t-2 border-black">
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            <Filter size={16} className="text-gray-600" /><span className="text-sm font-bold uppercase">Filter:</span>
                                            {['all', 'critical', 'high', 'medium', 'low'].map(priority => (
                                                <button key={priority} onClick={() => setPriorityFilter(priority)}
                                                    className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black transition-all ${priorityFilter === priority ? 'bg-neo-dark text-white' : priority === 'critical' ? 'bg-red-100 hover:bg-red-200' : priority === 'high' ? 'bg-orange-100 hover:bg-orange-200' : priority === 'medium' ? 'bg-yellow-100 hover:bg-yellow-200' : priority === 'low' ? 'bg-green-100 hover:bg-green-200' : 'bg-white hover:bg-gray-100'}`}>
                                                    {priority}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="space-y-3">
                                            {(aiSummary?.tasks || meeting?.summary?.tasks || aiSummary?.action_items || meeting?.summary?.action_items)
                                                .filter(item => priorityFilter === 'all' || item.urgency === priorityFilter)
                                                .sort((a, b) => (PRIORITY_ORDER[a.urgency] || 3) - (PRIORITY_ORDER[b.urgency] || 3))
                                                .map((item, i) => (
                                                    <div key={i} className={`p-3 border-4 border-black ${getUrgencyColor(item.urgency)}`}>
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="font-bold">{item.task}</p>
                                                            <NeoBadge variant={item.urgency} size="sm">{item.urgency}</NeoBadge>
                                                        </div>
                                                        <div className="flex flex-wrap gap-3 mt-2 text-sm font-medium">
                                                            {item.owner && <span className="flex items-center gap-1"><Users size={12} />{item.owner}</span>}
                                                            {item.deadline && <span className="flex items-center gap-1"><Calendar size={12} />{item.deadline}</span>}
                                                        </div>
                                                        {item.urgency_reason && <p className="text-xs text-gray-600 mt-2 italic">{item.urgency_reason}</p>}
                                                    </div>
                                                ))}
                                            {(aiSummary?.tasks || meeting?.summary?.tasks || aiSummary?.action_items || meeting?.summary?.action_items).filter(item => priorityFilter === 'all' || item.urgency === priorityFilter).length === 0 && (
                                                <p className="text-center text-gray-500 py-4 font-medium">No {priorityFilter} priority items</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </NeoCard>
                        )}


                        <NeoCard>
                            <button onClick={() => toggleSection('transcript')} className="w-full flex items-center justify-between font-black text-xl uppercase">
                                <span className="flex items-center gap-2"><MessageSquare size={24} />Transcript ({transcript.length} entries)</span>
                                {expandedSections.transcript ? <ChevronUp /> : <ChevronDown />}
                            </button>
                            {expandedSections.transcript && (
                                <div className="mt-4 pt-4 border-t-2 border-black">
                                    <SemanticSearch transcript={transcript} onSearch={handleSearch} onResultClick={(entry) => console.log('Clicked:', entry)} />
                                    <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                                        {displayTranscript.length > 0 ? displayTranscript.map((entry, i) => (
                                            <div key={i} className="flex gap-3">
                                                <div className="w-20 flex-shrink-0"><span className="text-xs font-mono text-gray-500">{entry.timestamp || entry.startTime || '--:--'}</span></div>
                                                <div className="flex-1"><span className="font-bold text-neo-dark">{entry.speaker}:</span> <span className="font-medium">{entry.text}</span></div>
                                            </div>
                                        )) : <p className="text-center text-gray-500 font-medium py-4">No transcript available</p>}
                                    </div>
                                </div>
                            )}
                        </NeoCard>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="sticky top-4"><MeetingChat meetingId={meetingId} onSendMessage={handleChat} /></div>
                    </div>
                </div>
            </main>

            <footer className="mt-12 border-t-4 border-black bg-neo-teal py-6">
                <div className="max-w-6xl mx-auto px-4 text-center"><p className="font-bold text-sm">AfterMeet • Meeting Intelligence Platform</p></div>
            </footer>
        </div>
    );
};

export default MeetingDetail;
