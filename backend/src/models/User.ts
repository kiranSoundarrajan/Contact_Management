import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import bcrypt from "bcryptjs";   

interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> 
  implements UserAttributes {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public role!: 'user' | 'admin';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public async checkPassword(password: string): Promise<boolean> {
    console.log(`\n🔐 User.checkPassword() called`);
    console.log(`   Email: ${this.email}`);
    console.log(`   Input password: ${password}`);
    console.log(`   Stored hash prefix: ${this.password.substring(0, 30)}...`);
    
    try {
      const result = await bcrypt.compare(password, this.password);
      console.log(`   bcrypt.compare result: ${result}`);
      return result;
    } catch (error: any) {
      console.error(`   ❌ bcrypt.compare ERROR:`, error.message);
      return false;
    }
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 100]
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 255]
      }
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "Users",
    timestamps: true,
    modelName: "User",
    hooks: {
      beforeCreate: async (user: User) => {
        console.log(`🔐 Hashing password for new user: ${user.email}`);
        console.log(`   Plain password: ${user.password}`);
        
        // Always hash the password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        
        console.log(`✅ Password hashed for ${user.email}`);
        console.log(`   Hashed password: ${user.password.substring(0, 30)}...`);
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          console.log(`🔐 Re-hashing password for update: ${user.email}`);
          
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
          
          console.log(`✅ Password re-hashed for ${user.email}`);
        }
      }
    },
    indexes: [
      {
        fields: ['email'],
        unique: true
      },
      {
        fields: ['username'],
        unique: true
      }
    ]
  }
);

export default User;