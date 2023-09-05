require("dotenv").config();
const axios = require("axios");
const TEN_SECONDS = 10 * 1000;
const HOUR_DIFFERENCE_IN_SECONDS = 3600;


function parseJwt(token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

const getToken = async (client) => {
  const user = {
    user: {
      username: "engine",
      email: "engine@wilco.work",
      password: "wilco1234",
    },
  };

  try {
    const loginRes = await client.post(`/api/users/login`, user);
    if (loginRes.data?.user?.token) {
      return loginRes.data.user.token;
    }
  } catch (e) {
    //User doesn't exists yet
  }

  const userRes = await client.post(`/api/users`, user);
  return userRes.data?.user?.token;
};

const runTest = async () => {
  const client = axios.create({
    baseURL: `http://localhost:${process.env.PORT || 3000}`,
    timeout: TEN_SECONDS,
  });
  const token = await getToken(client);
  const parsedToken = parseJwt(token);
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const timeDifferenceInSeconds = parsedToken.exp - currentTimestamp;

  if (timeDifferenceInSeconds > HOUR_DIFFERENCE_IN_SECONDS) {
    console.log(`=!=!=!=!= ERROR: The JWT token expiration date: ${new Date(parsedToken.exp * 1000)} is longer than one hour from the current time.`);
    return false;
  }

  return true;
};

runTest()
  .then((res) => process.exit(res ? 0 : 1))
  .catch((e) => {
    console.log("error while checking api: " + e);
    process.exit(1);
  });
