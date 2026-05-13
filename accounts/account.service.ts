import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import db from '../_helpers/db';
import { sendEmail } from '../_helpers/send-email';

const jwtSecret = process.env.JWT_SECRET || 'uc_auth_secret_123456';
const frontendUrl =
    process.env.FRONTEND_URL ||
    process.env.CORS_ORIGIN ||
    'http://localhost:4200';

export default {
    authenticate,
    refreshToken,
    revokeToken,
    register,
    verifyEmail,
    forgotPassword,
    validateResetToken,
    resetPassword,
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

async function authenticate({ email, password, ipAddress }: any) {
    const account = await db.Account.scope('withHash').findOne({
        where: { email }
    });

    if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
        throw 'Email or password is incorrect';
    }

    if (!account.verified) {
        throw 'Please verify your email before logging in';
    }

    const jwtToken = generateJwtToken(account);
    const refreshToken = generateRefreshToken(account, ipAddress);

    await refreshToken.save();

    return {
        ...basicDetails(account),
        jwtToken,
        refreshToken: refreshToken.token
    };
}

async function refreshToken({ token, ipAddress }: any) {
    if (!token) {
        throw 'Unauthorized';
    }

    const oldRefreshToken = await getRefreshToken(token);
    const account = await oldRefreshToken.getAccount();

    const newRefreshToken = generateRefreshToken(account, ipAddress);

    oldRefreshToken.revoked = new Date();
    oldRefreshToken.revokedByIp = ipAddress;
    oldRefreshToken.replacedByToken = newRefreshToken.token;

    await oldRefreshToken.save();
    await newRefreshToken.save();

    return {
        ...basicDetails(account),
        jwtToken: generateJwtToken(account),
        refreshToken: newRefreshToken.token
    };
}

async function revokeToken({ token, ipAddress }: any) {
    if (!token) return;

    const refreshToken = await getRefreshToken(token);

    refreshToken.revoked = new Date();
    refreshToken.revokedByIp = ipAddress;

    await refreshToken.save();
}

async function register(params: any, origin: string) {
  if (await db.Account.findOne({ where: { email: params.email } })) {
    throw 'Email "' + params.email + '" is already registered';
  }

  const accountCount = await db.Account.count();
  const isFirstAccount = accountCount === 0;

  const account = new db.Account(params);

  account.role = isFirstAccount ? 'Admin' : 'User';
  account.created = new Date();

  if (params.password) {
    account.passwordHash = await hash(params.password);
  }

  if (isFirstAccount) {
    account.verified = new Date();
    account.verificationToken = null;
  } else {
    account.verified = null;
    account.verificationToken = randomTokenString();
  }

  await account.save();

try {
  await sendVerificationEmail(account);
} catch (error) {
  console.error('Verification email failed:', error);
}

return {
  message: 'Registration successful. Please check your email for verification instructions.'
};
}

async function verifyEmail({ token }: any) {
    const account = await db.Account.findOne({
        where: { verificationToken: token }
    });

    if (!account) {
        throw 'Verification failed';
    }

    account.verified = new Date();
    account.verificationToken = null;
    account.acceptTerms = true;

    await account.save();

    return {
        message: 'Verification successful. You can now log in.'
    };
}

async function forgotPassword({ email }: any, origin: string) {
    email = String(email).trim().toLowerCase();

    const account = await db.Account.findOne({
        where: { email }
    });

    if (!account) return;

    account.resetToken = randomTokenString();
    account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await account.save();

    await sendPasswordResetEmail(account);
}

async function validateResetToken({ token }: any) {
    const account = await db.Account.findOne({
        where: { resetToken: token }
    });

    if (!account || !account.resetTokenExpires || new Date() > account.resetTokenExpires) {
        throw 'Invalid token';
    }

    return {
        message: 'Token is valid'
    };
}

async function resetPassword({ token, password }: any) {
    const account = await db.Account.findOne({
        where: { resetToken: token }
    });

    if (!account || !account.resetTokenExpires || new Date() > account.resetTokenExpires) {
        throw 'Invalid token';
    }

    account.passwordHash = await hash(password);
    account.passwordReset = new Date();
    account.resetToken = null;
    account.resetTokenExpires = null;

    await account.save();

    return {
        message: 'Password reset successful. You can now log in.'
    };
}

