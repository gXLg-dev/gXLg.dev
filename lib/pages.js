const pages = {
  "root": {
    "id": "home",
    "subpages": [
      {
        "id": "account/auth",
        "title": "Account",
        "match": /^account$/,
        "auth": true
      },
      {
        "id": "account/noauth",
        "title": "Account",
        "match": /^account$/,
        "subpages": [
          {
            "id": "account/login",
            "title": "Login",
            "match": /^login$/
          },
          {
            "id": "account/register",
            "title": "Register",
            "match": /^register$/
          },
          {
            "id": "account/ready",
            "title": null,
            "match": /^ready$/
          }
        ]
      },
      {
        "id": "aboutme",
        "title": "About Me",
        "match": /^about$/
      },
      {
        "id": "imprint",
        "title": "Imprint",
        "match": /^imprint$/
      }
    ]
  },
  "notfound": {
    "id": "notfound.html",
    "title": "gXLg.dev - Not Found",
    "navbar": [null]
  },
  "noauth": {
    "id": "noauth.html",
    "title": "gXLg.dev - Please Login",
    "navbar": [null]
  }
};

function getPage(rpath, auth) {
  if (rpath == null) return pages.notfound;
  const path = rpath.split(/\/+/).filter(p => p);

  let current = pages.root;
  const navbar = [null];
  let cpath = "";
  while (path.length) {
    const f = path.shift();
    if (!current.subpages) return pages.notfound;
    const np = current.subpages.filter(p => p.match.test(f));
    let login = false;
    let final = null;
    for (const n of np) {
      if (n.auth && auth == null) {
        login = true;
        continue;
      }
      login = false;
      final = n;
      break;
    }
    if (login) return pages.noauth;
    if (final == null) return pages.notfound;

    cpath += "/" + f;
    if (final.id && final.title) navbar.push([final.title, cpath]);
    current = final;
  }
  if (!current.id) return pages.notfound;

  const t = ["gXLg.dev"];
  if (current.title) t.push(current.title);

  return {
    "id": current.id + ".html",
    "title": t.join(" - "),
    navbar
  };
}

module.exports = { getPage };
