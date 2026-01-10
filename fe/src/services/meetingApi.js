/**
 * Meeting API service - Mock data and helpers
 */

// Mock meeting summary for demo
export const MOCK_MEETING_SUMMARY = {
    id: 'demo',
    title: 'Q1 Product Planning Session',
    date: '2026-01-09T10:00:00Z',
    duration: '45 min',
    platform: 'Zoom',
    sentiment: 'positive',
    participants: [
        { name: 'Sarah Chen', role: 'Product Manager' },
        { name: 'Michael Rodriguez', role: 'Engineering Lead' },
        { name: 'Emily Watson', role: 'UX Designer' },
        { name: 'David Kim', role: 'Backend Developer' },
    ],
    topics: ['Mobile App', 'API Redesign', 'User Onboarding', 'Analytics Dashboard', 'Q1 Roadmap'],
    actionItems: [
        { id: 1, text: 'Complete mobile app wireframes', assignee: 'Emily Watson', deadline: '2026-01-15', urgency: 'high' },
        { id: 2, text: 'Review API specifications', assignee: 'Michael Rodriguez', deadline: '2026-01-12', urgency: 'critical' },
        { id: 3, text: 'Set up analytics tracking', assignee: 'David Kim', deadline: '2026-01-20', urgency: 'medium' },
        { id: 4, text: 'Schedule user research sessions', assignee: 'Sarah Chen', deadline: '2026-01-18', urgency: 'low' },
    ],
    keyDecisions: [
        'Prioritize mobile app for Q1 launch',
        'Use React Native for cross-platform development',
        'Implement analytics before beta release',
    ],
    summary: 'The team discussed the Q1 product roadmap with a focus on the mobile app launch. Key decisions were made regarding technology stack and timeline. Action items were assigned with clear deadlines.',
};

// Mock transcript for demo
export const MOCK_TRANSCRIPT = [
    { id: 1, speaker: 'Sarah Chen', text: 'Good morning everyone! Let\'s start with our Q1 planning session.', timestamp: '00:00:12', sentiment: 'positive' },
    { id: 2, speaker: 'Michael Rodriguez', text: 'Thanks Sarah. I\'ve prepared some thoughts on the mobile app architecture.', timestamp: '00:00:28', sentiment: 'positive' },
    { id: 3, speaker: 'Emily Watson', text: 'I have the initial wireframes ready to share as well.', timestamp: '00:00:45', sentiment: 'positive' },
    { id: 4, speaker: 'David Kim', text: 'Before we dive in, should we discuss the API changes first?', timestamp: '00:01:02', sentiment: 'neutral' },
    { id: 5, speaker: 'Sarah Chen', text: 'Good point David. Let\'s start with the API updates since that affects everything else.', timestamp: '00:01:18', sentiment: 'positive' },
    { id: 6, speaker: 'Michael Rodriguez', text: 'The main concern is backward compatibility. We need to support v1 for at least 6 months.', timestamp: '00:01:35', sentiment: 'neutral' },
    { id: 7, speaker: 'David Kim', text: 'That\'s going to require careful versioning. I can outline a migration path.', timestamp: '00:01:52', sentiment: 'neutral' },
    { id: 8, speaker: 'Emily Watson', text: 'How will API changes affect the mobile app launch timeline?', timestamp: '00:02:10', sentiment: 'neutral' },
    { id: 9, speaker: 'Sarah Chen', text: 'We should be able to work in parallel. The mobile team can use mock data initially.', timestamp: '00:02:28', sentiment: 'positive' },
    { id: 10, speaker: 'Michael Rodriguez', text: 'I agree. Let\'s set a deadline of January 12th for the API spec review.', timestamp: '00:02:45', sentiment: 'positive' },
    { id: 11, speaker: 'David Kim', text: 'That works for me. I\'ll need to coordinate with the DevOps team for staging.', timestamp: '00:03:02', sentiment: 'neutral' },
    { id: 12, speaker: 'Emily Watson', text: 'Perfect. Moving on to the mobile wireframes - I\'ve focused on the onboarding flow.', timestamp: '00:03:20', sentiment: 'positive' },
    { id: 13, speaker: 'Sarah Chen', text: 'The onboarding is crucial for retention. What\'s the user journey looking like?', timestamp: '00:03:38', sentiment: 'positive' },
    { id: 14, speaker: 'Emily Watson', text: 'Three screens: welcome, quick setup, and personalization. Should take under 2 minutes.', timestamp: '00:03:55', sentiment: 'positive' },
    { id: 15, speaker: 'Michael Rodriguez', text: 'Can we add skip options for returning users?', timestamp: '00:04:12', sentiment: 'neutral' },
    { id: 16, speaker: 'Emily Watson', text: 'Absolutely. I\'ll include a "Skip for now" option on each screen.', timestamp: '00:04:28', sentiment: 'positive' },
];

// Helper to simulate API delay
export const simulateApiDelay = async (data, delay = 500) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    return data;
};

// Mock list of meetings
export const MOCK_MEETINGS = [
    MOCK_MEETING_SUMMARY,
    {
        id: 'meeting-2',
        title: 'Sprint Retrospective',
        date: '2026-01-08T15:00:00Z',
        duration: '30 min',
        platform: 'Google Meet',
        sentiment: 'positive',
    },
    {
        id: 'meeting-3',
        title: 'Design Review',
        date: '2026-01-07T11:00:00Z',
        duration: '60 min',
        platform: 'Zoom',
        sentiment: 'neutral',
    },
];
