const { cancel_contract } = require(".");

module.exports = async (req, res) => {
  function error(value) {
    const id = req.body.id;
    res.putState("cancel-error", value);
    res.redirect("/" + req.lang + "/account/contracts/" + id);
  }
  for (const field of ["id"]) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("{{error.field:field." + field + "}}");
    }
  }
  const { id, agree } = req.body;
  if (agree != "on") {
    return error("{{error.cancel}}");
  }
  const success = await cancel_contract(id);
  if (!success) {
    return error("{{error.nocancel}}");
  }

  res.putState("cancel-success", "{{messages.cancelled}}");
  res.redirect("/" + req.lang + "/account/contracts/" + id);
};
