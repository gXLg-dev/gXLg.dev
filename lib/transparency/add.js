const { array } = require(".");

module.exports = async (req, res) => {
  function error(value) {
    res.putState("transparency-error", value);
    res.redirect("/" + req.lang + "/account");
  }
  for (const field of ["value", "text"]) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("{{error.field:field." + field + "}}");
    }
  }
  const { value, text } = req.body;
  const v = parseFloat(value);
  if (isNaN(v)) {
    return error("The value should be a number");
  }
  const t = text.length > 50 ? text.slice(0, 47) + "..." : text;
  await array(e => e.push({ "value": Math.round(v * 100), "text": t }));
  res.redirect("/" + req.lang + "/account");
};
