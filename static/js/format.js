function format_text(text) {
  let nt = text;
  for (const [w, code] of text.matchAll(/`(.*?)`/g)) {
    let res = code;
    if (code[0] == "$") {
      if (code == "$age") {
        res = Math.floor((Date.now() - 1093989600000) / 31536000000);
      }
    }
    nt = nt.replace(w, "<span class='keyword'>" + res + "</span>");
  }
  return nt;
}

const micons = document.querySelectorAll("[micon]");
for (const icon of micons) {
  const i = document.createElement("i");
  i.classList.add("material-symbols-outlined");
  i.classList.add("micon");
  i.style.setProperty("--content", "'" + icon.getAttribute("micon") + "'");
  icon.insertBefore(i, icon.firstChild);
  icon.removeAttribute("micon");
}

const dicons = document.querySelectorAll("[dicon]");
for (const icon of dicons) {
  const i = document.createElement("i");
  i.classList.add("devicon-" + icon.getAttribute("dicon"));
  i.classList.add("dicon");
  icon.insertBefore(i, icon.firstChild);
  icon.removeAttribute("dicon");
}

const ricons = document.querySelectorAll("[ricon]");
for (const icon of ricons) {
  const i = document.createElement("i");
  i.classList.add("ri-" + icon.getAttribute("ricon"));
  i.classList.add("ricon");
  icon.insertBefore(i, icon.firstChild);
  icon.removeAttribute("ricon");
}

for (const p of document.querySelectorAll(".p")) {
  const [h, t] = p.querySelectorAll("div");
  h.classList.add("heading");
  t.classList.add("text");

  t.innerHTML = format_text(t.innerHTML);
}
