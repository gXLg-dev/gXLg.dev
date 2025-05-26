const { sendMail } = require("../mail.js");
const { secure } = require("./password.js");

module.exports = async (req, res) => {
  function error(value) {
    res.putState("password-error", value);
    res.redirect("/" + req.lang + "/account/change-password");
  }

  for (const field of ["current-password", "password", "repeat", "otp"]) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("{{error.field:field.ch-" + field + "}}");
    }
  }
  if (!(await req.verifyHuman("change-password"))) {
    return error("{{error.turnstile}}");
  }
  const { password, repeat } = req.body;
  if (password != repeat) {
    return error("{{error.passwords}}");
  }
  const test = await secure(password);
  if (test != null) {
    return error("{{error.insecure:" + test + "}}");
  }
  if (!(await req.changePassword())) {
    return error("{{error.nochange}}");
  }

  res.putState("password-success", true);
  res.redirect("/" + req.lang + "/account/change-password");

  // notification
  await sendMail(
    req.auth,
    "{{email.change.subject}} 🔑",
    "{{email.change.title}}",
    [
      ["n", "{{email.change.line1}}"],
      ["s", "{{email.change.line2}}"]
    ],
    req.lang
  );
};
