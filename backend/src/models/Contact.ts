import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import User from "./User";

// Define attributes
interface ContactAttributes {
  id: number;
  name: string;
  email: string;
  place: string;
  dob: Date; // Changed from string to Date
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define creation attributes (for creating new records)
interface ContactCreationAttributes extends Optional<ContactAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Contact extends Model<ContactAttributes, ContactCreationAttributes> 
  implements ContactAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public place!: string;
  public dob!: Date; // Changed to Date
  public userId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Contact.init(
  {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: { 
      type: DataTypes.STRING(255), 
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    email: { 
      type: DataTypes.STRING(255), 
      allowNull: false,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    place: { 
      type: DataTypes.STRING(255), 
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    dob: { 
      type: DataTypes.DATEONLY, // Changed to DATEONLY (stores only date, no time)
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    userId: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
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
    tableName: "Contacts", 
    timestamps: true,
    modelName: "Contact",
    // Add indexes for better performance
    indexes: [
      {
        fields: ['userId'] // Index for foreign key
      },
      {
        fields: ['email'] // Index for email lookups
      }
    ]
  }
);

// Relations - Move these to a separate file or ensure they're not duplicated
// Recommended: Create an associations file

export default Contact;