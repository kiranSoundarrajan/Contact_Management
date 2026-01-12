import { Model } from "sequelize";

// Generic type for Sequelize model instances
export type ModelInstance<T extends {}> = Model & T;

// Specific type for Contact
export type ContactInstance = ModelInstance<{
  id: number;
  name: string;
  email: string;
  place: string;
  dob: string;
  userId: number;
}>;