import { fakerRU } from "@faker-js/faker";
import mongoose from "mongoose";
import type { Client } from "../../../domain/types";
import type { AuthUser } from "../../../middleware/auth.middleware";
import { ClientModel, ClientStatus } from "../models/Client.model";
import { invalidateStatsForAll } from "../../../redis";
import { UserModel } from "../../users/models/User.model";

const STATUSES: ClientStatus[] = [ClientStatus.ACTIVE, ClientStatus.INACTIVE, ClientStatus.LEAD];

function managerIdToString(managerId: unknown): string {
  if (managerId == null) return String(managerId);
  const o = managerId as { _id?: unknown; name?: unknown; email?: unknown };
  if (o._id != null && (o.name != null || o.email != null)) {
    return refToIdString(o._id);
  }
  return refToIdString(managerId);
}

function refToIdString(ref: unknown): string {
  if (ref == null) return String(ref);
  return typeof (ref as { toString?: () => string }).toString === "function"
    ? (ref as { toString(): string }).toString()
    : String(ref);
}

function managerDisplayName(manager: unknown): string | undefined {
  if (manager == null) return undefined;
  const o = manager as { name?: string; email?: string };
  const name = typeof o.name === "string" && o.name.trim() ? o.name.trim() : null;
  const email = typeof o.email === "string" && o.email.trim() ? o.email.trim() : null;
  return name ?? email ?? undefined;
}

function mapDocToClient(d: { _id: { toString(): string }; name: string; email: string; phone?: string; company?: string; status: ClientStatus; managerId: unknown; notes?: string; createdAt?: Date; updatedAt?: Date }): Client {
  const managerIdRef = d.managerId;
  return {
    id: d._id.toString(),
    name: d.name,
    email: d.email,
    phone: d.phone ?? "",
    company: d.company ?? "",
    status: d.status,
    managerId: managerIdToString(managerIdRef),
    managerName: managerDisplayName(managerIdRef),
    notes: d.notes ?? "",
    createdAt: d.createdAt?.toISOString() ?? "",
    updatedAt: d.updatedAt?.toISOString() ?? "",
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ClientFilters {
  status?: string;
  managerId?: string;
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getClients(user: AuthUser, pagination?: PaginationParams, filters?: ClientFilters): Promise<PaginatedResult<Client>> {
  const page = Math.max(1, pagination?.page ?? 1);
  const limit = Math.min(100, Math.max(1, pagination?.limit ?? 10));
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> =
    user.role === "admin" ? {} : { managerId: new mongoose.Types.ObjectId(user.id) };

  if (filters?.status) {
    query.status = filters.status;
  }
  if (filters?.managerId && user.role === "admin") {
    query.managerId = new mongoose.Types.ObjectId(filters.managerId);
  }
  if (filters?.search) {
    const searchRegex = new RegExp(filters.search, "i");
    query.$or = [{ name: searchRegex }, { email: searchRegex }, { company: searchRegex }];
  }

  const [docs, total] = await Promise.all([
    ClientModel.find(query)
      .populate("managerId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    ClientModel.countDocuments(query).exec()
  ]);

  const items = docs.map((d) => mapDocToClient(d as Parameters<typeof mapDocToClient>[0]));

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

export async function deleteClient(id: string, user: AuthUser): Promise<boolean> {
  if (user.role === "manager") return false;
  const result = await ClientModel.findByIdAndDelete(id).exec();
  if (result) {
    await invalidateStatsForAll();
  }
  return result != null;
}

export interface CreateClientPayload {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: ClientStatus;
  managerId?: string;
  notes?: string;
}

export async function createClient(payload: CreateClientPayload, user: AuthUser): Promise<Client> {
  const doc = await ClientModel.create({
    name: payload.name,
    email: payload.email,
    phone: payload.phone ?? "",
    company: payload.company ?? "",
    status: payload.status,
    managerId: user.id,
    notes: payload.notes ?? "",
  });
  await invalidateStatsForAll();
  const plain = doc.toObject() as Parameters<typeof mapDocToClient>[0];
  return mapDocToClient(plain);
}

export async function updateClient(id: string, payload: CreateClientPayload, user: AuthUser): Promise<Client | null> {
  if (user.role === "manager") {
    const existing = await ClientModel.findById(id).lean().exec();
    if (!existing) return null;
    if (managerIdToString((existing as { managerId: unknown }).managerId) !== user.id) return null;
  }
  const doc = await ClientModel.findByIdAndUpdate(
    id,
    {
      name: payload.name,
      email: payload.email,
      phone: payload.phone ?? "",
      company: payload.company ?? "",
      status: payload.status,
      notes: payload.notes ?? "",
    },
    { new: true, runValidators: true }
  )
    .exec();
  if (!doc) return null;
  await invalidateStatsForAll();
  const plain = doc.toObject() as Parameters<typeof mapDocToClient>[0];
  return mapDocToClient(plain);
}

export async function getRandomClientPayload(user: AuthUser): Promise<CreateClientPayload> {
  const managerId = user.role === "manager" ? user.id : (await UserModel.findOne({ role: "manager" }).lean().exec())?._id?.toString() ?? user.id;
  return {
    name: fakerRU.person.fullName(),
    email: fakerRU.internet.email(),
    phone: fakerRU.phone.number(),
    company: fakerRU.company.name(),
    status: fakerRU.helpers.arrayElement(STATUSES),
    managerId,
    notes: fakerRU.helpers.maybe(() => fakerRU.lorem.sentence(), { probability: 0.5 }) ?? "",
  };
}
