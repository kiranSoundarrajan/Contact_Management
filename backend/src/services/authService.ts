import bcrypt from "bcryptjs";
import User from "../models/User";

interface SafeUserData {
  id: number;
  username: string;
  email: string;
  role: string;
}

// Register
export const registerService = async (data: any): Promise<SafeUserData> => {
  const { username, email, password, role = "user" } = data;

  if (!username || !email || !password) {
    throw new Error("All fields are required");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  if (username.length < 3) {
    throw new Error("Username must be at least 3 characters");
  }

  const existingUser = await User.findOne({
    where: { email: email.toLowerCase().trim() },
  });

  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  const user = await User.create({
    username: username.trim(),
    email: email.toLowerCase().trim(),
    password, // model hook will hash
    role: role.toLowerCase(),
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
};

// Login
export const loginService = async (
  email: string,
  password: string
): Promise<SafeUserData | null> => {
  const user = await User.findOne({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return null;

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
};

// Create Admin
export const createAdminService = async () => {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "123456";

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await User.findOne({
    where: { email: adminEmail.toLowerCase() },
  });

  if (existingAdmin) {
    await existingAdmin.update({
      password: hashedPassword,
      role: "admin",
    });

    return {
      message: "Admin updated successfully",
      admin: {
        id: existingAdmin.id,
        username: existingAdmin.username,
        email: existingAdmin.email,
        role: existingAdmin.role,
      },
    };
  }

  const admin = await User.create({
    username: "Admin",
    email: adminEmail,
    password: hashedPassword,
    role: "admin",
  });

  return {
    message: "Admin created successfully",
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
    },
  };
};
