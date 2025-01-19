const { PROD } = require("../..");

const { verifyCaptcha } = require("../captcha.js");

module.exports = async (req, res) => {
  function error(value) {
    res.putState("login-error", value);
    res.redirect("/account/login");
  }

  for (const field of ["email", "password"].concat(PROD ? "captcha" : [])) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("The field '" + field + "' is required and cannot be empty");
    }
  }
  const { email, captcha } = req.body;

  if (email.length > 254) {
    return error("Email can't be longer than 254 characters");
  }

  if (!(await verifyCaptcha(captcha))) {
    return error("Captcha could not be verified, try again");
  }

  if (!(await req.login())) {
    return error("Email or password are incorrect");
  }
  res.redirect("/account");

};
