import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../app.js';
import { generateOTP, generateResetToken, sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../services/email.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// Signup - Create user and send OTP
router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create user with unverified status
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                emailVerified: false
            },
        });

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP in user.verificationToken (simple approach)
        await prisma.user.update({
            where: { id: user.id },
            data: { verificationToken: otp },
        });

        // Send verification email
        await sendVerificationEmail(email, otp);

        res.json({
            message: 'Verification email sent. Please check your inbox.',
            email: user.email
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Server error during signup'
        });
    }
});

// Verify Email with OTP
router.post('/verify-email', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: 'User not found' });

        // Find valid OTP
        // Verify OTP against stored token on user
        const userWithToken = await prisma.user.findUnique({
            where: { email },
            select: { verificationToken: true },
        });
        if (!userWithToken || userWithToken.verificationToken !== otp) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }



        // Mark as verified
        // Mark email as verified and clear token
        await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: true, verificationToken: null },
        });

        // Send welcome email (non-blocking)
        sendWelcomeEmail(email).catch(err => console.error('Welcome email error:', err));

        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token,
            user: { id: user.id, email: user.email, emailVerified: true },
            message: 'Email verified successfully!'
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Server error during verification' });
    }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: 'User not found' });

        if (user.emailVerified) {
            return res.status(400).json({ error: 'Email already verified' });
        }

        // Generate new OTP and store on user
        const otp = generateOTP();
        await prisma.user.update({
            where: { id: user.id },
            data: { verificationToken: otp },
        });

        // Send email
        await sendVerificationEmail(email, otp);

        res.json({ message: 'New verification code sent to your email' });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login - Check email verification
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        // Check if email is verified
        // if (!user.emailVerified) {
        //     return res.status(403).json({
        //         error: 'Email not verified',
        //         code: 'EMAIL_NOT_VERIFIED',
        //         email: user.email
        //     });
        // }

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, email: user.email, emailVerified: user.emailVerified } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Forgot Password - Send reset link
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

        const user = await prisma.user.findUnique({ where: { email } });

        // Always return success to prevent user enumeration
        if (!user) {
            return res.json({ message: 'If an account exists, a password reset link has been sent' });
        }

        // Generate reset token and store on user
        const resetToken = generateResetToken();
        await prisma.user.update({
            where: { id: user.id },
            data: { verificationToken: resetToken },
        });

        // Send reset email
        await sendPasswordResetEmail(email, resetToken);

        res.json({ message: 'If an account exists, a password reset link has been sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reset Password with token
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password required' });
        }

        // Find valid reset token
        // Verify reset token against user's verificationToken
        const user = await prisma.user.findFirst({
            where: { verificationToken: token },
            select: { id: true, verificationToken: true },
        });
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear token
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword, verificationToken: null },
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;

