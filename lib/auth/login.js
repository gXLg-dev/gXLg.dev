const { sendMail } = require("../mail.js");
const { hibp } = require("./password.js");

module.exports = async (req, res) => {
  function error(value) {
    const s = new URLSearchParams();
    if (req.body.verify) s.set("verify", req.body.verify);
    res.putState("login-error", value);
    res.redirect("/" + req.lang + "/account/login" + (s.size ? "?" + s : ""));
  }

  for (const field of ["email", "password", "otp"]) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("{{error.field:field." + field + "}}");
    }
  }
  if (!(await req.verifyHuman("login"))) {
    return error("{{error.turnstile}}");
  }
  if (!(await req.login())) {
    return error("{{error.loginwrong}}");
  }

  res.redirect("/" + req.lang + "/account");

  if (await hibp(req.body.password)) {
    await sendMail(
      req.body.email,
      "{{email.password.subject}} ⚠️",
      "{{email.password.title}}",
      [
        ["n", "{{email.password.line1}}"],
        ["n", "{{email.password.line2}}"],
        ["n", "{{email.password.line3}}"],
        ["lc", "https://haveibeenpwned.com/passwords"],
      ],
      req.lang
    );
  }
};
