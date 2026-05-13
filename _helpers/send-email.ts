import nodemailer from 'nodemailer';

export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.EMAIL_FROM || 'Admin <admin@test.com>'
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
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

  console.log('Verification email sent:', info.messageId);
  console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

  return info;
}