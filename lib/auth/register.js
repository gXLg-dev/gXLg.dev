const { PROD } = require("../..");

const { verifyCaptcha } = require("../captcha.js");
const { sendMail } = require("../mail.js");

const EMAIL = /^(?:[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;

module.exports = async (req, res) => {
  function error(value) {
    res.putState("register-error", value);
    res.redirect("/account/register");
  }

  for (const field of ["email", "password", "repeat"].concat(PROD ? "captcha" : [])) {
    if (req.body[field] == null || req.body[field] == "") {
      return error("The field '" + field + "' is required and cannot be empty");
    }
  }
  const { email, password, repeat, captcha } = req.body;

  if (email.length > 254) {
    return error("Email can't be longer than 254 characters");
  }

  if (!EMAIL.test(email)) {
    return error("Email address has a wrong format");
  }

  if (password != repeat) {
    return error("Passwords do not match");
  }

  if (password.length < 8) {
    return error("Password must have at least 8 characters");
  }

  let lower = 0;
  let upper = 0;
  let number = 0;
  let special = 0;
  for (const letter of password) {
    if (letter.match(/[a-z]/)) lower ++;
    else if (letter.match(/[A-Z]/)) upper ++;
    else if (letter.match(/[0-9]/)) number ++;
    else special ++;
  }
  const secure = lower * upper * number * special;
  if (!secure) {
    return error("Password must have at least one of lowercase, uppercase, number and special character");
  }

  if (!(await verifyCaptcha(captcha))) {
    return error("Captcha could not be verified, try again");
  }

  const v = await req.register();
  if (!v) {
    return error("This email is already registered");
  }

  // verification

  const link = "https://gxlg.dev/account/login?verify=" + v;
  const sent = await sendMail(
    email,
    "Email Confirmation 🤖",
    "Confirm your email adress",
    [
      ["", "Thanks for registering on gXLg.dev!"],
      ["", "To finish your registration process, please login using this link:"],
      ["c", "<a href='" + link + "' style='color: #0a0807; text-decoration: none;'>" + link + "</a>"],
      ["s", "If you didn't request this email, you can ignore it"]
    ]
  );

  if(!sent) {
    return error("We could not send the confirmation mail, please use another address");
  }

  res.redirect("/account/ready");
};
