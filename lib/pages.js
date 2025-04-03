const pages = `
  pages/home

    *account/auth, account, Account
      account/settings/chpw, change-password, Change Password
      account/settings/uotp, update-otp, Update Authenticator
    account/noauth, account, Account
      account/auth/login, login, Login
      account/auth/register, register, Register
      -, reset
        account/reset/request, request, Reset Account
        account/reset/confirm, confirm, Reset Account

    pages/aboutme, about, About Me
    pages/imprint, imprint, Imprint
    pages/privacy, privacy, Privacy Policy
`;

const notfound = {
  "id": "pages/notfound.html",
  "title": "gXLg.dev - Not Found",
  "navbar": [],
  "status": 404
};
const noauth = {
  "id": "pages/noauth.html",
  "title": "gXLg.dev - Please Login",
  "navbar": [],
  "status": 401
};

const struct = { "root": {} };
const parts = pages.split("\n").filter(p => p.trim().length);
struct.root.id = parts[0].trim();
const path = [[parts[0].match(/^[ ]+/)[0].length, [struct.root]]];
for (const part of parts.slice(1)) {
  const nws = part.match(/^[ ]+/)[0].length;
  const ows = path[0][0];
  if (nws > ows) {
    path.unshift([nws, []]);
  } else if (nws < ows) {
    while (path[0][0] > nws) {
      const last = path.shift();
      path[0][1][path[0][1].length - 1].subpages = last[1];
    }
    if (path[0][0] != nws) throw new Error("Whitespace mismatch");
  }
  const [a, b, c] = part.trim().split(", ");
  const auth = a.startsWith("*");
  const id = auth ? a.slice(1) : a;
  const item = {
    "id": id == "-" ? null : id,
    "match": new RegExp("^" + b + "$"),
    "title": c ?? null,
    auth
  };
  path[0][1].push(item);
}
const last = path.shift();
path[0][1][path[0][1].length - 1].subpages = last[1];

function getPage(rpath, auth) {
  if (rpath == null) return notfound;
  const path = rpath.split(/\/+/).filter(p => p);

  let final = struct.root;
  const navbar = [];
  let cpath = "";
  let login = false;
  while (path.length) {
    const f = path.shift();
    if (!final.subpages) return notfound;
    const np = final.subpages.filter(p => p.match.test(f));
    if (!np.length) return notfound;
    login = false;
    let current = null;
    for (const n of np) {
      if (n.auth && auth == null) {
        login = true;
        current = n;
        continue;
      }
      login = false;
      current = n;
      break;
    }

    cpath += "/" + f;
    if (current.id && current.title) navbar.push([current.title, cpath]);
    final = current;
  }
  if (!final.id) return notfound;
  if (login) return noauth;

  const t = ["gXLg.dev"];
  if (final.title) t.push(final.title);

  return {
    "id": final.id + ".html",
    "title": t.join(" - "),
    "status": 200,
    navbar
  };
}

module.exports = { getPage };

