// @ts-check
const { devices } = require("@playwright/test");

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  reporter: "line",
  forbidOnly: !!process.env.CI,
  workers: 1,
  projects: [
    {
      name: "chromium",
      metadata: {
        pwc: {
          tags: ["project:chrome"],
        },
      },
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "firefox",
      metadata: {
        pwc: {
          tags: ["project:firefox"],
        },
      },
      use: {
        ...devices["Desktop Firefox"],
      },
    },
  ],
  use: {
    headless: !!process.env.CI,
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
};

module.exports = config;
