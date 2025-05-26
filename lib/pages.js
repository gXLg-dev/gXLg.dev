const pages = `
  pages/home

    *account/auth, account, {{title.account}}
      account/settings/chpw, change-password, {{title.chpw}}
      account/settings/uotp, update-otp, {{title.uotp}}
      -, contracts
        contracts/root, [0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}, {{title.contract}}

    account/noauth, account, {{title.account}}
      account/auth/login, login, {{title.login}}
      account/auth/register, register, {{title.register}}
      -, reset
        account/reset/request, request, {{title.reset}}
        account/reset/confirm, confirm, {{title.reset}}

    pages/langs, langs, {{title.langs}}
    pages/aboutme, about, {{title.aboutme}}
    pages/imprint, imprint, {{title.imprint}}
    pages/privacy, privacy, {{title.privacy}}
    pages/transparency, transparency, {{title.transp}}

    pages/termlist, terms, {{title.terms}}
      pages/terms, [0-9][0-9]-[0-9][0-9]-[0-9][0-9], {{title.terms}}
`;

const notfound = {
  "id": "pages/notfound.html",
  "title": "gXLg.dev - {{title.notfound}}",
  "navbar": [],
  "status": 404
};
const noauth = {
  "id": "pages/noauth.html",
  "title": "gXLg.dev - {{title.noauth}}",
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
while (path.length != 1) {
  const last = path.shift();
  path[0][1][path[0][1].length - 1].subpages = last[1];
}

function getPage(mpath, mauth) {
  const pt = [...mpath];
  let finals = [{ "auth": false, "page": struct.root, "path": "", "navbar": [] }];
  while (pt.length) {
    const f = pt.shift();
    const newFinals = [];
    for (const { auth, page, path, navbar } of finals) {
      if (!page.subpages) continue;
      const np = page.subpages.filter(p => p.match.test(f));
      for (const p of np) {
        const nnav = [...navbar];
        const npath = path + "/" + f;
        if (p.id && p.title) nnav.push([p.title, npath]);
        newFinals.push({
          "auth": auth || p.auth,
          "page": p,
          "path": npath,
          "navbar": nnav
        });
      }
    }
    if (!newFinals.length) return notfound;
    finals = newFinals;
  }

  let final;
  if (mauth != null) {
    final = finals.find(p => p.auth);
    if (final == null) final = finals[0];
  } else {
    final = finals.find(p => !p.auth);
    if (final == null) return noauth;
  }

  const t = ["gXLg.dev"];
  if (final.page.title) t.push(final.page.title);

  return {
    "id": final.page.id + ".html",
    "title": t.join(" - "),
    "status": 200,
    "path": [...mpath],
    "navbar": final.navbar
  };
}

module.exports = { getPage };
