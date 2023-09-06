/* eslint-disable */
const fetch = require('node-fetch');
const puppeteer = require("puppeteer");

const getToken = async () => {
  const baseURL = `http://localhost:${process.env.PORT || 3000}`;

  const user = {
    user: {
      username: "engine",
      email: "engine@wilco.work",
      password: "wilco1234",
    },
  };

  try {
    const loginRes = await fetch(`${baseURL}/api/users/login`, {
      method: 'POST',
      body: JSON.stringify(user),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      if (data.user && data.user.token) {
        return data.user.token;
      }
    }
  } catch (e) {
    // User doesn't exist yet
  }

  const userRes = await fetch(`${baseURL}/api/users`, {
    method: 'POST',
    body: JSON.stringify(user),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (userRes.ok) {
    const data = await userRes.json();
    if (data.user && data.user.token) {
      return data.user.token;
    }
  }

  return null;
};


describe("Check that the empty view shows upon no results", () => {
  let browser, page;

  beforeEach(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
    await browser.close();
  });

  it("/settings page - redirect to login if user is not logged in", async () => {
    await page.goto("http://localhost:3001/settings", {
      waitUntil: "load",
      timeout: 60000,
    });

    const redirectUrl = page.url();
    await expect(redirectUrl).toBe("http://localhost:3001/login");

  }, 60000);

  it("/settings page - goes to the settings page if the user is logged in", async () => {
    await page.goto("http://localhost:3001", {
      waitUntil: "load",
      timeout: 60000,
    });
    const token = await getToken();
    await page.evaluate((token) => {
      localStorage.setItem('jwt', token);
    }, token);
    await page.goto("http://localhost:3001/settings", {
      waitUntil: "load",
      timeout: 60000,
    });

    const redirectUrl = page.url();
    await expect(redirectUrl).toBe("http://localhost:3001/settings");

  }, 60000);
});

