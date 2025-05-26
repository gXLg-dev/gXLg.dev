const { sendMail } = require("../mail.js");
const { base } = require("../..");

module.exports = async (req, res) => {
  function error(value) {
    res.putState("invite-error", value);
    res.redirect("/" + req.lang + "/account");
  }
  for (const field of ["email"]) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("{{error.field:field." + field + "}}");
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
    "{{email.invite.subject}} ✉️",
    "{{email.invite.title}}",
    [
      ["n", "{{email.invite.line1}}"],
      ["n", "{{email.invite.line2}}"],
      ["lc", base + "/" + req.lang + "/account/register?verify=" + data.verify + "&email=" + email],
      ["s", "{{email.invite.line3}}"]
    ],
    req.lang
  );
  if (!sent) {
    await req.revertWhitelist();
    return error("Couldn't send the invitation mail");
  }
  res.redirect("/" + req.lang + "/account");
}
