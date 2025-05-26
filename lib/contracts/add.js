const { propose_contract } = require(".");

module.exports = async (req, res) => {
  function error(value) {
    res.putState("offer-error", value);
    res.redirect("/" + req.lang + "/account");
  }
  for (const field of ["email", "name", "dev", "host", "lang"]) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("{{error.field:field." + field + "}}");
    }
  }
  const { email, name, dev, host, lang } = req.body;
  const d = parseFloat(dev);
  if (isNaN(d)) {
    return error("The 'dev' should be a number");
  }
  const h = parseFloat(host);
  if (isNaN(h)) {
    return error("The 'host' should be a number");
  }
  if (name.length > 50) {
    return error("The 'name' can't be longer than 50 characters!");
  }
  if (lang.length > 2) {
    return error("The 'lang' can't be longer than 2 characters!");
  }
  const he = req.hashed(email);

  await propose_contract(he, name, Math.round(d * 100), Math.round(h * 100), lang);
  res.redirect("/" + req.lang + "/account");
};