async function getAll() {
    const accounts = await db.Account.findAll({
        order: [['id', 'ASC']]
    });

    return accounts.map((x: any) => basicDetails(x));
}

async function getById(id: number) {
    const account = await getAccount(id);
    return basicDetails(account);
}

async function create(params: any) {
    const email = String(params.email).trim().toLowerCase();

    if (await db.Account.findOne({ where: { email } })) {
        throw `Email "${email}" is already registered`;
    }

    const account = new db.Account({
        title: params.title,
        firstName: params.firstName,
        lastName: params.lastName,
        email,
        role: params.role || 'User',
        acceptTerms:
            params.acceptTerms === true ||
            params.acceptTerms === 1 ||
            params.acceptTerms === '1',
        verified: new Date(),
        verificationToken: null,
        passwordHash: await hash(params.password)
    });

    await account.save();

    return basicDetails(account);
}

async function update(id: number, params: any) {
    const account = await getAccount(id);

    if (params.email) {
        params.email = String(params.email).trim().toLowerCase();
    }

    const emailChanged = params.email && account.email !== params.email;

    if (
        emailChanged &&
        await db.Account.findOne({ where: { email: params.email } })
    ) {
        throw `Email "${params.email}" is already registered`;
    }

    Object.assign(account, params);

    if (params.password) {
        account.passwordHash = await hash(params.password);
    }

    if (params.acceptTerms !== undefined) {
        account.acceptTerms =
            params.acceptTerms === true ||
            params.acceptTerms === 1 ||
            params.acceptTerms === '1';
    }

    await account.save();

    return basicDetails(account);
}

async function _delete(id: number) {
    const account = await getAccount(id);
    await account.destroy();
}

async function getAccount(id: number) {
    const account = await db.Account.findByPk(id);

    if (!account) {
        throw 'Account not found';
    }

    return account;
}

async function getRefreshToken(token: string) {
    if (!token) {
        throw 'Refresh token is required';
    }

    const refreshToken = await db.RefreshToken.findOne({
        where: { token }
    });

    if (!refreshToken || !refreshToken.isActive) {
        throw 'Invalid token';
    }

    return refreshToken;
}

async function hash(password: string) {
    return await bcrypt.hash(password, 10);
}

function generateJwtToken(account: any) {
    return jwt.sign(
        {
            sub: account.id,
            id: account.id,
            role: account.role
        },
        jwtSecret,
        { expiresIn: '15m' }
    );
}

function generateRefreshToken(account: any, ipAddress: string) {
    return new db.RefreshToken({
        accountId: account.id,
        token: randomTokenString(),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdByIp: ipAddress
    });
}

function randomTokenString() {
    return crypto.randomBytes(40).toString('hex');
}

function basicDetails(account: any) {
    const { id, title, firstName, lastName, email, role, created, updated, isVerified } = account;
    return { id, title, firstName, lastName, email, role, created, updated, isVerified };
}

async function sendVerificationEmail(account: any) {
  const verifyUrl = `${process.env.FRONTEND_URL}/account/verify-email?token=${account.verificationToken}`;

  const message = `
    <p>Please click the link below to verify your email:</p>
    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
  `;

  await sendEmail({
    to: account.email,
    subject: 'Verify Email',
    html: message
  });
}
async function sendAlreadyRegisteredEmail(email: string) {
    const message = `
        <p>Your email <strong>${email}</strong> is already registered.</p>
        <p>If you do not know your password, please visit the forgot password page:</p>
        <p><a href="${frontendUrl}/account/forgot-password">${frontendUrl}/account/forgot-password</a></p>
    `;

    await sendEmail({
        to: email,
        subject: 'Sign-up Verification API - Email Already Registered',
        html: `<h4>Email Already Registered</h4>${message}`
    });
}

async function sendPasswordResetEmail(account: any) {
    const resetUrl = `${frontendUrl}/account/reset-password?token=${account.resetToken}`;

    const message = `
        <p>Please click the link below to reset your password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
    `;

    await sendEmail({
        to: account.email,
        subject: 'Sign-up Verification API - Reset Password',
        html: `<h4>Reset Password Email</h4>${message}`
    });
}