import { DataTypes } from 'sequelize';

export default function AccountModel(sequelize: any) {
  const Account = sequelize.define('Account', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    acceptTerms: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false
    },
    verificationToken: {
      type: DataTypes.STRING
    },
    verified: {
      type: DataTypes.DATE
    },
    resetToken: {
      type: DataTypes.STRING
    },
    resetTokenExpires: {
      type: DataTypes.DATE
    },
    passwordReset: {
      type: DataTypes.DATE
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated: {
      type: DataTypes.DATE
    }
  }, {
    defaultScope: {
      attributes: { exclude: ['passwordHash'] }
    },
    scopes: {
      withHash: {
        attributes: {}
      }
    }
  });

  return Account;
}