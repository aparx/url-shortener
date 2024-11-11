/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  moduleDirectories: ["node_modules", "src"],
  setupFilesAfterEnv: ["./src/database/mock.ts"],
  transform: {
    "^.+.(tsx|ts)?$": ["ts-jest", {}],
  },
  moduleNameMapper: {
    "@/(.*)": "<rootDir>/src/$1",
  },
};

export default config;
