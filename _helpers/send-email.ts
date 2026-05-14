import nodemailer from 'nodemailer';

export default sendEmail;

function getEmailFrom() {
    const emailFrom = process.env.EMAIL_FROM;

    if (!emailFrom) {
        throw 'EMAIL_FROM is required';
    }

    return emailFrom;
}

function getSmtpOptions() {
    if (!process.env.SMTP_HOST) {
        throw 'SMTP_HOST is required';
    }

    return {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000
    };
}

async function sendEmail({ to, subject, html, from }: any) {
    const transporter = nodemailer.createTransport(getSmtpOptions());

    await transporter.verify();

    await transporter.sendMail({
        from: from || getEmailFrom(),
        to,
        subject,
        html
    });
}