const axios = require("axios");
const crypto = require("crypto");

async function secure(pw) {
  if (pw.length < 8) {
    return "must have at least 8 characters";
  }

  const lpw = pw.toLowerCase();

  // test repeated (max 2)
  if (lpw.match(/(.)\1{2,}/g) != null) {
    return "more than 2 repeated characters";
  }

  // test sequential (static, max 2)
  const seq = [
    "01234567890",
    "abcdefghijklmnopqrstuvwxyz",
    "qwertyuiopasdfghjklzxcvbnm"
  ];

  for (const test of seq) {
    for (let i = 0; i < test.length - 2; i++) {
      const sub = test.slice(i, i + 3);
      const rsub = [...sub].reverse().join("");
      if (lpw.includes(sub) || lpw.includes(rsub)) {
        return "more than 2 sequential characters";
      }
    }
  }

  // test sequential (dynamic, max 2)
  const chars = [...lpw].map(c => c.charCodeAt());
  let asc = 1;
  let desc = 1;

  for (let i = 1, j = 0; i < chars.length; i++, j++) {
    if (chars[i] == chars[j] + 1) {
      asc++;
      desc = 1;
    } else if (chars[i] == chars[j] - 1) {
      asc = 1;
      desc++;
    } else {
      asc = 1;
      desc = 1;
    }

    if (asc > 2 || desc > 2) {
      return "more than 2 sequential characters";
    }
  }

  if (await hibp(pw)) {
    return "it was found in the database of breached passwords";
  }

  return null;
}

// Have I Been Pwned? -> https://haveibeenpwned.com/passwords
async function hibp(pw) {
  const hash = crypto.createHash("sha1").update(pw).digest("hex").toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const res = await axios.get("https://api.pwnedpasswords.com/range/" + prefix);
  const hashes = res.data.split("\n").map(h => h.split(":")[0]);
  return hashes.includes(suffix);
}

module.exports = { secure, hibp };
