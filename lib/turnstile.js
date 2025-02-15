const { PROD } = require("..");

const axios = require("axios");
const secret = require("../config.json").turnstile.secret;

async function verifyHuman(code) {
  if (!PROD) return true;

  const r = await axios.post("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    secret, "response": code
  });
  return r.data.success;
}

module.exports = { verifyHuman };
