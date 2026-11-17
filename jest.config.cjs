module.exports = {
  testEnvironment: "jsdom",
  testEnvironmentOptions: {
    runScripts: "dangerously",
  },
  testMatch: ["**/tests/**/*.test.js"],
  clearMocks: true,
};
