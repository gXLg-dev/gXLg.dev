const { sendMail } = require("../mail.js");
const { secure } = require("./password.js");
const { base } = require("../..");

module.exports = async (req, res) => {
  function error(value) {
    const s = new URLSearchParams();
    if (req.body.verify) s.set("verify", req.body.verify);
    if (req.body.email) s.set("email", req.body.email);
    res.putState("register-error", value);
    res.redirect("/" + req.lang + "/account/register" + (s.size ? "?" + s : ""));
  }

  for (const field of ["email", "password", "repeat"]) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("{{error.field:field." + field + "}}");
    }
  }
  if (req.body.agree != "on") {
    return error("{{error.termsaccept}}");
  }
  if (!(await req.verifyHuman("register"))) {
    return error("{{error.turnstile}}");
  }
  const { email, password, repeat } = req.body;
  if (password != repeat) {
    return error("{{error.passwords}}");
  }
  const test = await secure(password);
  if (test != null) {
    return error("{{error.insecure:" + test + "}}");
  }
  const data = await req.register();
  if (!data) {
    return error("{{error.noregister}}");
  }

  // verification
  const sent = await sendMail(
    email,
    "{{email.register.subject}} 📝",
    "{{email.register.title}}",
    [
      ["n", "{{email.register.line1}}"],
      ["n", "{{email.register.line2}}"],
      ["n", "{{email.register.line3}}"],
      ["(", "Android:"],
      ["l)", "https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"],
      ["(", "Apple:"],
      ["l)", "https://apps.apple.com/app/authenticator-app/id1538761576"],
      ["n", "{{email.register.line4}}"],

      ["n", "{{email.register.line5}}"],
      ["ic", data.qrcode],
      ["n", "{{email.register.line6}}"],
      ["c", data.secret],

      ["n", "{{email.register.line7}}"],
      ["lc", base + "/" + req.lang + "/account/login?verify=" + data.verify],
      ["s", "{{email.register.line8}}"]
    ],
    req.lang
  );
  if (!sent) {
    await req.revertRegister(data.old);
    return error("{{error.nosendconfirm}}");
  }

  res.putState("register-success", true);
  res.redirect("/" + req.lang + "/account/register");
};
