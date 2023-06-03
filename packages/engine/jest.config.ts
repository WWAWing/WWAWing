/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */
export default {
  clearMocks: true,
  moduleFileExtensions: [
    "js",
    "ts",
    "json",
  ],
  roots: [
    "<rootDir>/src"
  ],
  testEnvironment: "jsdom",
  testPathIgnorePatterns: [
    "/node_modules/"
  ],
  testRegex: ["__tests__/.*|\\.test\\.(js|ts)"],
  transform: {
    "^.+\\.(j|t)s$": ["@swc/jest", require("../../swcConfig")]
  },
  transformIgnorePatterns: [
    "/node_modules/",
  ],
  unmockedModulePathPatterns: ["node_modules/*"],
};
