const nodemailer = require('nodemailer');

// Check if email credentials are configured
const isEmailConfigured = process.env.MAILER_MAIL && process.env.MAILER_SECRET;

// Create transporter with SMTP config from environment
let transporter = null;

if (isEmailConfigured) {
    transporter = nodemailer.createTransport({
        host: process.env.MAILER_HOST || 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.MAILER_MAIL,
            pass: process.env.MAILER_SECRET,
        },
    });
    console.log('✅ Email service configured with:', process.env.MAILER_MAIL);
} else {
    console.log('⚠️  Email service NOT configured. OTP codes will be logged to console.');
    console.log('   To enable email, add MAILER_MAIL and MAILER_SECRET to .env');
}

/**
 * Generate a 6-digit OTP code
 */
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP verification email
 */
async function sendOtpEmail(email, otpCode, userName = '') {
    // If email not configured, just log the OTP (development mode)
    if (!isEmailConfigured || !transporter) {
        console.log('');
        console.log('═══════════════════════════════════════════');
        console.log('📧 OTP CODE (Email not configured)');
        console.log('═══════════════════════════════════════════');
        console.log(`   Email: ${email}`);
        console.log(`   OTP:   ${otpCode}`);
        console.log('═══════════════════════════════════════════');
        console.log('');
        return { success: true, messageId: 'console-log', dev: true };
    }

    const mailOptions = {
        from: `"${process.env.MAILER_NAME || 'AfterMeet'}" <${process.env.MAILER_MAIL}>`,
        to: email,
        subject: 'Verify Your AfterMeet Account',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Arial', sans-serif; background: #FFFDF7; padding: 20px; }
                    .container { max-width: 500px; margin: 0 auto; background: white; border: 4px solid black; padding: 30px; }
                    .header { background: #FFD93D; border: 4px solid black; padding: 20px; margin: -30px -30px 20px; text-align: center; }
                    h1 { font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; }
                    .otp-box { background: #A0C4FF; border: 4px solid black; padding: 20px; text-align: center; margin: 20px 0; }
                    .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; font-family: monospace; }
                    .message { font-size: 16px; line-height: 1.6; }
                    .footer { font-size: 12px; color: #666; margin-top: 20px; text-align: center; border-top: 2px solid black; padding-top: 15px; }
                    .warning { background: #FFB3C6; border: 2px solid black; padding: 10px; font-size: 13px; margin-top: 15px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎯 AfterMeet</h1>
                    </div>
                    <p class="message">Hi ${userName || 'there'}!</p>
                    <p class="message">Use the following code to verify your email address:</p>
                    <div class="otp-box">
                        <span class="otp-code">${otpCode}</span>
                    </div>
                    <p class="message">This code expires in <strong>10 minutes</strong>.</p>
                    <div class="warning">
                        ⚠️ If you didn't request this code, please ignore this email.
                    </div>
                    <div class="footer">
                        <p>Meeting Intelligence Platform</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('OTP email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending OTP email:', error);
        // In case of email failure, log OTP to console as fallback
        console.log('');
        console.log('═══════════════════════════════════════════');
        console.log('📧 OTP CODE (Email send failed)');
        console.log('═══════════════════════════════════════════');
        console.log(`   Email: ${email}`);
        console.log(`   OTP:   ${otpCode}`);
        console.log('═══════════════════════════════════════════');
        console.log('');
        // Don't throw - return success so signup continues
        return { success: true, messageId: 'console-fallback', dev: true };
    }
}

module.exports = {
    generateOtp,
    sendOtpEmail,
};
