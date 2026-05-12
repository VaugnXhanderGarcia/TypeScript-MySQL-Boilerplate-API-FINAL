import { Sequelize } from 'sequelize';
import AccountModel from '../accounts/account.model';
import RefreshTokenModel from '../accounts/refresh-token.model';

const db: any = {};

export default db;

export async function initialize() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing in .env');
  }

  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });

  db.Account = AccountModel(sequelize);
  db.RefreshToken = RefreshTokenModel(sequelize);

  db.Account.hasMany(db.RefreshToken, {
    foreignKey: 'accountId',
    onDelete: 'CASCADE'
  });

  db.RefreshToken.belongsTo(db.Account, {
    foreignKey: 'accountId'
  });

  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  console.log('Supabase PostgreSQL connected and synced');
}