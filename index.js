const PROD = !!process.argv[2];
const base = PROD ? "https://gxlg.dev" : "http://localhost:8080";
const defaultLang = "de";
module.exports = { PROD, base, defaultLang };

const { nulls } = require("nulls");
const nauth = require("nulls-auth");
const nstate = require("nulls-state");
const nturnstile = require("nulls-turnstile");

const config = require("./config.json");
const { getPage } = require("./lib/pages.js");
const { icons } = require("./lib/preprocess.js");
const { translate } = require("./lib/translation.js");

const { polling } = require("./lib/contracts");

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
        const path = (req.path ?? "").split("/").filter(p => p);
        let lang = defaultLang;
        if (["de", "en"].includes(path[0])) {
          lang = path.shift();
        }
        req.lang = lang;
        req.page = getPage(path, req.auth);

        res.status(req.page.status);
        res.putState("lang", lang);
      } else {
        req.lang = req.getState("lang") ?? defaultLang;
      }

      req.admin = (req.auth == config.admin);
    },
    "nulls": "./site",
    "static": "./static",
    "uploads": false,
    "ready": () => console.log("Website up!"),
    "port": PROD ? parseInt(process.argv[2]) : 8080,
    "forceHTTPS": PROD,
    "proxies": PROD ? 1 : 0, // cloudflared tunnel
    "domain": "gXLg.dev",
    "preprocessor": icons,
    "textprocessor": (txt, req) => translate(txt, req.lang),

    "redirects": {
      "/:lang/landing/contracts/:id": req => "/" + req.params.lang + "/account/contracts/" + req.params.id
    }
  });

  process.on("SIGINT", () => {
    clearInterval(polling);
    server.close();
    console.log("\rShutting down...");
  });

})();
