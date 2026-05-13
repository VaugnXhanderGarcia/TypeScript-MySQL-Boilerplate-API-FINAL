import nodemailer from 'nodemailer';

export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.EMAIL_FROM
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
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

  console.log('Email sent:', info.messageId);
  console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
}