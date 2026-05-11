import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import AccountModel from '../accounts/account.model';
import RefreshTokenModel from '../accounts/refresh-token.model';

const db: any = {};

export default db;

export async function initialize() {
    const host = process.env.DB_HOST as string;
    const port = Number(process.env.DB_PORT || 3306);
    const user = process.env.DB_USER as string;
    const password = process.env.DB_PASSWORD as string;
    const database = process.env.DB_NAME as string;
    const useSsl = process.env.DB_SSL === 'true';

    if (!host || !user || !password || !database) {
        throw new Error('Missing database environment variables');
    }

    // Test connection only
    const connection = await mysql.createConnection({
        host,
        port,
        user,
        password,
        database,
        ssl: useSsl
            ? {
                  rejectUnauthorized: false
              }
            : undefined
    });

    await connection.ping();
    await connection.end();

    const sequelize = new Sequelize(database, user, password, {
        host,
        port,
        dialect: 'mysql',
        logging: console.log,
        dialectOptions: useSsl
            ? {
                  ssl: {
                      rejectUnauthorized: false
                  }
              }
            : {}
    });

    db.Account = AccountModel(sequelize);
    db.RefreshToken = RefreshTokenModel(sequelize);

    db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
    db.RefreshToken.belongsTo(db.Account);

    await sequelize.sync({ alter: true });

    console.log('Database connected and synced');
}