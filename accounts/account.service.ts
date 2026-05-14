import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import db from '../_helpers/db';
import sendEmail from '../_helpers/send-email';
import Role from '../_helpers/role';

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

    if (!account) {
        throw 'Email or password is incorrect';
    }

    if (!account.verified) {
        throw 'Please verify your email before logging in';
    }

    const passwordValid = await bcrypt.compare(password, account.passwordHash);

    if (!passwordValid) {
        throw 'Email or password is incorrect';
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

async function register(params: any, origin: any) {
    params.email = String(params.email).trim().toLowerCase();

    if (await db.Account.findOne({ where: { email: params.email } })) {
        throw 'Email "' + params.email + '" is already registered';
    }

    const account = new db.Account(params);

    const isFirstAccount = (await db.Account.count()) === 0;
    account.role = isFirstAccount ? Role.Admin : Role.User;

    account.verificationToken = randomTokenString();
    account.verified = null;

    account.passwordHash = await hash(params.password);

    await account.save();

    await sendVerificationEmail(account);

    return {
        message: 'Registration successful, please check your email to verify your account.'
    };
}

async function verifyEmail({ token }: any) {
    const account = await db.Account.findOne({
        where: { verificationToken: token }
    });

    if (!account) {
        throw 'Verification failed. Token is invalid or already used.';
    }

    account.verified = new Date();
    account.verificationToken = null;

    await account.save();
}

async function forgotPassword({ email }: any, origin: any) {
    email = String(email).trim().toLowerCase();

    const account = await db.Account.findOne({ where: { email } });

    if (!account) {
        throw 'Account does not exist';
    }

    account.resetToken = randomTokenString();
    account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await account.save();

    await sendPasswordResetEmail(account, origin);

    return {
        message: 'Please check your email for password reset instructions.'
    };
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
        <h3>Verify Email</h3>
        <p>Thank you for registering.</p>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="${verifyUrl}">Verify Email</a></p>
        <p>If the link does not work, copy and paste this URL:</p>
        <p>${verifyUrl}</p>
    `;

    await sendEmail({
        to: account.email,
        subject: 'Verify your email address',
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

async function sendPasswordResetEmail(account: any, origin: any) {
    const frontendUrl = process.env.FRONTEND_URL || origin;

    if (!frontendUrl) {
        throw 'FRONTEND_URL is required for password reset email';
    }

const resetUrl = `${process.env.FRONTEND_URL}/account/reset-password?token=${account.resetToken}`;

    await sendEmail({
        to: account.email,
        subject: 'Reset your password',
        html: `
            <h3>Reset Password</h3>
            <p>Please click the link below to reset your password.</p>
            <p>This link is valid for 24 hours.</p>
            <p>
                <a href="${resetUrl}">Reset Password</a>
            </p>
            <p>If the button does not work, copy and paste this link:</p>
            <p>${resetUrl}</p>
        `
    });
}