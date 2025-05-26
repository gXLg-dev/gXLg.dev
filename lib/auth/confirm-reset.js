module.exports = async (req, res) => {
  function error(value) {
    const s = new URLSearchParams();
    if (req.body.verify) s.set("verify", req.body.verify);
    if (req.body.email) s.set("email", req.body.email);
    res.putState("confirm-error", value);
    res.redirect("/" + req.lang + "/account/reset/confirm" + (s.size ? "?" + s : ""));
  }

  for (const field of ["email", "verify"]) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("{{error.field:field." + field + "}}");
    }
  }
  if (!(await req.verifyHuman("confirm-reset"))) {
    return error("{{error.turnstile}}");
  }
  if (!(await req.confirmReset())) {
    return error("{{error.noreset}}");
  }

  res.putState("confirm-success", true);
  res.redirect("/" + req.lang + "/account/reset/confirm");
};

