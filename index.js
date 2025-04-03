const PROD = !!process.argv[2];
const base = PROD ? "https://gxlg.dev" : "http://localhost:8080";
module.exports = { PROD, base };

const { nulls } = require("nulls");
const nauth = require("nulls-auth");
const nstate = require("nulls-state");
const nturnstile = require("nulls-turnstile");

const config = require("./config.json");
const { getPage } = require("./lib/pages.js");
const preprocessor = require("./lib/preprocessor");

(async () => {

  const auth = nauth({
    "path": "./db/users.badb",
    "username": "email",
    "secure": PROD,

    "verify": true,
    "reset": true,
    "whitelist": true,
    "otp": "gXLg.dev",

    "admin": config.admin,
    "adminCreate": require("./lib/auth/admin.js"),

    "cloudflared": PROD,
    "jwt": config.jwt,
    "aes": config.aes,
    "hmac": config.hmac
  });

  const state = nstate({
    "jwt": config.jwt,
    "secure": PROD
  });

  const turnstile = nturnstile({
    ...config.turnstile,
    "ignore": !PROD
  });

  const server = await nulls({
    "plugins": [auth, state, turnstile],
    "hook": async (req, res) => {
      if (req.method == "GET") {
        req.page = getPage(req.path, req.auth);
        res.status(req.page.status);
      }

      req.admin = (req.auth == config.admin);
    },
    "nulls": "./site",
    "static": "./static",
    "uploads": false,
    "ready": () => console.log("Server up!"),
    "port": PROD ? parseInt(process.argv[2]) : 8080,
    "forceHTTPS": PROD,
    "domain": "gXLg.dev",
    preprocessor
  });

  process.on("SIGINT", () => {
    server.close();
    console.log("\rShutting down...");
  });

})();
