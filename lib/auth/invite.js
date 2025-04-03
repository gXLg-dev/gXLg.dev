const { sendMail } = require("../mail.js");
const { base } = require("../..");

module.exports = async (req, res) => {
  function error(value) {
    res.putState("invite-error", value);
    res.redirect("/account");
  }
  for (const field of ["email"]) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("The field '" + field + "' is required and can't be empty");
    }
  }
  const data = await req.addWhitelist();
  if (!data) {
    return error("Could not invite user");
  }
  const { email } = req.body;

  // invitation
  const sent = await sendMail(
    email,
    "Invitation ✉️",
    "Join gXLg.dev",
    [
      ["n", "You have been invited to join gXLg.dev!"],
      ["n", "To begin registration, please use the following link:"],
      ["lc", base + "/account/register?verify=" + data.verify + "&email=" + email],
      ["s", "If you believe this is a mistake, you can ignore this mail or contact me."]
    ]
  );
  if (!sent) {
    await req.revertWhitelist();
    return error("Couldn't send the confirmation mail");
  }
  res.redirect("/account");
}
