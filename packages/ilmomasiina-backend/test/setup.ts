import { faker } from "@faker-js/faker";
import { afterAll, afterEach, beforeAll, beforeEach, TaskBase, vi } from "vitest";

import initApp from "../src/app";
import EmailService from "../src/mail";
import setupDatabase, { closeDatabase } from "../src/models";
import { testUser } from "./testData";

const needsDb = (suite: TaskBase) => suite.name.includes("test/routes");
const needsApi = (suite: TaskBase) => suite.name.includes("test/routes");

// Common setup for all backend test files: initialize Sequelize & Fastify, tear down at test end.
beforeAll(async (suite) => {
  if (needsDb(suite)) {
    global.sequelize = await setupDatabase();
  } else {
    global.sequelize = undefined as any;
  }
  if (needsApi(suite)) {
    global.server = await initApp();
  } else {
    global.server = undefined as any;
  }
});
afterAll(async () => {
  if (sequelize) {
    await closeDatabase();
    global.sequelize = undefined as any;
  }
  if (server) {
    await server.close();
    global.server = undefined as any;
  }
});

beforeEach(async () => {
  // Ensure deterministic test data.
  faker.seed(133742069);

  if (sequelize) {
    // Disable foreign key checks to allow truncating tables.
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

    // Delete test data that can conflict between tests.
    await sequelize.getQueryInterface().bulkDelete("user", {}, { truncate: true, cascade: true } as any);
    // Event truncation cascades to all other event data: (pretty sure cascade doesn't work on MariaDB)
    await sequelize.query("TRUNCATE TABLE question");
    await sequelize.query("TRUNCATE TABLE quota");
    await sequelize.query("TRUNCATE TABLE answer");
    await sequelize.query("TRUNCATE TABLE signup");
    await sequelize.query("TRUNCATE TABLE event");
    await sequelize.query("TRUNCATE TABLE auditlog");
    // await sequelize.getQueryInterface().bulkDelete("auditlog", {}, { truncate: true, cascade: true } as any);

    // Enable foreign key checks for normal operation.
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    // Create a test user to ensure full functionality.
    global.adminUser = await testUser();
  }
});

// Mock email sending: ensure no actual email is sent and allow checking for calls.
beforeAll(() => {
  global.emailSend = vi.spyOn(EmailService, "send").mockImplementation(async () => {});
});
afterEach(() => {
  emailSend.mockClear();
});
