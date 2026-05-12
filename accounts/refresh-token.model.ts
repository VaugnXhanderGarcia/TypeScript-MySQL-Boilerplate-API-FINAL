import { DataTypes, Sequelize } from 'sequelize';

export default function RefreshTokenModel(sequelize: Sequelize) {
    const attributes = {
        token: {
            type: DataTypes.STRING,
            allowNull: false
        },
        expires: {
            type: DataTypes.DATE,
            allowNull: false
        },
        created: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        createdByIp: {
            type: DataTypes.STRING,
            allowNull: true
        },
        revoked: {
            type: DataTypes.DATE,
            allowNull: true
        },
        revokedByIp: {
            type: DataTypes.STRING,
            allowNull: true
        },
        replacedByToken: {
            type: DataTypes.STRING,
            allowNull: true
        }
    };

    return sequelize.define('RefreshToken', attributes, {
    tableName: 'refresh_tokens',
    timestamps: true
});
}