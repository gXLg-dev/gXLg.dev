const { defaultLang } = require("..");

// localization
function translate(txt, l) {
  const lang = require("../langs/" + l + ".json");
  const def = require("../langs/" + defaultLang + ".json");
  let t = txt;
  const all = new Set(txt.match(/[{][{][a-z][a-z0-9-.]+(:[^}:]+)*[}][}]/g) ?? []);
  for (const ph of all) {
    const key = ph.slice(2, -2);
    if (key.includes(":")) {
      const p = key.split(":")
      const akey = p[0];
      let tr = lang[akey] ?? def[akey] ?? key;
      for (let i = 1; i < p.length; i++) {
        const pi = p[i];
        if (pi.match(/^[a-z][a-z0-9-.]+$/)) {
          tr = tr.replaceAll("$" + i, lang[pi] ?? def[pi] ?? pi);
        } else {
          tr = tr.replaceAll("$" + i, pi);
        }
      }
      t = t.replaceAll(ph, tr);
    } else {
      const tr = lang[key] ?? def[key] ?? key;
      t = t.replaceAll(ph, tr);
    }
  }
  return t;
}

module.exports = { translate };
