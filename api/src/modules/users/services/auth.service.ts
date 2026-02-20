import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { UserModel, UserRole } from "../models/User.model";
import { addToBlacklist } from "../../../redis";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
  avatar?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
  createdAt: string;
}

function toUserResponse(doc: {
  _id: { toString(): string };
  email: string;
  name?: string;
  role: UserRole;
  avatar?: string;
  createdAt?: Date;
}): UserResponse {
  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name ?? "",
    role: doc.role,
    avatar: doc.avatar ?? "",
    createdAt: doc.createdAt?.toISOString() ?? "",
  };
}

export async function register(payload: RegisterPayload): Promise<UserResponse> {
  if (!payload.email?.trim()) {
    throw new Error("Введите email");
  }
  if (!payload.password) {
    throw new Error("Введите пароль");
  }
  const existing = await UserModel.findOne({ email: payload.email }).exec();
  if (existing) {
    const err = new Error("Этот email уже зарегистрирован");
    (err as Error & { statusCode?: number }).statusCode = 409;
    throw err;
  }
  const passwordHash = await bcrypt.hash(payload.password, SALT_ROUNDS);
  const doc = await UserModel.create({
    email: payload.email,
    passwordHash,
    name: payload.name ?? "",
    role: payload.role ?? UserRole.MANAGER,
    avatar: payload.avatar ?? "",
  });
  const d = doc as { _id: typeof doc._id; email: string; name?: string; role: UserRole; avatar?: string; createdAt?: Date };
  return toUserResponse({
    _id: d._id,
    email: d.email,
    name: d.name,
    role: d.role,
    avatar: d.avatar,
    createdAt: d.createdAt,
  });
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserResponse;
  token: string;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  if (!payload.email?.trim()) {
    throw new Error("Введите email");
  }
  if (!payload.password) {
    throw new Error("Введите пароль");
  }
  const doc = await UserModel.findOne({ email: payload.email }).exec();
  if (!doc) {
    const err = new Error("Неверный email или пароль");
    (err as Error & { statusCode?: number }).statusCode = 401;
    throw err;
  }
  const match = await bcrypt.compare(payload.password, doc.passwordHash);
  if (!match) {
    const err = new Error("Неверный email или пароль");
    (err as Error & { statusCode?: number }).statusCode = 401;
    throw err;
  }
  const d = doc as { _id: { toString(): string }; email: string; name?: string; role: UserRole; avatar?: string; createdAt?: Date };
  const user = toUserResponse({
    _id: d._id,
    email: d.email,
    name: d.name,
    role: d.role,
    avatar: d.avatar,
    createdAt: d.createdAt,
  });
  const token = jwt.sign(
    { sub: doc._id.toString(), email: doc.email, role: doc.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
  return { user, token };
}

export async function getMe(userId: string): Promise<UserResponse> {
  const doc = await UserModel.findById(userId).exec();
  if (!doc) {
    const err = new Error("Пользователь не найден");
    (err as Error & { statusCode?: number }).statusCode = 404;
    throw err;
  }
  const d = doc as { _id: { toString(): string }; email: string; name?: string; role: UserRole; avatar?: string; createdAt?: Date };
  return toUserResponse({
    _id: d._id,
    email: d.email,
    name: d.name,
    role: d.role,
    avatar: d.avatar,
    createdAt: d.createdAt,
  });
}

export interface UpdateMePayload {
  name?: string;
  avatar?: string;
}

export async function updateMe(userId: string, payload: UpdateMePayload): Promise<UserResponse> {
  const doc = await UserModel.findByIdAndUpdate(
    userId,
    { name: payload.name, avatar: payload.avatar },
    { new: true, runValidators: true }
  ).exec();
  if (!doc) {
    const err = new Error("Пользователь не найден");
    (err as Error & { statusCode?: number }).statusCode = 404;
    throw err;
  }
  const d = doc as { _id: { toString(): string }; email: string; name?: string; role: UserRole; avatar?: string; createdAt?: Date };
  return toUserResponse({
    _id: d._id,
    email: d.email,
    name: d.name,
    role: d.role,
    avatar: d.avatar,
    createdAt: d.createdAt,
  });
}

export async function logout(token: string): Promise<void> {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (decoded?.exp) {
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    await addToBlacklist(token, ttl);
  }
}

export async function getUsers(): Promise<UserResponse[]> {
  const docs = await UserModel.find().lean().exec();
  return docs.map((d) => {
    const doc = d as { _id: { toString(): string }; email: string; name?: string; role: UserRole; avatar?: string; createdAt?: Date };
    return toUserResponse({
      _id: doc._id,
      email: doc.email,
      name: doc.name,
      role: doc.role,
      avatar: doc.avatar,
      createdAt: doc.createdAt,
    });
  });
}
