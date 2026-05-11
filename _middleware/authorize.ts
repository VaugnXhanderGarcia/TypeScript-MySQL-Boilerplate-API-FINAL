import { Request, Response, NextFunction } from 'express';
import { expressjwt } from 'express-jwt';

import db from '../_helpers/db';

export default authorize;

function authorize(roles: string | string[] = []) {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET is missing in .env file');
    }

    return [
        expressjwt({
            secret,
            algorithms: ['HS256']
        }),

        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const auth = (req as any).auth;

                if (!auth || !auth.sub) {
                    return res.status(401).json({ message: 'Unauthorized' });
                }

                const account = await db.Account.findByPk(auth.sub);

                if (!account) {
                    return res.status(401).json({ message: 'Unauthorized' });
                }

                if (roles.length && !roles.includes(account.role)) {
                    return res.status(401).json({ message: 'Unauthorized' });
                }

                (req as any).user = account;

                next();
            } catch (error) {
                next(error);
            }
        }
    ];
}