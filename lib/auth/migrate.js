const { migrate } = require("../contracts");

module.exports = async (req, res) => {
  function error(value) {
    res.putState("migrate-error", value);
    res.redirect("/" + req.lang + "/account");
  }
  for (const field of ["email", "new-email"]) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("{{error.field:field." + field + "}}");
    }
  }
  const s = await req.migrate();
  if (!s) return error("Could not migrate account");
  await migrate(req.hashed(req.body.email), req.hashed(req.body.new_email));
  res.redirect("/" + req.lang + "/account");
}
