import { Model, Optional } from "sequelize";

/* ===============================
   Generic Sequelize Model Instance
=============================== */
export type ModelInstance<T extends {}> = Model<T> & T;

/* ===============================
   Contact Types
=============================== */
export interface ContactAttributes {
  id: number;
  name: string;
  email: string;
  place: string;
  dob: Date;          // Changed to Date for consistency with Sequelize DATEONLY
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// For creating new contacts (id, createdAt, updatedAt are optional)
export interface ContactCreationAttributes 
  extends Optional<ContactAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export type ContactInstance = ModelInstance<ContactAttributes>;

/* ===============================
   User Types
=============================== */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  role: UserRole;      // Use enum for stricter typing
  createdAt?: Date;
  updatedAt?: Date;
}

// For creating new users (id, createdAt, updatedAt are optional)
export interface UserCreationAttributes 
  extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export type UserInstance = ModelInstance<UserAttributes>;
