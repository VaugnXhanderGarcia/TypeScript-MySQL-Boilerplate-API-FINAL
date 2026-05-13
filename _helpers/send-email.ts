import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html, from }: any) {
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
    from: from || process.env.EMAIL_FROM,
    to,
    subject,
    html
  });

  console.log('Email sent:', info.messageId);
  console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

  return info;
}