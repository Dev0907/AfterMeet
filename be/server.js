
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { generateOtp, sendOtpEmail } = require('./services/emailService');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// OTP expiry time in minutes
const OTP_EXPIRY_MINUTES = 10;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running in Neobrutalist mode' });
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
