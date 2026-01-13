import { Model, Optional } from "sequelize";

// Generic type for Sequelize model instances
export type ModelInstance<T extends {}> = Model<T> & T;

// Contact types - define here instead of importing
export interface ContactAttributes {
  id: number;
  name: string;
  email: string;
  place: string;
  dob: string | Date;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Specific type for Contact
export type ContactInstance = ModelInstance<ContactAttributes>;

// User types
export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserInstance = ModelInstance<UserAttributes>;