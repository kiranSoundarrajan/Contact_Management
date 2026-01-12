

import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, "id" | "role"> {}

// 🔹 FIX: Remove public class field declarations, just use the Model
class User extends Model<UserAttributes, UserCreationAttributes> {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
     
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "user",
    },
  },
  {
    sequelize,
    tableName: "Users",
    timestamps: true,
  }
);

export default User;