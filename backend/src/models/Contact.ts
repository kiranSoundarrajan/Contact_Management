// models/Contact.ts - CORRECTED VERSION
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import User from "./User";

interface ContactAttributes {
  id: number;
  name: string;
  email: string;
  place: string;
  dob: Date;
  userId: number;
  // DON'T define createdAt/updatedAt here
}

interface ContactCreationAttributes extends Optional<ContactAttributes, "id"> {}

class Contact extends Model<ContactAttributes, ContactCreationAttributes> implements ContactAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public place!: string;
  public dob!: Date;
  public userId!: number;
  
  // Sequelize will add these automatically
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Contact.init(
  {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    name: { 
      type: DataTypes.STRING(255), 
      allowNull: false 
    },
    email: { 
      type: DataTypes.STRING(255), 
      allowNull: false, 
      validate: { 
        isEmail: true 
      } 
    },
    place: { 
      type: DataTypes.STRING(255), 
      allowNull: false 
    },
    dob: { 
      type: DataTypes.DATEONLY, 
      allowNull: false 
    },
    userId: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      references: { 
        model: User, 
        key: "id" 
      } 
    }
    // REMOVE createdAt and updatedAt from here
  },
  { 
    sequelize, 
    tableName: "Contacts", 
    timestamps: true // This adds createdAt/updatedAt automatically
  }
);

export default Contact;