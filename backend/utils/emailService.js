import nodemailer from 'nodemailer';

// ============================================
// EMAIL UTILITY
// ============================================
// This module creates a single shared email transporter.
//
// HOW IT WORKS:
// - If EMAIL_USER & EMAIL_PASSWORD are set in .env → uses real Gmail/SMTP
// - Otherwise → auto-creates an Ethereal test account (FREE, no signup)
//   Ethereal captures emails at https://ethereal.email so you can view them
//   without actually delivering to real inboxes. Perfect for development.
//
// The SENDER email is the system's email (not the participant's).
// We send TO the participant's email. We never need their password.
// ============================================

let transporter = null;
let etherealAccount = null;

/**
 * Get or create the email transporter (singleton)
 */
export const getTransporter = async () => {
    if (transporter) return transporter;

    // Option 1: Real SMTP credentials from .env
    if (
        process.env.EMAIL_USER &&
        process.env.EMAIL_PASSWORD &&
        process.env.EMAIL_USER !== 'your_email@gmail.com'
    ) {
        transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        console.log('✅ Email: using real SMTP via', process.env.EMAIL_SERVICE || 'gmail');
        return transporter;
    }

    // Option 2: Auto-generated Ethereal test account (no config needed!)
    try {
        etherealAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: etherealAccount.user,
                pass: etherealAccount.pass,
            },
        });
        console.log('✅ Email: using Ethereal test account');
        console.log('   📧 View sent emails at: https://ethereal.email');
        console.log(`   👤 User: ${etherealAccount.user}`);
        console.log(`   🔑 Pass: ${etherealAccount.pass}`);
        return transporter;
    } catch (err) {
        console.error('⚠️  Failed to create Ethereal account, falling back to console logging');
        // Fallback: just log
        transporter = {
            sendMail: async (options) => {
                console.log('📧 [EMAIL LOG] To:', options.to);
                console.log('📧 [EMAIL LOG] Subject:', options.subject);
                return { messageId: 'console-' + Date.now() };
            },
        };
        return transporter;
    }
};

/**
 * Send an email. Automatically initializes transporter if needed.
 * Returns the preview URL for Ethereal emails.
 */
export const sendEmail = async (mailOptions) => {
    try {
        const t = await getTransporter();

        // Set default from address
        if (!mailOptions.from) {
            mailOptions.from =
                process.env.EMAIL_FROM ||
                process.env.EMAIL_USER ||
                (etherealAccount ? etherealAccount.user : 'felicity@event.com');
        }

        const info = await t.sendMail(mailOptions);
        console.log(`✅ Email sent to ${mailOptions.to} — Message ID: ${info.messageId}`);

        // If using Ethereal, log the preview URL so you can view the email in browser
        if (etherealAccount) {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log(`   🔗 Preview: ${previewUrl}`);
            }
        }

        return info;
    } catch (error) {
        console.error(`❌ Failed to send email to ${mailOptions.to}:`, error.message);
        // Don't throw — registration should succeed even if email fails
        return null;
    }
};

export default { getTransporter, sendEmail };
