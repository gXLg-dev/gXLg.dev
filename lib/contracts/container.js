const { same_user } = require(".");

module.exports = async (req, res, data) => {
  if (
    data == null || (
      !req.admin && !(await same_user(data.id, req.hashed(req.auth)))
    )
  ) {
    return req.lang + "/contracts/noaccess.html";
  }
  return data.lang + "/contracts/" + ({
    1: "offer",
    2: "running",
    3: "cancelled",
    4: "paid"
  }[data.status]) + ".html";

};
