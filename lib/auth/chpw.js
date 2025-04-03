const { sendMail } = require("../mail.js");
const { secure } = require("./password.js");

module.exports = async (req, res) => {
  function error(value) {
    res.putState("password-error", value);
    res.redirect("/account/change-password");
  }

  for (const field of ["current-password", "password", "repeat", "otp"]) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("The field '" + field + "' is required and can't be empty");
    }
  }
  if (!(await req.verifyHuman("change-password"))) {
    return error("Test couldn't be verified, try again");
  }
  const { password, repeat } = req.body;
  if (password != repeat) {
    return error("Passwords don't match");
  }
  const test = await secure(password);
  if (test != null) {
    return error("Password is insecure: " + test);
  }
  if (!(await req.changePassword())) {
    return error("Couldn't change password");
  }

  res.putState("password-success", true);
  res.redirect("/account/change-password");

  // notification
  await sendMail(
    req.auth,
    "New Password 🔑",
    "Password successfully changed",
    [
      ["n", "You have just changed your password for gXLg.dev!"],
      ["s", "If you didn't change your password, please contact me immidiately."]
    ]
  );
};
