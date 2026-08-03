import { defineConfig } from "@playwright/test";

const CHROMIUM = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

const iphone = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
};
const desktop = { viewport: { width: 1440, height: 900 } };

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: 1,
  workers: 1, // single shared server + SQLite file
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    launchOptions: { executablePath: CHROMIUM },
  },
  webServer: {
    command: "bash tests/e2e/server.sh",
    url: "http://localhost:3100/sign-in",
    timeout: 150_000,
    reuseExistingServer: false,
  },
  projects: [
    { name: "iphone-light", use: { ...iphone, colorScheme: "light" } },
    {
      name: "iphone-dark",
      use: { ...iphone, colorScheme: "dark" },
      testIgnore: /flows/,
    },
    { name: "desktop-light", use: { ...desktop, colorScheme: "light" } },
    {
      name: "desktop-dark",
      use: { ...desktop, colorScheme: "dark" },
      testIgnore: /flows/,
    },
  ],
});
