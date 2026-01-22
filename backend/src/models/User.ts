import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import bcrypt from "bcryptjs";

interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  role: "user" | "admin";
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, "id" | "createdAt" | "updatedAt"> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public role!: "user" | "admin";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  async checkPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(100), allowNull: false, unique: true, validate: { notEmpty: true, len: [3, 100] } },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true, notEmpty: true } },
    password: { type: DataTypes.STRING(255), allowNull: false, validate: { notEmpty: true, len: [6, 255] } },
    role: { type: DataTypes.ENUM("user", "admin"), allowNull: false, defaultValue: "user" },
  },
  {
    sequelize,
    tableName: "Users",
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => { user.password = await bcrypt.hash(user.password, 10); },
      beforeUpdate: async (user) => { if (user.changed("password")) user.password = await bcrypt.hash(user.password, 10); },
    },
  }
);

export default User;
