export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { imie, email, tel, uwagi, konfiguracja } = req.body

  if (!imie || !email) {
    return res.status(400).json({ error: 'Brak wymaganych pól' })
  }

  const tresc = `
    <h2 style="color:#1a1a16;font-family:Arial,sans-serif;margin-bottom:16px">
      Nowe zgłoszenie z konfiguratora — lesno-meble.pl
    </h2>
    <table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
      <tr><td style="padding:8px 12px;font-weight:bold;width:160px;background:#f7f3ed">Imię i nazwisko</td><td style="padding:8px 12px">${imie}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:bold;background:#f7f3ed">Email klienta</td><td style="padding:8px 12px"><a href="mailto:${email}">${email}</a></td></tr>
      <tr><td style="padding:8px 12px;font-weight:bold;background:#f7f3ed">Telefon</td><td style="padding:8px 12px">${tel || '—'}</td></tr>
      ${konfiguracja ? konfiguracja.map((row, i) =>
        `<tr><td style="padding:8px 12px;font-weight:bold;background:${i%2===0?'#fff':'#f7f3ed'}">${row[0]}</td><td style="padding:8px 12px;background:${i%2===0?'#fff':'#f7f3ed'}">${row[1]}</td></tr>`
      ).join('') : ''}
      ${uwagi ? `<tr><td style="padding:8px 12px;font-weight:bold;background:#f7f3ed">Uwagi</td><td style="padding:8px 12px">${uwagi}</td></tr>` : ''}
    </table>
    <p style="font-family:Arial,sans-serif;font-size:11px;color:#999;margin-top:20px;border-top:1px solid #eee;padding-top:10px">
      Wiadomość wysłana automatycznie z konfiguratora lesno-meble.pl
    </p>
  `

  try {
    // Sender: używamy Gmail jako nadawcy (zweryfikowany w Brevo)
    // Odbiorca: kontakt@lesno-meble.pl
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: 'Konfigurator LESNO',
          email: 'poseydongroup.tech@gmail.com'  // Gmail — zweryfikowany w Brevo
        },
        to: [{ email: 'kontakt@lesno-meble.pl', name: 'LESNO Meble' }],
        replyTo: { email: email, name: imie },
        subject: `Nowe zgłoszenie: ${konfiguracja?.[0]?.[1] || 'mebel'} — ${imie}`,
        htmlContent: tresc
      })
    })

    if (response.ok || response.status === 201) {
      return res.status(200).json({ success: true })
    } else {
      const err = await response.json()
      console.error('Brevo error:', err)
      return res.status(500).json({ error: err.message || 'Błąd Brevo' })
    }
  } catch (err) {
    console.error('Handler error:', err)
    return res.status(500).json({ error: err.message })
  }
}
