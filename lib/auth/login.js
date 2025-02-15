const { PROD } = require("../..");

const { verifyHuman } = require("../turnstile.js");

module.exports = async (req, res) => {
  function error(value) {
    res.putState("login-error", value);
    res.redirect("/account/login");
  }

  for (const field of ["email", "password"].concat(PROD ? "turnstile" : [])) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("The field '" + field + "' is required and cannot be empty");
    }
  }
  const { email, turnstile } = req.body;

  if (email.length > 254) {
    return error("Email can't be longer than 254 characters");
  }

  if (!(await verifyHuman(turnstile))) {
    return error("Test could not be verified, try again");
  }

  if (!(await req.login())) {
    return error("Email or password are incorrect");
  }
  res.redirect("/account");

};
