import nodemailer from 'nodemailer';

export default sendEmail;

async function sendEmail({ to, subject, html }: any) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.EMAIL_FROM || user;

    if (!host || !user || !pass) {
        throw new Error('SMTP settings are missing. Check SMTP_HOST, SMTP_USER, and SMTP_PASS.');
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user,
            pass
        }
    });

    const info = await transporter.sendMail({
        from,
        to,
        subject,
        html
    });

    console.log('Email sent:', info.messageId);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
        console.log('Ethereal preview URL:', previewUrl);
    }
}