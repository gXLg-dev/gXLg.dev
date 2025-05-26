const nodemailer = require("nodemailer");
const fs = require("fs");
const { mail } = require("../config.json");
const { translate } = require("./translation.js");

const transporter = nodemailer.createTransport({
  "host": "mail.gmx.net",
  "port": 465,
  "secure": true,
  "auth": mail
});

const text = `\
{title}

---

{body}

---

{{email.auto}}`;

const html = `\
<body bgcolor="#fde4fc" leftmargin="10" topmargin="10" marginwidth="10" marginheight="10">
<table width="100%" border="0" cellpadding="5" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 16px; color: #0a0807;">
<tr><td style="color: #422d23; font-size: 26px">{title}</td></tr>
</table>
<table bgcolor="#b85731" width="100%" border="0" cellpadding="5" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 16px; padding: 20px; color: #0a0807;">
{body}
</table>
<table width="100%" border="0" cellpadding="5" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 16px; color: #0a0807;">
<tr><td style="color: #422d23; font-size: 12px">{{email.auto}}</td></tr>
</table>
</body>`;

const convertHTML = {
  "n": t => "<tr><td>" + t + "</td><tr>",
  "c": t => "<tr><td><table bgcolor=\"#f9ae77\" cellpadding=\"5\"><tr><td style=\"font-family: 'Courier New', 'Droid Sans Mono', monospace;\">" + t + "</td></tr></table></td><tr>",
  "s": t => "<tr><td style=\"color: #422d23; font-size: 12px;\">" + t + "</td><tr>",

  "(": t => "<tr><td>" + t,
  ")": t => t + "</td></tr>",

  "l": t => "<a href=\"" + t + "\" style=\"color: #0a0807; text-decoration: none;\">" + t + "</a>",
  "i": t => "<img src=\"" + t + "\">",
  "k": t => "<span style=\"font-family: 'Courier New', 'Droid Sans Mono', monospace; padding: 1px; background-color: #f9ae77;\">" + t + "</span>"
};

const convertTXT = {
  "i": t => "({{email.image}})"
}

async function sendMail(recv, subject, title, body, lang, files) {
  const t = text
    .replace("{title}", title)
    .replace("{body}", body.map(b => {
      let x = b[1];
      for (const c of b[0]) {
        x = convertTXT[c]?.(x) ?? x;
      }
      return x;
    }).join("\n"));

  const h = html
    .replace("{title}", title)
    .replace("{body}", body.map(b => {
      let x = b[1];
      for (const c of b[0]) {
        x = convertHTML[c]?.(x) ?? x;
      }
      return x;
    }).join("\n"));

  const attachments = [];
  for (const filename in (files ?? {})) {
    attachments.push({ filename, "path": files[filename] });
  }
  const st = translate(subject, lang);
  const tt = translate(t, lang);
  const ht = translate(h, lang);

  let info = null;
  try {
    info = await transporter.sendMail({
      "from": '"gXLg.dev" <gxlg@gmx.de>',
      "to": recv,

      "subject": st, "text": tt, "html": ht,

      "attachDataUrls": true,
      attachments
    });
  } catch { }
  const name = new Date().toISOString().replace('T', ' ').substring(0, 23);
  fs.writeFileSync("./mails/" + name + ".json", JSON.stringify({
    "id": info?.messageId ?? null, "receiver": recv,
    "subject": st, "text": tt, "html": ht,
    lang
  }));
  return info != null;
}

module.exports = { sendMail };
