const PROD = !!process.argv[2];
module.exports = { PROD };

const { nulls } = require("nulls");
const nauth = require("nulls-auth");
const nstate = require("nulls-state");

const config = require("./config.json");
const { getPage } = require("./lib/pages.js");

const auth = nauth({
  "path": "./db/users.badb",
  "secret": config.jwt_secret,
  "username": 254,
  "secure": PROD,
  "verify": true,
  "param": "email"
});

const state = nstate({
  "secret": config.jwt_secret,
  "secure": PROD
});

nulls({
  "init": (app, server) => {
    process.on("SIGINT", () => {
      server.close();
      console.log("\rShutting down...");
    });
  },
  "hook": async (req, res) => {
    await auth(req, res);
    state(req, res);
    req.page = getPage(req.path, req.auth);
  },
  "nulls": "./site",
  "static": "./static",
  "ready": () => console.log("Server up!"),
  "port": PROD ? parseInt(process.argv[2]) : 8080,
  "https": PROD
});
