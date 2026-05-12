import { DataTypes, Sequelize } from 'sequelize';

export default function AccountModel(sequelize: Sequelize) {
    const attributes = {
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        passwordHash: {
            type: DataTypes.STRING,
            allowNull: false
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
        acceptTerms: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'User'
        },
        verificationToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        verified: {
            type: DataTypes.DATE,
            allowNull: true
        },
        resetToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        resetTokenExpires: {
            type: DataTypes.DATE,
            allowNull: true
        },
        passwordReset: {
            type: DataTypes.DATE,
            allowNull: true
        },
        created: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updated: {
            type: DataTypes.DATE,
            allowNull: true
        }
    };

   return sequelize.define('Account', attributes, {
        tableName: 'accounts',
        timestamps: true
    });
}