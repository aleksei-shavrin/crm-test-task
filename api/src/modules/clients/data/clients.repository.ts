import { fakerRU } from "@faker-js/faker";
import type { ClientStatus } from "../../../domain/types";

export interface SeedClientDoc {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: ClientStatus;
  notes: string;
}

const STATUSES: ClientStatus[] = ["active", "inactive", "lead"];

export function generateSeedClients(count = 8): SeedClientDoc[] {
  fakerRU.seed(42);
  const docs: SeedClientDoc[] = [];
  for (let i = 0; i < count; i++) {
    const firstName = fakerRU.person.firstName();
    const lastName = fakerRU.person.lastName();
    docs.push({
      name: `${firstName} ${lastName}`,
      email: fakerRU.internet.email({ firstName, lastName }).toLowerCase(),
      phone: fakerRU.phone.number(),
      company: fakerRU.company.name(),
      status: fakerRU.helpers.arrayElement(STATUSES),
      notes: fakerRU.datatype.boolean(0.3) ? fakerRU.lorem.sentence() : "",
    });
  }
  return docs;
}
