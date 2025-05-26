const { sendMail } = require("../mail.js");
const { base } = require("../..");
const obfuscation = require("../time-obfuscation.js");

module.exports = async (req, res) => {
  function error(value) {
    res.putState("request-error", value);
    res.redirect("/" + req.lang + "/account/reset/request");
  }

  for (const field of ["email"]) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("{{error.field:field." + field + "}}");
    }
  }
  if (!(await req.verifyHuman("request-reset"))) {
    return error("{{error.turnstile}}");
  }
  const { email } = req.body;
  const data = await req.requestReset();
  if (!data) {
    // Couldn't request a reset of this account
    await obfuscation(false);
    res.putState("request-success", true);
    res.redirect("/" + req.lang + "/account/reset/request");
    return;
  }

  // verification
  const sent = await sendMail(
    email,
    "{{email.request.subject}} 🔄",
    "{{email.request.title}}",
    [
      ["n", "{{email.request.line1}}"],
      ["n", "{{email.request.line2}}"],
      ["n", "{{email.request.line3}}"],
      ["lc", base + "/" + req.lang + "/account/reset/confirm?verify=" + data.verify + "&email=" + email],
      ["n", "{{email.request.line4}}"],
      ["s", "{{email.request.line5}}"]
    ],
    req.lang
  );
  await obfuscation(true);

  if (!sent) {
    return error("{{error.nosendconfirm}}");
  }

  res.putState("request-success", true);
  res.redirect("/" + req.lang + "/account/reset/request");
};
