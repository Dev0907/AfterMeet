// Meeting API Service Layer
// Centralized API calls for all meeting-related endpoints

const API_BASE = 'http://localhost:3000/api';

/**
 * Analyze a meeting file (audio/video upload)
 * @param {File} file - The meeting recording file
 * @returns {Promise<{meetingId: string, status: string}>}
 */
export async function analyzeMeeting(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/meetings/analyze`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Failed to analyze meeting');
    }

    return response.json();
}

/**
 * Get meeting processing status
 * @param {string} meetingId 
 * @returns {Promise<{status: 'processing' | 'completed' | 'failed', progress?: number}>}
 */
export async function getMeetingStatus(meetingId) {
    const response = await fetch(`${API_BASE}/meetings/${meetingId}/status`);

    if (!response.ok) {
        throw new Error('Failed to get meeting status');
    }

    return response.json();
}

/**
 * Get meeting summary with action items
 * @param {string} meetingId 
 * @returns {Promise<MeetingSummary>}
 */
export async function getMeetingSummary(meetingId) {
    const response = await fetch(`${API_BASE}/meetings/${meetingId}/summary`);

    if (!response.ok) {
        throw new Error('Failed to get meeting summary');
    }

    return response.json();
}

/**
 * Get full meeting transcript
 * @param {string} meetingId 
 * @returns {Promise<TranscriptEntry[]>}
 */
export async function getMeetingTranscript(meetingId) {
    const response = await fetch(`${API_BASE}/meetings/${meetingId}/transcript`);

    if (!response.ok) {
        throw new Error('Failed to get transcript');
    }

    return response.json();
}

/**
 * Chat with meeting AI assistant
 * @param {string} meetingId 
 * @param {string} message 
 * @returns {Promise<{response: string, references?: TranscriptReference[]}>}
 */
export async function chatWithMeeting(meetingId, message) {
    const response = await fetch(`${API_BASE}/meetings/${meetingId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
    });

    if (!response.ok) {
        throw new Error('Failed to chat with meeting');
    }

    return response.json();
}

/**
 * Semantic search within meeting
 * @param {string} meetingId 
 * @param {string} query 
 * @returns {Promise<SearchResult[]>}
 */
export async function searchMeeting(meetingId, query) {
    const response = await fetch(
        `${API_BASE}/meetings/${meetingId}/search?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
        throw new Error('Search failed');
    }

    return response.json();
}

/**
 * Get all meetings for the current user
 * @returns {Promise<Meeting[]>}
 */
export async function getMeetings() {
    const userId = localStorage.getItem('userId');
    const response = await fetch(`${API_BASE}/meetings?userId=${userId}`);

    if (!response.ok) {
        throw new Error('Failed to get meetings');
    }

    return response.json();
}

// Mock data for development/demo purposes
export const MOCK_MEETING_SUMMARY = {
    id: 'demo-meeting-1',
    title: 'Q1 Product Planning Review',
    date: '2026-01-10T10:00:00Z',
    duration: '45 min',
    executiveSummary: 'The team aligned on Q1 priorities focusing on the new dashboard feature and API improvements. Key decisions were made regarding the timeline and resource allocation. There was consensus on delaying the mobile app update to Q2.',
    sentiment: 'positive',
    topics: ['Product Roadmap', 'Q1 Planning', 'Dashboard Features', 'API Improvements', 'Resource Allocation'],
    participants: ['Sarah Chen', 'Mike Johnson', 'Alex Rivera', 'Jordan Lee'],
    actionItems: [
        {
            id: '1',
            title: 'Finalize dashboard wireframes',
            owner: 'Alex Rivera',
            deadline: '2026-01-15',
            urgency: 'critical',
            urgencyReason: 'Blocks development sprint starting next week. Design approval needed before any frontend work can begin.',
        },
        {
            id: '2',
            title: 'Set up API monitoring infrastructure',
            owner: 'Mike Johnson',
            deadline: '2026-01-20',
            urgency: 'high',
            urgencyReason: 'Required for production deployment. Current monitoring gaps have caused issues in past releases.',
        },
        {
            id: '3',
            title: 'Draft Q1 resource allocation proposal',
            owner: 'Sarah Chen',
            deadline: '2026-01-12',
            urgency: 'high',
            urgencyReason: 'Leadership review meeting scheduled for Jan 13th. Proposal must be ready for stakeholder review.',
        },
        {
            id: '4',
            title: 'Research competitor dashboard features',
            owner: 'Jordan Lee',
            deadline: '2026-01-25',
            urgency: 'medium',
            urgencyReason: 'Informs design decisions but not blocking. Good to have for design review meeting.',
        },
        {
            id: '5',
            title: 'Update project documentation',
            owner: 'Alex Rivera',
            deadline: null,
            urgency: 'low',
            urgencyReason: 'Ongoing maintenance task. No immediate deadline but should be done before Q1 ends.',
        },
    ],
};

export const MOCK_TRANSCRIPT = [
    { id: '1', timestamp: '00:00:15', speaker: 'Sarah Chen', text: "Alright everyone, let's get started with our Q1 planning review. I want to make sure we're all aligned on priorities.", sentiment: 'neutral' },
    { id: '2', timestamp: '00:00:32', speaker: 'Mike Johnson', text: "Thanks Sarah. I've prepared an overview of our technical capacity for the quarter.", sentiment: 'positive' },
    { id: '3', timestamp: '00:01:05', speaker: 'Alex Rivera', text: "Before we dive in, I wanted to flag that the dashboard redesign is more complex than initially scoped. We might need to adjust timelines.", sentiment: 'neutral' },
    { id: '4', timestamp: '00:01:28', speaker: 'Sarah Chen', text: "That's a good point Alex. Can you walk us through the specific challenges?", sentiment: 'neutral' },
    { id: '5', timestamp: '00:01:45', speaker: 'Alex Rivera', text: "Sure. The main issue is the data visualization components. We need custom charts that aren't available in our current library.", sentiment: 'neutral' },
    { id: '6', timestamp: '00:02:12', speaker: 'Jordan Lee', text: "I've been researching some competitors and they're using D3.js for similar features. It might be worth considering.", sentiment: 'positive' },
    { id: '7', timestamp: '00:02:35', speaker: 'Mike Johnson', text: "D3 is powerful but has a steep learning curve. We should factor in ramp-up time for the team.", sentiment: 'neutral' },
    { id: '8', timestamp: '00:03:00', speaker: 'Sarah Chen', text: "Okay, let's make the wireframes a critical priority. Alex, can you finalize those by end of next week?", sentiment: 'positive' },
    { id: '9', timestamp: '00:03:18', speaker: 'Alex Rivera', text: "Yes, I'll have them ready by January 15th. That gives design team time to review before sprint planning.", sentiment: 'positive' },
    { id: '10', timestamp: '00:03:42', speaker: 'Mike Johnson', text: "On the API side, we really need to set up proper monitoring before the next release. I'd like to prioritize that.", sentiment: 'neutral' },
];

// Utility to simulate API delay for demo
export function simulateApiDelay(data, delayMs = 800) {
    return new Promise(resolve => setTimeout(() => resolve(data), delayMs));
}
