module.exports = async (req, res) => {
  function error(value) {
    const s = new URLSearchParams();
    if (req.body.verify) s.set("verify", req.body.verify);
    if (req.body.email) s.set("email", req.body.email);
    res.putState("confirm-error", value);
    res.redirect("/account/reset/confirm" + (s.size ? "?" + s : ""));
  }

  for (const field of ["email", "verify"]) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("The field '" + field + "' is required and can't be empty");
    }
  }
  if (!(await req.verifyHuman("confirm-reset"))) {
    return error("Test couldn't be verified, try again");
  }
  if (!(await req.confirmReset())) {
    return error("Couldn't reset the account");
  }

  res.putState("confirm-success", true);
  res.redirect("/account/reset/confirm");
};

