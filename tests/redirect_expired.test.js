/* eslint-disable */
const fetch = require('node-fetch');
const puppeteer = require("puppeteer");

function parseJwt(token) {
  const [headerString, payloadString, signature] = token.split('.');
  const header = JSON.parse(atob(headerString));
  const payload = JSON.parse(atob(payloadString));
  return {
    header,
    payload,
    signature,
  }
}

function encodeJwt(token) {
  return btoa(JSON.stringify(token.header)) + "." + btoa(JSON.stringify(token.payload)) + "." + token.signature;
}

const createUser = async (username) => {
  const baseURL = `http://localhost:${process.env.PORT || 3000}`;
  const user = {
    user: {
      username: username,
      email: `${username}@wilco.work`,
      password: "wilco1234",
    },
  };

  const userRes = await fetch(`${baseURL}/api/users`, {
    method: 'POST',
    body: JSON.stringify(user),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (userRes.ok) {
    const data = await userRes.json();
    if (data?.user?.token) {
      return data.user;
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

  it("goes to the homepage if JWT is not expired", async () => {
    const { token } = await createUser('user1');
    await page.goto("http://localhost:3001/", {
      waitUntil: "load",
      timeout: 60000,
    });
    await page.evaluate((token) => {
      localStorage.setItem('jwt', token);
    }, token);
    await page.goto("http://localhost:3001/", {
      waitUntil: "load",
      timeout: 60000,
    });

    const redirectUrl = page.url();
    await expect(redirectUrl).toBe("http://localhost:3001/");

  }, 60000);

  it("redirect to the login page if JWT is expired", async () => {
    const date100DaysAgo = new Date(new Date() - 100 * 24 * 60 * 60 * 1000);
    const { token } = await createUser('user2');

    await page.goto("http://localhost:3001/", {
      waitUntil: "load",
      timeout: 60000,
    });

    const parsedToken = parseJwt(token);
    parsedToken.payload.exp = Math.floor(date100DaysAgo.getTime() / 1000);
    const expiredToken = encodeJwt(parsedToken);

    await page.evaluate((expiredToken) => {
      localStorage.setItem('jwt', expiredToken);
    }, expiredToken);
    await page.goto("http://localhost:3001/", {
      waitUntil: "load",
      timeout: 60000,
    });

    const redirectUrl = page.url();
    await expect(redirectUrl).toBe("http://localhost:3001/login");
  }, 60000);
});

