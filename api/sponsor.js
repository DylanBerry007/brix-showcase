// Receives the "Sponsor this event?" form and emails it via FormSubmit.
// The destination address lives only here on the server, never in the page.
const TO = process.env.SPONSOR_TO || "dylan@netwrk.vip";
const SITE = "https://brix-showcase.vercel.app";

const clean = (v, n = 2000) => String(v ?? "").trim().slice(0, n);

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ success: false });
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};
  if (b.botcheck) return res.status(200).json({ success: true }); // honeypot
  const name = clean(b.name, 200), email = clean(b.email, 200);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ success: false, message: "Name and a valid email are required." });
  const company = clean(b.company, 200), phone = clean(b.phone, 60), message = clean(b.message);
  const payload = {
    _subject: `Sponsor inquiry: Smash-Nashville Showcase${company ? " (" + company + ")" : ""}`,
    _replyto: email, _template: "table", _captcha: "false",
    Name: name, Email: email, Company: company || "-", Phone: phone || "-", Message: message || "-",
  };
  try {
    const r = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(TO)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Origin: SITE, Referer: SITE + "/" },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    const ok = r.ok && String(j.success) === "true";
    if (!ok) console.error("formsubmit", r.status, j);
    return res.status(ok ? 200 : 502).json({ success: ok });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ success: false });
  }
};
