
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { generateOtp, sendOtpEmail } = require('./services/emailService');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Python AI API URL
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:5001';

// OTP expiry time in minutes
const OTP_EXPIRY_MINUTES = 10;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for transcripts

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running in Neobrutalist mode' });
});

// ============================================
// Python AI API Proxy Routes
// ============================================

// Analyze transcript
app.post('/api/analyze', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_API_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();

    // Save summary to database
    if (data.summary && data.meeting_id) {
      // Find DB meeting ID if different from Python ID (assuming they match for now)
      // If Python generates a new ID but we have an existing one, user passed meeting_id in body
      const meetingId = req.body.meeting_id;

      if (meetingId) {
        // 1. Save Full Analysis Package as Summary
        const analysisPackage = {
          ...data.summary, // detailed text, duration, etc
          sentiment: data.sentiment,
          speakers: data.speakers,
          tasks: data.tasks,
          topics: data.topics,
          overall_sentiment: data.overall_sentiment
        };

        await prisma.meetingSummary.upsert({
          where: { meetingId },
          update: { summary: JSON.stringify(analysisPackage) },
          create: { meetingId, summary: JSON.stringify(analysisPackage) }
        });

        // 2. Update Transcript Sentiment (Sync Python results to DB)
        if (data.transcript && Array.isArray(data.transcript)) {
          // We need to match Python transcript entries back to DB records.
          // Since we can't easily match by ID (Python doesn't know DB IDs unless we sent them),
          // we'll update based on startTime/text match, OR simpler: delete and recreate?
          // Recreating is risky if we lose other metadata.
          // Better approach: We assume the order is preserved or we fetch headers.

          // Let's try to update matching records by text snippet or just bulk replace for this MVP.
          // Bulk replace is safer to ensure sync.

          // Delete old transcripts for this meeting
          await prisma.meetingTranscript.deleteMany({
            where: { meetingId }
          });

          // Insert new transcripts with sentiment
          await prisma.meetingTranscript.createMany({
            data: data.transcript.map((t, index) => ({
              meetingId,
              speaker: t.speaker_name || t.speaker || 'Unknown',
              text: t.text,
              sentiment: t.sentiment, // The missing piece!
              startTime: t.timestamp ? parseTimestamp(t.timestamp) : index * 10,
              endTime: (t.timestamp ? parseTimestamp(t.timestamp) : index * 10) + 10
            }))
          });
        }
      }
    }

    res.status(response.status).json(data);
  } catch (error) {
    console.error('Python API error:', error);
    res.status(503).json({ error: 'AI service unavailable. Make sure Python API is running.' });
  }
});

// Chat with meeting
app.post('/api/meetings/:meetingId/chat', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...req.body,
        meeting_id: req.params.meetingId
      })
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Python API error:', error);
    res.status(503).json({ error: 'AI service unavailable. Make sure Python API is running.' });
  }
});

// Semantic search
app.post('/api/meetings/:meetingId/search', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_API_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...req.body,
        meeting_id: req.params.meetingId
      })
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Python API error:', error);
    res.status(503).json({ error: 'AI service unavailable. Make sure Python API is running.' });
  }
});

// Schedule Auto-Join
app.post('/api/schedule-join', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_API_URL}/schedule-join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Python API error:', error);
    res.status(503).json({ error: 'AI service unavailable. Make sure Python API is running.' });
  }
});

// ============================================
// Auth Routes
// ============================================

// Sign Up - Creates unverified user and sends OTP
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name, timezone } = req.body;
  console.log('Signup Request Body:', req.body);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // If user exists but not verified, allow resending OTP
      if (!existingUser.isVerified) {
        const otpCode = generateOtp();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // Invalidate old OTPs and create new one
        await prisma.otpCode.updateMany({
          where: { userId: existingUser.id, used: false },
          data: { used: true },
        });

        await prisma.otpCode.create({
          data: {
            userId: existingUser.id,
            code: otpCode,
            expiresAt,
          },
        });

        // Send OTP email
        await sendOtpEmail(email, otpCode, existingUser.name);

        return res.status(200).json({
          message: 'OTP sent to your email',
          pendingVerification: true,
          userId: existingUser.id,
        });
      }
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new unverified user
    const user = await prisma.user.create({
      data: {
        email,
        password,
        name,
        timezone: timezone || 'UTC',
        isVerified: false,
      },
    });

    // Generate and store OTP
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code: otpCode,
        expiresAt,
      },
    });

    // Send OTP email
    await sendOtpEmail(email, otpCode, name);

    res.status(201).json({
      message: 'User created. OTP sent to your email.',
      pendingVerification: true,
      userId: user.id,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Something went wrong during signup' });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ error: 'User ID and OTP are required' });
  }

  try {
    // Find the latest unused OTP for this user
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId,
        code: otp,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark OTP as used and verify user
    await prisma.$transaction([
      prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
      }),
    ]);

    res.json({ message: 'Email verified successfully', userId });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Something went wrong during verification' });
  }
});

