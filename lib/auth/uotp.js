const { sendMail } = require("../mail.js");

module.exports = async (req, res) => {
  function error(value) {
    res.putState("otp-error", value);
    res.redirect("/" + req.lang + "/account/update-otp");
  }

  for (const field of ["password"]) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("{{error.field:field." + field + "}}");
    }
  }
  if (!(await req.verifyHuman("update-otp"))) {
    return error("{{error.turnstile}}");
  }
  const data = await req.updateOtp();
  if (!data) {
    return error("{{error.nouotp}}");
  }

  // verification
  const sent = await sendMail(
    req.auth,
    "{{email.otp.subject}} 🔐",
    "{{email.otp.title}}",
    [
      ["n", "{{email.otp.line1}}"],
      ["n", "{{email.otp.line2}}"],
      ["n", "{{email.otp.line3}}"],
      ["ic", data.qrcode],
      ["n", "{{email.otp.line4}}"],
      ["c", data.secret],
      ["s", "{{email.otp.line5}}"]
    ],
    req.lang
  );
  if (!sent) {
    await req.revertOtp(data.old);
    return error("{{error.nosendconfirm}}");
  }

  res.putState("otp-success", true);
  res.redirect("/" + req.lang + "/account/update-otp");
};
