import { expect, request, test } from "@playwright/test";

test.describe("core flows", () => {
  test("sign up → add person → log interaction → pipeline → search", async ({ page }) => {
    const email = `e2e-${Date.now()}@test.dev`;

    // Sign up
    await page.goto("/sign-up");
    await page.getByPlaceholder("Your name").fill("Erin Tester");
    await page.getByPlaceholder("you@school.edu").fill(email);
    await page.getByPlaceholder("At least 8 characters").fill("super-secret-1");
    await page.getByRole("button", { name: "Create Account" }).click();
    await page.waitForURL("**/");
    await expect(page.getByText("Welcome to Orbit")).toBeVisible();

    // Create a contact
    await page.goto("/contacts/new");
    await page.getByPlaceholder("Full name").fill("Casey Chen");
    await page.getByPlaceholder("Where they work").fill("TestCo Ventures");
    await page.getByRole("button", { name: "Add Person" }).click();
    await page.waitForURL(/\/contacts\/[A-Za-z0-9]+$/);
    await expect(page.getByRole("heading", { name: "Casey Chen" })).toBeVisible();

    // Quick-log a coffee
    await page.getByRole("button", { name: "Coffee", exact: true }).click();
    await page
      .getByPlaceholder("What did you talk about? Anything to remember?")
      .fill("Talked about the seed round and ski trips.");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Talked about the seed round and ski trips.")).toBeVisible();

    // Add to pipeline from the profile
    await page.getByRole("button", { name: "Add to Pipeline" }).click();
    await expect(page.getByText("To Reach Out", { exact: true })).toBeVisible();

    // Board shows the card; move it via the tap menu
    await page.goto("/pipeline");
    const card = page.getByRole("button", { name: /Casey Chen/ });
    await expect(card).toBeVisible();
    await card.click();
    await page.getByRole("button", { name: "Move to Contacted" }).click();
    await card.click();
    await expect(page.getByRole("button", { name: "Move to To Reach Out" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();

    // Global search finds the interaction note and the company
    await page.goto("/search");
    await page.getByPlaceholder("People, notes, transcripts…").fill("TestCo");
    await expect(
      page.getByRole("link", { name: /Casey Chen/ }).first(),
    ).toBeVisible();
    await page.getByPlaceholder("People, notes, transcripts…").fill("ski trips");
    await expect(page.getByText("Conversations")).toBeVisible();

    // Capture a typed note — with AI off it asks who it was with, then files it
    await page.goto("/capture");
    await page
      .getByPlaceholder(/Talked with Priya/)
      .fill("Caught up over lunch about the internship search.");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Who was this with?")).toBeVisible();
    await page.getByRole("button", { name: /Casey Chen/ }).click();
    await expect(page.getByText("Saved to Casey Chen")).toBeVisible();

    // The note landed on the contact's timeline
    await page.goto("/contacts");
    await page.getByRole("link", { name: /Casey Chen/ }).click();
    await expect(
      page.getByText("Caught up over lunch about the internship search."),
    ).toBeVisible();
  });

  test("users cannot read each other's contacts", async ({ baseURL }) => {
    const apiA = await request.newContext({ baseURL });
    await apiA.post("/api/auth/sign-up", {
      data: { name: "User A", email: `a-${Date.now()}@test.dev`, password: "password-a1" },
    });
    const created = await apiA.post("/api/contacts", {
      data: { name: "Secret Friend", tier: "new", tags: [] },
    });
    expect(created.status()).toBe(201);
    const { contact } = (await created.json()) as { contact: { id: string } };

    const apiB = await request.newContext({ baseURL });
    await apiB.post("/api/auth/sign-up", {
      data: { name: "User B", email: `b-${Date.now()}@test.dev`, password: "password-b1" },
    });
    const stolen = await apiB.get(`/api/contacts/${contact.id}`);
    expect(stolen.status()).toBe(404);

    const unauth = await request.newContext({ baseURL });
    const anon = await unauth.get(`/api/contacts/${contact.id}`);
    expect(anon.status()).toBe(401);

    await Promise.all([apiA.dispose(), apiB.dispose(), unauth.dispose()]);
  });
});
