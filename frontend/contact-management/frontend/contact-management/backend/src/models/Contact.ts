import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";
import User from "./User";

interface ContactAttributes {
  id?: number;
  name: string;
  email: string;
  place: string;
  dob: string;
  userId: number;
}

// 🔹 FIX: Remove property declarations
class Contact extends Model<ContactAttributes> {}

Contact.init(
  {
    id: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      autoIncrement: true, 
      primaryKey: true 
    },
    name: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    email: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    place: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    dob: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    userId: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      allowNull: false 
    },
  },
  { 
    sequelize, 
    tableName: "Contacts", 
    timestamps: true 
  }
);

// Relations
User.hasMany(Contact, { foreignKey: "userId" });
Contact.belongsTo(User, { foreignKey: "userId" });

export default Contact;