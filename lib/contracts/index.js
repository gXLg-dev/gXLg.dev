const { BadTable, BadArray, BadArrayTable } = require("badb");
const crypto = require("crypto");
const { base } = require("../..");
const { sendMail } = require("../mail.js");

const { stripe_key } = require("../../config.json");
const stripe = require("stripe")(stripe_key);

const terms = require("../../terms/list.json");

const STATUS_OPEN = 1;
const STATUS_RUNNING = 2;
const STATUS_CANCELLED = 3;
const STATUS_FINISHED = 4;

const contracts = new BadTable("./db/contracts.badb", {
  "key": "id",
  "values": [
    { "name": "id", "maxLength": 36 },

    // CONST
    { "name": "name", "maxLength": 50 },
    { "name": "user", "maxLength": 43 },
    { "name": "dev", "type": "uint16" },
    { "name": "host", "type": "uint16" },
    { "name": "lang", "maxLength": 2 },
    { "name": "terms", "maxLength": 8 },

    // FINAL
    { "name": "started_at", "maxLength": 16 },
    { "name": "cancelled_at", "maxLength": 16 },

    { "name": "stripe_id", "maxLength": 255 }, // session if OPEN, else subscription
    { "name": "status", "type": "uint8" }
  ]
});

const contracts_list = new BadArray("./db/contracts_list.badb", {
  "values": [{ "name": "id", "maxLength": 36 }]
});

const user_to_contracts = new BadArrayTable("./db/user_to_contracts.badb", {
  "maxKeyLength": 43, "values": [{ "name": "id", "maxLength": 36 }]
});

async function propose_contract(user, name, develop, host, lang) {
  const id = crypto.randomUUID();

  const session = await stripe.checkout.sessions.create({
    "line_items": [
      {
        "price_data": {
          "currency": "eur", "unit_amount": develop,
          "product_data": { "name": "Development" }
        },
        "quantity": 1
      },
      ...(host == 0 ? [] : [{
        "price_data": {
          "currency": "eur", "unit_amount": host,
          "product_data": { "name": "Hosting" },
          "recurring": { "interval": "month" }
        },
        "quantity": 1
      }])
    ],

    ...(host == 0 ? ({
      "mode": "payment",
      "customer_creation": "always"
    }) : ({
      "mode": "subscription"
    })),

    "locale": lang,

    "billing_address_collection" : "required",
    "consent_collection": { "terms_of_service": "required" },

    "success_url": base + "/" + lang + "/landing/contracts/" + id,
    "cancel_url": base + "/" + lang + "/landing/contracts/" + id
  });

  await contracts[id](async e => {
    e.name = name;
    e.user = user;
    e.dev = develop;
    e.host = host;
    e.lang = lang;
    e.terms = terms[0];
    e.stripe_id = session.id;
    e.status = STATUS_OPEN;
  });
  await user_to_contracts[user](e => e.push({ id }));
  await contracts_list(e => e.push({ id }));
}

async function get_url(id) {
  return await contracts[id](async (c, t) => {
    if (!t.exists()) return null;
    if (c.status != STATUS_OPEN) return null;
    const sess = await stripe.checkout.sessions.retrieve(c.stripe_id);
    return sess.url;
  });
}

async function get_contracts(user) {
  const cts = await user_to_contracts[user](e => e);
  return await Promise.all(cts.map(async c => ({
    "id": c.id,
    ...await contracts[c.id](e => e)
  })));
}

async function get_all_contracts() {
  const cts = await contracts_list(e => e);
  return await Promise.all(cts.map(async c => ({
    "id": c.id,
    ...await contracts[c.id](e => e)
  })));
}

async function get_contract(id) {
  return await contracts[id](async (c, t) => {
    if (!t.exists()) return null;
    let url = null;
    if (t.status == STATUS_OPEN) {
      const sess = await stripe.checkout.sessions.retrieve(t.stripe_id);
      url = sess.url;
    }
    return { id, url, ...c };
  });
}

async function cancel_contract(id) {
  return await contracts[id](async c => {
    if ([STATUS_CANCELLED, STATUS_FINISHED].includes(c.status)) return false;
    if (c.status == STATUS_OPEN) {
      await stripe.checkout.sessions.expire(c.stripe_id);
    } else {
      await stripe.subscriptions.cancel(c.stripe_id);
    }
    return true;
  });
}

