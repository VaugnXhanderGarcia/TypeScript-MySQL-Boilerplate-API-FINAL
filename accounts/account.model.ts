import { DataTypes } from 'sequelize';

export default function model(sequelize: any) {
  const attributes = {
    title: { type: DataTypes.STRING, allowNull: false },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    acceptTerms: { type: DataTypes.BOOLEAN, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false },
    verificationToken: { type: DataTypes.STRING },
    verified: { type: DataTypes.DATE },
    resetToken: { type: DataTypes.STRING },
    resetTokenExpires: { type: DataTypes.DATE },
    passwordReset: { type: DataTypes.DATE },
    created: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated: { type: DataTypes.DATE }
  };

  const options = {
    defaultScope: {
      attributes: { exclude: ['passwordHash'] }
    },
    scopes: {
      withHash: {
        attributes: {}
      }
    }
  };

  return sequelize.define('Account', attributes, options);
}