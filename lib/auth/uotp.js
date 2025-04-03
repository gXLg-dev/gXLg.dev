const { sendMail } = require("../mail.js");

module.exports = async (req, res) => {
  function error(value) {
    res.putState("otp-error", value);
    res.redirect("/account/update-otp");
  }

  for (const field of ["password"]) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("The field '" + field + "' is required and can't be empty");
    }
  }
  if (!(await req.verifyHuman("update-otp"))) {
    return error("Test couldn't be verified, try again");
  }
  const data = await req.updateOtp();
  if (!data) {
    return error("Couldn't update Authenticator data");
  }

  // verification
  const sent = await sendMail(
    req.auth,
    "New Authenticator Data 🔐",
    "Authenticator data successfully updated",
    [
      ["n", "The data for 2-factor-authentication was updated for your account!"],
      ["n", "Your old connection has been disabled and can't be used to log in anymore."],
      ["n", "To update your data locally, scan the following QR Code with your Authenticator app:"],
      ["ic", data.qrcode],
      ["n", "... or enter this secret:"],
      ["c", data.secret],
      ["s", "If you didn't request an update, please contact me immidiately."]
    ]
  );
  if (!sent) {
    await req.revertOtp(data.old);
    return error("Couldn't send the confirmation mail, please contact me");
  }

  res.putState("otp-success", true);
  res.redirect("/account/update-otp");
};
