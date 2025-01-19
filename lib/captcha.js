const { PROD } = require("..");

const axios = require("axios");
const secret = require("../config.json").captcha.secret;

async function verifyCaptcha(captcha) {
  if (!PROD) return true;

  const r = await axios.post("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    secret, "response": captcha
  });
  return r.data.success;
}

module.exports = { verifyCaptcha };
