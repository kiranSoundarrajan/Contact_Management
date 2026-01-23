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

interface UserCreationAttributes
  extends Optional<UserAttributes, "id" | "createdAt" | "updatedAt"> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public role!: "user" | "admin";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: "Username cannot be empty" },
        len: { args: [3, 100], msg: "Username must be between 3 and 100 characters" },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: { name: "email", msg: "Email already exists" },
      validate: {
        isEmail: { msg: "Please provide a valid email address" },
        notEmpty: { msg: "Email cannot be empty" },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Password cannot be empty" },
        len: { args: [6, 255], msg: "Password must be at least 6 characters" },
      },
    },
    role: {
      type: DataTypes.ENUM("user", "admin"),
      allowNull: false,
      defaultValue: "user",
    },
  },
  {
    sequelize,
    tableName: "Users",
    timestamps: true,

    hooks: {
      beforeSave: async (user: User) => {
        console.log(`🔐 User model beforeSave hook triggered`);

        // ✅ Hash only when password changes
        if (user.changed("password")) {
          console.log(`   Password changed`);
          if (!user.password.startsWith("$2")) {
            user.password = await bcrypt.hash(user.password, 10);
            console.log(`   Hashed to: ${user.password.substring(0, 30)}...`);
          }
        }

        // ✅ Normalize role safely
        if (user.changed("role") && user.role) {
          user.role = user.role.toLowerCase() as "user" | "admin";
        }
      },
    },
  }
);

export default User;