// Resend OTP
app.post('/api/auth/resend-otp', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'User is already verified' });
    }

    // Invalidate existing OTPs
    await prisma.otpCode.updateMany({
      where: { userId, used: false },
      data: { used: true },
    });

    // Generate new OTP
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otpCode.create({
      data: {
        userId,
        code: otpCode,
        expiresAt,
      },
    });

    // Send OTP email
    await sendOtpEmail(user.email, otpCode, user.name);

    res.json({ message: 'New OTP sent to your email' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Sign In - Only allows verified users
app.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      // User exists but not verified - send new OTP
      const otpCode = generateOtp();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      await prisma.otpCode.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      });

      await prisma.otpCode.create({
        data: {
          userId: user.id,
          code: otpCode,
          expiresAt,
        },
      });

      await sendOtpEmail(email, otpCode, user.name);

      return res.status(403).json({
        error: 'Email not verified',
        pendingVerification: true,
        userId: user.id,
        message: 'Verification OTP sent to your email',
      });
    }

    res.json({ message: 'Signin successful', userId: user.id });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Something went wrong during signin' });
  }
});

// ============================================
// Teams Routes
// ============================================

// Get all teams for a user
app.get('/api/teams', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        meetings: {
          select: { id: true }
        }
      }
    });

    const teamsWithStats = teams.map(team => {
      const userRole = team.members.find(m => m.userId === userId)?.role || 'member';
      return {
        id: team.id,
        name: team.name,
        createdAt: team.createdAt,
        inviteCode: userRole === 'owner' ? team.inviteCode : undefined,
        memberCount: team.members.length,
        meetingCount: team.meetings.length,
        members: team.members.map(m => ({
          ...m.user,
          role: m.role
        })),
        role: userRole
      };
    });

    res.json(teamsWithStats);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Create a new team
