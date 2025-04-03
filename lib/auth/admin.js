const { admin } = require("../../config.json");
const { sendMail } = require("../mail.js");
const { base } = require("../..");

module.exports = async v => {
  await sendMail(
    admin,
    "Admin 👑",
    "Join gXLg.dev",
    [
      ["lc", base + "/account/register?verify=" + v + "&email=" + admin],
    ]
  );
}
