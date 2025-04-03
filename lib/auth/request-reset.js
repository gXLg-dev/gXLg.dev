const { sendMail } = require("../mail.js");
const { base } = require("../..");
const obfuscation = require("../time-obfuscation.js");

module.exports = async (req, res) => {
  function error(value) {
    res.putState("request-error", value);
    res.redirect("/account/reset/request");
  }

  for (const field of ["email"]) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("The field '" + field + "' is required and can't be empty");
    }
  }
  if (!(await req.verifyHuman("request-reset"))) {
    return error("Test couldn't be verified, try again");
  }
  const { email } = req.body;
  const data = await req.requestReset();
  if (!data) {
    // Couldn't request a reset of this account
    await obfuscation(false);
    res.putState("request-success", true);
    res.redirect("/account/reset/request");
    return;
  }

  // verification
  const sent = await sendMail(
    email,
    "Account Reset 🔄",
    "Confirm the reset of your account",
    [
      ["n", "Someone requested a reset of your account on gXLg.dev!"],
      ["n", "Resetting your account does not delete any data. It allows to change a forgotten password and refresh Authenticator data."],
      ["n", "If that was you, to finish the resetting process, please follow this link:"],
      ["lc", base + "/account/reset/confirm?verify=" + data.verify + "&email=" + email],
      ["n", "After that, you will reveive a new registration link, which you should use to register again."],
      ["s", "If you didn't request your account to be reset, you can ignore this mail. If you keep getting these mails, please contact me."]
    ]
  );
  await obfuscation(true);

  if (!sent) {
    return error("Couldn't send the confirmation mail, please contact me");
  }

  res.putState("request-success", true);
  res.redirect("/account/reset/request");
};