app.post('/api/teams', async (req, res) => {
  const { name, userId } = req.body;

  if (!name || !userId) {
    return res.status(400).json({ error: 'Team name and user ID are required' });
  }

  try {
    // Generate unique invite code
    const inviteCode = generateInviteCode();

    const team = await prisma.team.create({
      data: {
        name,
        inviteCode,
        members: {
          create: {
            userId,
            role: 'owner'
          }
        }
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    });

    res.status(201).json({
      id: team.id,
      name: team.name,
      inviteCode: team.inviteCode,
      createdAt: team.createdAt,
      memberCount: 1,
      meetingCount: 0,
      role: 'owner'
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Get team invite code (Host only)
app.get('/api/teams/:teamId/invite', async (req, res) => {
  const { teamId } = req.params;
  const { userId } = req.query;

  // Validate UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!userId || !uuidRegex.test(userId) || !uuidRegex.test(teamId)) {
    return res.status(400).json({ error: 'Invalid user or team ID' });
  }

  try {
    // Check if user is host
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } }
    });

    if (!membership || membership.role !== 'owner') {
      return res.status(403).json({ error: 'Only team host can view invite code' });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { inviteCode: true, name: true }
    });

    res.json({
      inviteCode: team.inviteCode,
      inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/join/${team.inviteCode}`
    });
  } catch (error) {
    console.error('Get invite error:', error);
    res.status(500).json({ error: 'Failed to get invite code' });
  }
});

// Regenerate invite code (Host only)
app.post('/api/teams/:teamId/invite/regenerate', async (req, res) => {
  const { teamId } = req.params;
  const { userId } = req.body;

  try {
    // Check if user is host
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } }
    });

    if (!membership || membership.role !== 'owner') {
      return res.status(403).json({ error: 'Only team host can regenerate invite code' });
    }

    const newCode = generateInviteCode();

    const team = await prisma.team.update({
      where: { id: teamId },
      data: { inviteCode: newCode }
    });

    res.json({ inviteCode: team.inviteCode });
  } catch (error) {
    console.error('Regenerate invite error:', error);
    res.status(500).json({ error: 'Failed to regenerate invite code' });
  }
});

// Join team via invite code
app.post('/api/teams/join', async (req, res) => {
  const { inviteCode, userId } = req.body;

  if (!inviteCode || !userId) {
    return res.status(400).json({ error: 'Invite code and user ID are required' });
  }

  try {
    // Find team by invite code
    const team = await prisma.team.findUnique({
      where: { inviteCode },
      include: { members: true }
    });

    if (!team) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Check if already a member
    const existingMember = team.members.find(m => m.userId === userId);
    if (existingMember) {
      return res.status(400).json({
        error: 'You are already a member of this team',
        teamId: team.id
      });
    }

    // Add as member
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId,
        role: 'member'
      }
    });

    res.json({
      message: 'Successfully joined team',
      teamId: team.id,
      teamName: team.name
    });
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({ error: 'Failed to join team' });
  }
});

// Check user role in team
app.get('/api/teams/:teamId/role', async (req, res) => {
  const { teamId } = req.params;
  const { userId } = req.query;

  try {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } }
    });

    if (!membership) {
      return res.status(404).json({ error: 'Not a member of this team' });
    }

    res.json({ role: membership.role || 'member' });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ error: 'Failed to get role' });
  }
});

// Update team (Host only)
app.put('/api/teams/:teamId', async (req, res) => {
  const { teamId } = req.params;
  const { userId, name } = req.body;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!userId || !uuidRegex.test(userId) || !uuidRegex.test(teamId)) {
    return res.status(400).json({ error: 'Invalid user or team ID' });
  }

  try {
    // Check if user is host
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } }
    });

    if (!membership || membership.role !== 'owner') {
      return res.status(403).json({ error: 'Only team host can update the team' });
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: { name }
    });

    res.json({ id: updatedTeam.id, name: updatedTeam.name });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Delete team (Host only)
app.delete('/api/teams/:teamId', async (req, res) => {
  const { teamId } = req.params;
  const { userId } = req.query;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!userId || !uuidRegex.test(userId) || !uuidRegex.test(teamId)) {
    return res.status(400).json({ error: 'Invalid user or team ID' });
  }

  try {
    // Check if user is host
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } }
    });

    if (!membership || membership.role !== 'owner') {
      return res.status(403).json({ error: 'Only team host can delete the team' });
    }

    // Delete in correct order (foreign keys)
    await prisma.teamMember.deleteMany({ where: { teamId } });
    await prisma.meeting.deleteMany({ where: { teamId } });
    await prisma.team.delete({ where: { id: teamId } });

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// Get team members (for management page)
app.get('/api/teams/:teamId/members', async (req, res) => {
  const { teamId } = req.params;

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const members = team.members.map(m => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role
    }));

    res.json(members);
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to get team members' });
  }
});

// Remove member from team (Host only)
app.delete('/api/teams/:teamId/members/:memberId', async (req, res) => {
  const { teamId, memberId } = req.params;
  const { userId } = req.query;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!userId || !uuidRegex.test(userId) || !uuidRegex.test(teamId) || !uuidRegex.test(memberId)) {
    return res.status(400).json({ error: 'Invalid IDs' });
  }

  try {
    // Check if requester is host
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } }
    });

    if (!membership || membership.role !== 'owner') {
      return res.status(403).json({ error: 'Only team host can remove members' });
    }

    // Don't allow host to remove themselves
    if (memberId === userId) {
      return res.status(400).json({ error: 'Host cannot remove themselves. Transfer ownership first.' });
    }

    // Check if target is a member
    const targetMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: memberId } }
    });

    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found in this team' });
    }

    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId: memberId } }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// ============================================
// Meetings Routes
// ============================================

// Get all meetings for a team
app.get('/api/teams/:teamId/meetings', async (req, res) => {
  const { teamId } = req.params;

  try {
    const meetings = await prisma.meeting.findMany({
      where: { teamId },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        transcripts: { select: { id: true } },
        summary: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const meetingsWithStatus = meetings.map(m => ({
      id: m.id,
      title: m.title || 'Untitled Meeting',
      scheduledStart: m.scheduledStart,
      scheduledEnd: m.scheduledEnd,
      platform: m.platform,
      organizer: m.organizer,
      createdAt: m.createdAt,
      hasTranscript: m.transcripts.length > 0,
      hasSummary: !!m.summary,
      status: m.summary ? 'analyzed' : (m.transcripts.length > 0 ? 'transcribed' : 'pending')
    }));

    res.json(meetingsWithStatus);
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Create a new meeting with optional transcript upload
app.post('/api/teams/:teamId/meetings', async (req, res) => {
  const { teamId } = req.params;
  const { title, userId, transcript, platform } = req.body;

  try {
    // Create meeting
    const meeting = await prisma.meeting.create({
      data: {
        teamId,
        title: title || 'Uploaded Meeting',
        organizerId: userId,
        platform: platform || 'Upload',
        createdAt: new Date()
      }
    });

    // If transcript provided, parse and store it
    if (transcript) {
      const transcriptLines = parseTranscript(transcript);

      if (transcriptLines.length > 0) {
        await prisma.meetingTranscript.createMany({
          data: transcriptLines.map((line, index) => ({
            meetingId: meeting.id,
            speaker: line.speaker,
            text: line.text,
            startTime: line.startTime || index * 10,
            endTime: line.endTime || (index + 1) * 10
          }))
        });
      }
    }

    res.status(201).json({
      id: meeting.id,
      title: meeting.title,
      createdAt: meeting.createdAt,
      hasTranscript: !!transcript,
      status: transcript ? 'transcribed' : 'pending'
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// Get meeting details with transcript
app.get('/api/meetings/:meetingId', async (req, res) => {
  const { meetingId } = req.params;

  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        transcripts: { orderBy: { startTime: 'asc' } },
        summary: true,
        team: { select: { id: true, name: true } }
      }
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Parse summary JSON if it exists as string
    let parsedSummary = null;
    if (meeting.summary && meeting.summary.summary) {
      try {
        parsedSummary = JSON.parse(meeting.summary.summary);
      } catch (e) {
        parsedSummary = { text: meeting.summary.summary };
      }
    }

    res.json({
      id: meeting.id,
      title: meeting.title,
      teamId: meeting.teamId,
      team: meeting.team,
      scheduledStart: meeting.scheduledStart,
      scheduledEnd: meeting.scheduledEnd,
      platform: meeting.platform,
      organizer: meeting.organizer,
      createdAt: meeting.createdAt,
      transcript: meeting.transcripts.map(t => ({
        id: t.id,
        speaker: t.speaker || 'Unknown',
        text: t.text,
        timestamp: formatTimestamp(t.startTime),
        startTime: t.startTime,
        endTime: t.endTime
      })),
      summary: parsedSummary || meeting.summary, // Return parsed object or original
      hasTranscript: meeting.transcripts.length > 0,
      hasSummary: !!meeting.summary
    });
  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({ error: 'Failed to fetch meeting' });
  }
});

// Update meeting details
app.put('/api/meetings/:meetingId', async (req, res) => {
  const { meetingId } = req.params;
  const { title, scheduledStart, duration, userId, joinUrl, autoJoinEnabled } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { team: { include: { members: true } } }
    });

    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    // Check permission: Organizer OR Team Owner
    const isOrganizer = meeting.organizerId === userId;
    const isTeamOwner = meeting.team?.members.some(m => m.userId === userId && m.role === 'owner');

    if (!isOrganizer && !isTeamOwner) {
      return res.status(403).json({ error: 'Not authorized to edit this meeting' });
    }

    const start = new Date(scheduledStart);
    const end = new Date(start.getTime() + (duration * 60000));

    const updated = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        title,
        scheduledStart: start,
        scheduledEnd: end,
        joinUrl,
        autoJoinEnabled
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

// Delete meeting
app.delete('/api/meetings/:meetingId', async (req, res) => {
  const { meetingId } = req.params;
  const { userId } = req.query;

  if (!userId) return res.status(400).json({ error: 'User ID required' });

  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { team: { include: { members: true } } }
    });

    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    // Check permission: Organizer OR Team Owner
    const isOrganizer = meeting.organizerId === userId;
    const isTeamOwner = meeting.team?.members.some(m => m.userId === userId && m.role === 'owner');

    if (!isOrganizer && !isTeamOwner) {
      return res.status(403).json({ error: 'Not authorized to delete this meeting' });
    }

    // Since we enabled cascade delete in schema, deleting meeting deletes all related data
    await prisma.meeting.delete({
      where: { id: meetingId }
    });

    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// Upload transcript to existing meeting
app.post('/api/meetings/:meetingId/transcript', async (req, res) => {
  const { meetingId } = req.params;
  const { transcript } = req.body;

  if (!transcript) {
    return res.status(400).json({ error: 'Transcript content is required' });
  }

  try {
    // Delete existing transcripts
    await prisma.meetingTranscript.deleteMany({
      where: { meetingId }
    });

    // Parse and store new transcript
    const transcriptLines = parseTranscript(transcript);

    if (transcriptLines.length > 0) {
      await prisma.meetingTranscript.createMany({
        data: transcriptLines.map((line, index) => ({
          meetingId,
          speaker: line.speaker,
          text: line.text,
          startTime: line.startTime || index * 10,
          endTime: line.endTime || (index + 1) * 10
        }))
      });
    }

    res.json({
      message: 'Transcript uploaded successfully',
      lineCount: transcriptLines.length
    });
  } catch (error) {
    console.error('Upload transcript error:', error);
    res.status(500).json({ error: 'Failed to upload transcript' });
  }
});

// Delete a meeting (with all transcripts and summary)
app.delete('/api/meetings/:meetingId', async (req, res) => {
  const { meetingId } = req.params;
  const { userId } = req.query;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(meetingId)) {
    return res.status(400).json({ error: 'Invalid meeting ID' });
  }

  try {
    // Get meeting to check ownership
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { team: { include: { members: true } } }
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Check if user is organizer or team owner
    const isOrganizer = meeting.organizerId === userId;
    const isTeamOwner = meeting.team?.members.some(m => m.userId === userId && m.role === 'owner');

    if (!isOrganizer && !isTeamOwner) {
      return res.status(403).json({ error: 'Only the organizer or team owner can delete this meeting' });
    }

    // Delete in order (due to foreign keys)
    await prisma.meetingTranscript.deleteMany({ where: { meetingId } });
    await prisma.meetingSummary.deleteMany({ where: { meetingId } });
    await prisma.task.deleteMany({ where: { meetingId } });
    await prisma.meetingParticipant.deleteMany({ where: { meetingId } });
    await prisma.meetingAudio.deleteMany({ where: { meetingId } });
    await prisma.meeting.delete({ where: { id: meetingId } });

    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// ============================================
// Helper Functions
// ============================================

/**
 * Parse transcript text into structured format
 * Supports formats:
 * - "Speaker: text"
 * - "[00:00:00] Speaker: text"
 * - "Speaker (00:00:00): text"
 */
function parseTranscript(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const parsed = [];

  for (const line of lines) {
    // Try format: [00:00:00] Speaker: text
    let match = line.match(/^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*([^:]+):\s*(.+)/);

    if (match) {
      const [, timestamp, speaker, text] = match;
      parsed.push({
        speaker: speaker.trim(),
        text: text.trim(),
        startTime: parseTimestamp(timestamp)
      });
      continue;
    }

    // Try format: Speaker: text (no timestamp)
    match = line.match(/^([^:]+):\s*(.+)/);
    if (match) {
      const [, speaker, text] = match;
      // Skip if speaker looks like a timestamp
      if (!/^\d/.test(speaker)) {
        parsed.push({
          speaker: speaker.trim(),
          text: text.trim()
        });
        continue;
      }
    }

    // If no match and we have previous entries, append to last
    if (parsed.length > 0 && line.trim()) {
      parsed[parsed.length - 1].text += ' ' + line.trim();
    } else if (line.trim()) {
      // Standalone line without speaker
      parsed.push({
        speaker: 'Unknown',
        text: line.trim()
      });
    }
  }

  return parsed;
}

function parseTimestamp(timestamp) {
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

function formatTimestamp(seconds) {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generate a random 8-character invite code
 */
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars: 0,O,1,I
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
