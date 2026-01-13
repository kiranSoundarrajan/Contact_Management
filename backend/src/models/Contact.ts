import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";
import User from "./User";

interface ContactAttributes {
  id: number;
  name: string;
  email: string;
  place: string;
  dob: string;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class Contact extends Model<ContactAttributes> implements ContactAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public place!: string;
  public dob!: string;
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
    },
    email: { 
      type: DataTypes.STRING(255), 
      allowNull: false,
    },
    place: { 
      type: DataTypes.STRING(255), 
      allowNull: false,
    },
    dob: { 
      type: DataTypes.STRING(255), 
      allowNull: false,
    },
    userId: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
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
  }
);

// Relations
User.hasMany(Contact, { 
  foreignKey: "userId", 
  as: "contacts",
  onDelete: "CASCADE" 
});

Contact.belongsTo(User, { 
  foreignKey: "userId", 
  as: "user"
});

export default Contact;