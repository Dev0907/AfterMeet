
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import NeoCard from '../components/ui/NeoCard';
import NeoBadge from '../components/ui/NeoBadge';
import {
    ArrowLeft,
    BarChart3,
    PieChart,
    TrendingUp,
    Users,
    Clock,
    MessageSquare,
    AlertCircle,
    CheckCircle,
    Loader2,
} from 'lucide-react';
import { MOCK_MEETING_SUMMARY, MOCK_TRANSCRIPT, simulateApiDelay } from '../services/meetingApi';

/**
 * MeetingAnalytics - Graphical representation of meeting data
 */
const MeetingAnalytics = () => {
    const { teamId, meetingId } = useParams();
    const [meetingData, setMeetingData] = useState(null);
    const [transcript, setTranscript] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            await simulateApiDelay(null, 600);
            setMeetingData(MOCK_MEETING_SUMMARY);
            setTranscript(MOCK_TRANSCRIPT);
            setIsLoading(false);
        };
        fetchData();
    }, [meetingId]);

    // Calculate analytics data
    const getAnalytics = () => {
        if (!meetingData || !transcript.length) return null;

        // Speaker participation
        const speakerCounts = {};
        transcript.forEach(entry => {
            speakerCounts[entry.speaker] = (speakerCounts[entry.speaker] || 0) + 1;
        });
        const totalMessages = transcript.length;
        const speakerData = Object.entries(speakerCounts).map(([name, count]) => ({
            name,
            count,
            percentage: Math.round((count / totalMessages) * 100),
        })).sort((a, b) => b.count - a.count);

        // Sentiment breakdown
        const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
        transcript.forEach(entry => {
            sentimentCounts[entry.sentiment || 'neutral']++;
        });
        const sentimentData = Object.entries(sentimentCounts).map(([sentiment, count]) => ({
            sentiment,
            count,
            percentage: Math.round((count / totalMessages) * 100),
        }));

        // Action items by urgency
        const urgencyCount = { critical: 0, high: 0, medium: 0, low: 0 };
        meetingData.actionItems?.forEach(item => {
            urgencyCount[item.urgency]++;
        });

        // Timeline data (mock)
        const timelineData = [
            { time: '0-10 min', sentiment: 'neutral', topics: 2 },
            { time: '10-20 min', sentiment: 'positive', topics: 3 },
            { time: '20-30 min', sentiment: 'neutral', topics: 2 },
            { time: '30-45 min', sentiment: 'positive', topics: 1 },
        ];

        return { speakerData, sentimentData, urgencyCount, timelineData };
    };

    const analytics = getAnalytics();

    // Color palette for charts
    const speakerColors = ['bg-neo-teal', 'bg-neo-red', 'bg-neo-yellow', 'bg-neo-dark', 'bg-green-300', 'bg-orange-300'];
    const sentimentColors = { positive: 'bg-green-400', neutral: 'bg-neo-teal', negative: 'bg-neo-red' };
    const urgencyColors = { critical: 'bg-red-400', high: 'bg-orange-300', medium: 'bg-neo-yellow', low: 'bg-green-300' };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neo-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={48} className="animate-spin mx-auto mb-4" />
                    <p className="font-bold">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neo-white">
            {/* Header */}
            <header className="bg-neo-dark border-b-4 border-black">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        <Link
                            to={`/teams/${teamId}/meetings/${meetingId}`}
                            className="p-2 border-2 border-black bg-white hover:bg-neo-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
                                <BarChart3 size={14} />
                                Analytics
                            </div>
                            <h1 className="text-3xl font-black uppercase tracking-tight">
                                {meetingData?.title || 'Meeting Analytics'}
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <NeoCard className="text-center">
                        <Users size={32} className="mx-auto mb-2 text-neo-dark" />
                        <p className="text-3xl font-black">{meetingData?.participants?.length || 0}</p>
                        <p className="text-sm font-bold text-gray-600 uppercase">Participants</p>
                    </NeoCard>
                    <NeoCard className="text-center">
                        <MessageSquare size={32} className="mx-auto mb-2 text-neo-teal" />
                        <p className="text-3xl font-black">{transcript.length}</p>
                        <p className="text-sm font-bold text-gray-600 uppercase">Messages</p>
                    </NeoCard>
                    <NeoCard className="text-center">
                        <AlertCircle size={32} className="mx-auto mb-2 text-neo-red" />
                        <p className="text-3xl font-black">{meetingData?.actionItems?.length || 0}</p>
                        <p className="text-sm font-bold text-gray-600 uppercase">Action Items</p>
                    </NeoCard>
                    <NeoCard className="text-center">
                        <Clock size={32} className="mx-auto mb-2 text-neo-yellow" />
                        <p className="text-3xl font-black">{meetingData?.duration || '45 min'}</p>
                        <p className="text-sm font-bold text-gray-600 uppercase">Duration</p>
                    </NeoCard>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Speaker Participation Chart */}
                    <NeoCard>
                        <h2 className="flex items-center gap-2 text-xl font-black uppercase mb-4">
                            <PieChart size={24} />
                            Speaker Participation
                        </h2>
                        <div className="space-y-3">
                            {analytics?.speakerData?.map((speaker, index) => (
                                <div key={speaker.name}>
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold">{speaker.name}</span>
                                        <span className="font-medium text-gray-600">
                                            {speaker.count} messages ({speaker.percentage}%)
                                        </span>
                                    </div>
                                    <div className="h-8 bg-gray-200 border-2 border-black overflow-hidden">
                                        <div
                                            className={`h-full ${speakerColors[index % speakerColors.length]} transition-all duration-500`}
                                            style={{ width: `${speaker.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </NeoCard>

                    {/* Sentiment Analysis */}
                    <NeoCard>
                        <h2 className="flex items-center gap-2 text-xl font-black uppercase mb-4">
                            <TrendingUp size={24} />
                            Sentiment Analysis
                        </h2>

                        {/* Sentiment Pie Representation */}
                        <div className="flex justify-center mb-6">
                            <div className="relative w-48 h-48">
                                {/* Simple donut chart using CSS */}
                                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                    {analytics?.sentimentData?.reduce((acc, item, index) => {
                                        const colors = { positive: '#4ade80', neutral: '#A0C4FF', negative: '#FFB3C6' };
                                        const offset = acc.offset;
                                        const dashArray = `${item.percentage} ${100 - item.percentage}`;
                                        acc.elements.push(
                                            <circle
                                                key={item.sentiment}
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                fill="none"
                                                stroke={colors[item.sentiment]}
                                                strokeWidth="20"
                                                strokeDasharray={dashArray}
                                                strokeDashoffset={-offset}
                                                className="transition-all duration-500"
                                            />
                                        );
                                        acc.offset += item.percentage;
                                        return acc;
                                    }, { elements: [], offset: 0 }).elements}
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="text-2xl font-black">
                                            {analytics?.sentimentData?.find(s => s.sentiment === 'positive')?.percentage || 0}%
                                        </p>
                                        <p className="text-xs font-bold text-gray-600">POSITIVE</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex justify-center gap-4">
                            {analytics?.sentimentData?.map(item => (
                                <div key={item.sentiment} className="flex items-center gap-2">
                                    <div className={`w-4 h-4 border-2 border-black ${sentimentColors[item.sentiment]}`} />
                                    <span className="text-sm font-bold capitalize">{item.sentiment}</span>
                                    <span className="text-sm text-gray-600">({item.percentage}%)</span>
                                </div>
                            ))}
                        </div>
                    </NeoCard>

                    {/* Action Items by Urgency */}
                    <NeoCard>
                        <h2 className="flex items-center gap-2 text-xl font-black uppercase mb-4">
                            <AlertCircle size={24} />
                            Action Items by Urgency
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(analytics?.urgencyCount || {}).map(([urgency, count]) => (
                                <div
                                    key={urgency}
                                    className={`p-4 border-4 border-black ${urgencyColors[urgency]} text-center`}
                                >
                                    <p className="text-4xl font-black">{count}</p>
                                    <NeoBadge variant={urgency} size="sm">{urgency}</NeoBadge>
                                </div>
                            ))}
                        </div>
                    </NeoCard>

                    {/* Meeting Timeline */}
                    <NeoCard>
                        <h2 className="flex items-center gap-2 text-xl font-black uppercase mb-4">
                            <Clock size={24} />
                            Meeting Timeline
                        </h2>
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-4 top-0 bottom-0 w-1 bg-black" />

                            <div className="space-y-4">
                                {analytics?.timelineData?.map((segment, index) => (
                                    <div key={index} className="flex items-start gap-4 pl-4">
                                        <div className={`
                                            w-8 h-8 rounded-full border-4 border-black flex-shrink-0
                                            flex items-center justify-center -ml-4 z-10
                                            ${segment.sentiment === 'positive' ? 'bg-green-300' :
                                                segment.sentiment === 'negative' ? 'bg-neo-red' : 'bg-neo-teal'}
                                        `}>
                                            {segment.sentiment === 'positive' ? '😊' :
                                                segment.sentiment === 'negative' ? '😟' : '😐'}
                                        </div>
                                        <div className="bg-white border-4 border-black p-3 flex-1 shadow-neo-sm">
                                            <p className="font-black">{segment.time}</p>
                                            <p className="text-sm font-medium text-gray-600">
                                                {segment.topics} topics discussed • {segment.sentiment} sentiment
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </NeoCard>

                    {/* Topics Cloud */}
                    <NeoCard className="lg:col-span-2">
                        <h2 className="flex items-center gap-2 text-xl font-black uppercase mb-4">
                            <MessageSquare size={24} />
                            Topics Discussed
                        </h2>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {meetingData?.topics?.map((topic, index) => {
                                const sizes = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
                                const colors = ['bg-neo-teal', 'bg-neo-yellow', 'bg-neo-red', 'bg-neo-dark', 'bg-green-200'];
                                const size = sizes[Math.floor(Math.random() * sizes.length)];
                                const color = colors[index % colors.length];

                                return (
                                    <span
                                        key={topic}
                                        className={`
                                            ${size} ${color} font-bold px-4 py-2 
                                            border-4 border-black shadow-neo
                                            hover:translate-x-0.5 hover:translate-y-0.5 
                                            hover:shadow-neo-hover transition-all cursor-default
                                        `}
                                    >
                                        {topic}
                                    </span>
                                );
                            })}
                        </div>
                    </NeoCard>

                    {/* Key Insights */}
                    <NeoCard className="lg:col-span-2 bg-neo-yellow">
                        <h2 className="flex items-center gap-2 text-xl font-black uppercase mb-4">
                            <CheckCircle size={24} />
                            Key Insights
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white border-4 border-black p-4">
                                <p className="font-black uppercase text-sm text-gray-600 mb-2">Most Active Speaker</p>
                                <p className="text-xl font-black">{analytics?.speakerData?.[0]?.name || 'N/A'}</p>
                                <p className="text-sm font-medium text-gray-600">
                                    {analytics?.speakerData?.[0]?.percentage}% of conversation
                                </p>
                            </div>
                            <div className="bg-white border-4 border-black p-4">
                                <p className="font-black uppercase text-sm text-gray-600 mb-2">Overall Sentiment</p>
                                <p className="text-xl font-black capitalize">{meetingData?.sentiment || 'Neutral'}</p>
                                <p className="text-sm font-medium text-gray-600">
                                    Based on {transcript.length} messages
                                </p>
                            </div>
                            <div className="bg-white border-4 border-black p-4">
                                <p className="font-black uppercase text-sm text-gray-600 mb-2">Critical Actions</p>
                                <p className="text-xl font-black">{analytics?.urgencyCount?.critical || 0}</p>
                                <p className="text-sm font-medium text-gray-600">
                                    Require immediate attention
                                </p>
                            </div>
                        </div>
                    </NeoCard>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-12 border-t-4 border-black bg-neo-dark py-6">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="font-bold text-sm">
                        Meeting Analytics • AfterMeet
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default MeetingAnalytics;
