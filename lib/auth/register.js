const { sendMail } = require("../mail.js");
const { secure } = require("./password.js");
const { base } = require("../..");

const EMAIL = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

module.exports = async (req, res) => {
  function error(value) {
    const s = new URLSearchParams();
    if (req.body.verify) s.set("verify", req.body.verify);
    if (req.body.email) s.set("email", req.body.email);
    res.putState("register-error", value);
    res.redirect("/account/register" + (s.size ? "?" + s : ""));
  }

  for (const field of ["email", "password", "repeat"]) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("The field '" + field + "' is required and can't be empty");
    }
  }
  if (!(await req.verifyHuman("register"))) {
    return error("Test couldn't be verified, try again");
  }
  const { email, password, repeat } = req.body;
  if (!EMAIL.test(email)) {
    return error("Email address has a wrong format");
  }
  if (password != repeat) {
    return error("Passwords don't match");
  }
  const test = await secure(password);
  if (test != null) {
    return error("Password is insecure: " + test);
  }
  const data = await req.register();
  if (!data) {
    return error("Couldn't finish registration");
  }

  // verification
  const sent = await sendMail(
    email,
    "Registration 📝",
    "Complete your registration",
    [
      ["n", "Thanks for registering on gXLg.dev!"],
      ["n", "To make your data more secure, it is required, that you setup 2-factor-authentication for your account."],
      ["n", "You can install an Authenticator app on your mobile device:"],
      ["(", "Android:"],
      ["l)", "https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"],
      ["(", "Apple:"],
      ["l)", "https://apps.apple.com/app/authenticator-app/id1538761576"],
      ["n", "Or use any other trusted app."],

      ["n", "Scan the following QR Code with your Authenticator app:"],
      ["ic", data.qrcode],
      ["n", "... or enter this secret:"],
      ["c", data.secret],

      ["n", "After that, to finish your registration process, please login using this link:"],
      ["lc", base + "/account/login?verify=" + data.verify],
      ["s", "If you didn't register on gXLg.dev, please contact me."]
    ]
  );
  if (!sent) {
    await req.revertRegister(data.old);
    return error("Couldn't send the confirmation mail, please try again or contact me, of the issue persists");
  }

  res.putState("register-success", true);
  res.redirect("/account/register");
};
