import nodemailer from 'nodemailer';

export default sendEmail;

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function getSmtpOptions() {
  const host = getRequiredEnv('SMTP_HOST');
  const user = getRequiredEnv('SMTP_USER');
  const pass = getRequiredEnv('SMTP_PASS');

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true';

  return {
    host,
    port,
    secure,
    auth: {
      user,
      pass
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000
  };
}

async function sendEmail({ to, subject, html, from }: any) {
  const transporter = nodemailer.createTransport(getSmtpOptions());

  try {
    await transporter.verify();

    await transporter.sendMail({
      from: from || getRequiredEnv('EMAIL_FROM'),
      to,
      subject,
      html
    });

    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Email sending failed:');
    console.error(error);
    throw error;
  }
}