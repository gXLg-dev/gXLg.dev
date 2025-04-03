const { sendMail } = require("../mail.js");
const { hibp } = require("./password.js");

module.exports = async (req, res) => {
  function error(value) {
    const s = new URLSearchParams();
    if (req.body.verify) s.set("verify", req.body.verify);
    res.putState("login-error", value);
    res.redirect("/account/login" + (s.size ? "?" + s : ""));
  }

  for (const field of ["email", "password", "otp"]) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("The field '" + field + "' is required and can't be empty");
    }
  }
  if (!(await req.verifyHuman("login"))) {
    return error("Test couldn't be verified, try again");
  }
  if (!(await req.login())) {
    return error("Email, password or OTP are incorrect");
  }

  res.redirect("/account");

  if (await hibp(req.body.password)) {
    await sendMail(
      req.body.email,
      "Password ⚠️",
      "Your password has been breached",
      [
        ["n", "The password you are currently using for gXLg.dev has been found in the database of breached passwords."],
        ["n", "It is recommended to change your password for additional security."],
        ["n", "For more information, please visit this website:"],
        ["lc", "https://haveibeenpwned.com/passwords"],
      ]
    );
  }
};
