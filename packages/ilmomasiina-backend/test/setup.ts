import { faker } from "@faker-js/faker";
import { afterAll, afterEach, beforeAll, beforeEach, expect,vi } from "vitest";

import initApp from "../src/app";
import EmailService from "../src/mail";
import setupDatabase, { closeDatabase } from "../src/models";
import { testUser } from "./testData";

const needsDb = () => expect.getState().testPath?.includes("test/routes");
const needsApi = () => expect.getState().testPath?.includes("test/routes");

// Common setup for all backend test files: initialize Sequelize & Fastify, tear down at test end.
beforeAll(async () => {
  if (needsDb()) {
    global.sequelize = await setupDatabase();
  } else {
    global.sequelize = undefined as any;
  }
  if (needsApi()) {
    global.server = await initApp();
  } else {
    global.server = undefined as any;
  }
});
afterAll(async () => {
  if (global.sequelize) {
    await closeDatabase();
    global.sequelize = undefined as any;
  }
  if (global.server) {
    await global.server.close();
    global.server = undefined as any;
  }
});

beforeEach(async () => {
  // Ensure deterministic test data.
  faker.seed(133742069);

  if (global.sequelize) {
    // Disable foreign key checks to allow truncating tables.
    await global.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

    // Delete test data that can conflict between tests.
    await global.sequelize.getQueryInterface().bulkDelete("user", {}, { truncate: true, cascade: true } as any);
    // Event truncation cascades to all other event data: (pretty sure cascade doesn't work on MariaDB)
    await global.sequelize.query("TRUNCATE TABLE question");
    await global.sequelize.query("TRUNCATE TABLE quota");
    await global.sequelize.query("TRUNCATE TABLE answer");
    await global.sequelize.query("TRUNCATE TABLE signup");
    await global.sequelize.query("TRUNCATE TABLE event");
    await global.sequelize.query("TRUNCATE TABLE auditlog");
    // await global.sequelize.getQueryInterface().bulkDelete("auditlog", {}, { truncate: true, cascade: true } as any);

    // Enable foreign key checks for normal operation.
    await global.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    // Create a test user to ensure full functionality.
    global.adminUser = await testUser();

    // Create a token for the admin.
    global.adminToken = global.server.adminSession.createSession(global.adminUser);
  }
});

// Mock email sending: ensure no actual email is sent and allow checking for calls.
beforeAll(() => {
  global.emailSend = vi.spyOn(EmailService, "send").mockImplementation(async () => {});
});
afterEach(() => {
  global.emailSend.mockClear();
});