async function same_user(id, user) {
  return await contracts[id]((c, t) => {
    if (!t.exists()) return false;
    return c.user == user;
  });
}

async function migrate(user, nuser) {
  await user_to_contracts[user](async c => {
    for (const { id } of c) {
      await contracts[id](ct => { ct.user = nuser; });
    }
  });
}

const polling = setInterval(async () => {
  const cts = await contracts_list(e => e);
  await Promise.all(cts.map(async ct => {
    const cid = ct.id;
    await contracts[cid](async (c, t) => {
      let status = c.status;
      let sid = c.stripe_id;
      if (status == STATUS_OPEN) {
        const sess = await stripe.checkout.sessions.retrieve(sid);
        if (sess.status == "complete") {
          status = sess.mode == "subscription" ? STATUS_RUNNING : STATUS_FINISHED;
          sid = sess.subscription;
          if (sess.mode == "subscription" && sid == null) return;
          c.started_at = Date.now().toString();

          // send confirmation
          const { email } = await stripe.customers.retrieve(sess.customer);
          await sendMail(email, "{{email.contract.subject1}}", "{{email.contract.subject1}}", [
            ["n", "{{email.contract.thanks}}"],
            ["n", "{{email.contract.name}}: " + c.name],
            ["(", "ID:"],
            ["k)", cid],
            ["(", "{{email.contract.lang}}:"],
            ["k)", c.lang],
            ["n", "{{email.contract.pay}}"],
            ["n", ""],
            ["n", "{{email.contract.dev:" + (c.dev / 100).toFixed(2) + "}}"],
            ["n", "{{email.contract.host:" + (c.host / 100).toFixed(2) + "}}"],
            ["n", (c.host == 0 ? "{{email.contract.paid}}: " : "{{email.contract.start}}: ") + (new Date(parseInt(c.started_at)).toLocaleString(c.lang))],
            ["n", c.host == 0 ? "{{email.contract.norefund}}" : "{{email.contract.cancellable}}"],
            ["(", "{{email.contract.view}}:"],
            ["l)", base + "/" + c.lang + "/landing/contracts/" + cid],
            ["n", ""],
            ["s", "{{email.contract.terms}}"]
          ], c.lang, { "terms.txt": "./terms/" + c.terms + "/" + c.lang + ".txt" });

        } else if (sess.status == "expired") {
          await contracts_list(e => e.splice(e.findIndex(i => i.id == cid), 1));
          await user_to_contracts[c.user](e => e.splice(e.findIndex(i => i.id == cid), 1));
          t.remove();
          return;
        }
      }
      if (status == STATUS_RUNNING) {
        const sub = await stripe.subscriptions.retrieve(sid);
        if (sub.status == "canceled") {
          status = STATUS_CANCELLED;
          c.cancelled_at = Date.now().toString();

          // send cancellation
          const { email } = await stripe.customers.retrieve(sub.customer);
          await sendMail(email, "{{email.contract.subject2}}", "{{email.contract.subject2}}", [
            ["n", "{{email.contract.cancelled}}"],
            ["n", "{{email.contract.name}}: " + c.name],
            ["(", "ID:"],
            ["k)", cid],
            ["(", "{{email.contract.lang}}:"],
            ["k)", c.lang],
            ["n", "{{email.contract.pay}}"],
            ["n", ""],
            ["n", "{{email.contract.dev:" + (c.dev / 100).toFixed(2) + "}}"],
            ["n", "{{email.contract.host:" + (c.host / 100).toFixed(2) + "}}"],
            ["n", "{{email.contract.start}}: " + (new Date(parseInt(c.started_at)).toLocaleString(c.lang))],
            ["n", "{{email.contract.end}}: " + (new Date(parseInt(c.cancelled_at)).toLocaleString(c.lang))],
            ["(", "{{email.contract.still}}:"],
            ["l)", base + "/" + c.lang + "/landing/contracts/" + cid],
            ["n", ""],
            ["s", "{{email.contract.terms}}"]

          ], c.lang, { "terms.txt": "./terms/" + c.terms + "/" + c.lang + ".txt" });

        }
      }
      c.status = status;
      c.stripe_id = sid;
    });
  }));

}, 10 * 60 * 1000);

module.exports = {
  propose_contract,
  get_contract, get_contracts, get_all_contracts,
  cancel_contract, same_user,
  get_url, migrate,
  polling
};
