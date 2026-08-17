const { sendMail } = require("../mail.js");

module.exports = async (req, res) => {
  function error(value) {
    res.putState("relogin-error", value);
    res.redirect("/" + req.lang + "/account");
  }
  for (const field of ["email"]) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("{{error.field:field." + field + "}}");
    }
  }
  const success = await req.adminLogin();
  if (!success) {
    return error("User doesn't exist");
  }
  res.redirect("/" + req.lang + "/account");
}
