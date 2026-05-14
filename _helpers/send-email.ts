import nodemailer from 'nodemailer';

export default async function sendEmail({
  to,
  subject,
  html,
  from = process.env.EMAIL_FROM || 'Account System <no-reply@test.com>'
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);

  if (previewUrl) {
    console.log('Ethereal preview URL:', previewUrl);
  }

  return info;
}