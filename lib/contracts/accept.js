const { get_url, same_user } = require(".");

module.exports = async (req, res) => {
  function error(value) {
    const id = req.body.id;
    res.putState("accept-error", value);
    res.redirect("/" + req.lang + "/account/contracts/" + id);
  }
  for (const field of ["id"]) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("{{error.field:field." + field + "}}");
    }
  }
  const { id, terms, withdrawal, cancellation } = req.body;
  if (!(await same_user(id, req.hashed(req.auth)))) {
    res.redirect("/" + req.lang + "/account/contracts/" + id);
    return;
  }
  if (terms != "on" || withdrawal != "on" || cancellation != "on") {
    return error("{{error.accept}}");
  }
  const url = await get_url(id);
  if (url == null) {
    return error("{{error.noaccept}}");
  }
  res.redirect(url);
};
