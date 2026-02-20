import * as path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });
dotenv.config({ path: path.join(process.cwd(), "..", ".env") });

import { fakerRU } from "@faker-js/faker";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { connectDb, disconnectDb } from "./db";
import { ClientModel } from "./modules/clients";
import { TaskModel } from "./modules/tasks";
import { UserModel, UserRole } from "./modules/users";
import { generateSeedClients } from "./modules/clients/data/clients.repository";
import { generateSeedTasks } from "./modules/tasks/data/tasks.repository";

const SALT_ROUNDS = 10;

function generateAvatar(sex: "male" | "female"): string {
  const folder = sex === "male" ? "men" : "women";
  const num = Math.floor(Math.random() * 100);
  return `https://randomuser.me/api/portraits/${folder}/${num}.jpg`;
}

async function seed(): Promise<void> {
  await connectDb();

  try {
    await UserModel.deleteMany({});
    console.log("Cleared users collection.");

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
      const adminSex = fakerRU.person.sex() as "male" | "female";
      await UserModel.create({
        email: adminEmail,
        passwordHash,
        name: `${fakerRU.person.firstName(adminSex)} ${fakerRU.person.lastName(adminSex)}`,
        role: UserRole.ADMIN,
        avatar: generateAvatar(adminSex),
      });
      console.log(`Created admin user: ${adminEmail}`);
    } else {
      console.log("ADMIN_EMAIL or ADMIN_PASSWORD not set; skipping admin user.");
    }

    const managerEmail = process.env.MANAGER_EMAIL;
    const managerPassword = process.env.MANAGER_PASSWORD;
    let manager: mongoose.Document | null = null;
    if (managerEmail && managerPassword) {
      const passwordHash = await bcrypt.hash(managerPassword, SALT_ROUNDS);
      const managerSex = fakerRU.person.sex() as "male" | "female";
      manager = await UserModel.create({
        email: managerEmail,
        passwordHash,
        name: `${fakerRU.person.firstName(managerSex)} ${fakerRU.person.lastName(managerSex)}`,
        role: UserRole.MANAGER,
        avatar: generateAvatar(managerSex),
      });
      console.log(`Created manager user: ${managerEmail}`);
    } else {
      console.log("MANAGER_EMAIL or MANAGER_PASSWORD not set; skipping manager user.");
    }

    if (manager != null) {
      const managerId = manager._id.toString();

      await TaskModel.deleteMany({});
      await ClientModel.deleteMany({});
      console.log("Cleared clients and tasks collections.");

      const seedClients = generateSeedClients();
      const clientDocs = seedClients.map((c) => ({
        name: c.name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        status: c.status,
        managerId: manager!._id,
        notes: c.notes ?? "",
      }));
      const insertedClients = await ClientModel.insertMany(clientDocs);
      console.log(`Inserted ${insertedClients.length} clients.`);

      const clientIds = insertedClients.map((c) => c._id.toString());
      const seedTasks = generateSeedTasks(managerId, clientIds);
      const taskDocs = seedTasks.map((t) => ({
        title: t.title,
        description: t.description,
        clientId: t.clientId,
        assigneeId: t.assigneeId,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
      }));
      await TaskModel.insertMany(taskDocs);
      console.log(`Inserted ${taskDocs.length} tasks.`);
    } else {
      console.log("No manager found; skipping clients and tasks seeding.");
    }

    console.log("Seed completed successfully.");
  } finally {
    await disconnectDb();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
