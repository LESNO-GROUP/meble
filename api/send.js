export default async function handler(req, res) {
  // Tylko POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { imie, email, tel, uwagi, konfiguracja } = req.body

  if (!imie || !email) {
    return res.status(400).json({ error: 'Brak wymaganych pól' })
  }

  const tresc = `
    <h2 style="color:#1a1a16;font-family:Arial,sans-serif">Nowe zgłoszenie — lesno-meble.pl</h2>
    <table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;font-weight:bold;width:160px">Imię i nazwisko</td><td style="padding:8px">${imie}</td></tr>
      <tr style="background:#f7f3ed"><td style="padding:8px;font-weight:bold">Email klienta</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
      <tr><td style="padding:8px;font-weight:bold">Telefon</td><td style="padding:8px">${tel || '—'}</td></tr>
      ${konfiguracja ? konfiguracja.map((row, i) =>
        `<tr style="${i%2===0?'':'background:#f7f3ed'}"><td style="padding:8px;font-weight:bold">${row[0]}</td><td style="padding:8px">${row[1]}</td></tr>`
      ).join('') : ''}
      ${uwagi ? `<tr><td style="padding:8px;font-weight:bold">Uwagi</td><td style="padding:8px">${uwagi}</td></tr>` : ''}
    </table>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#999;margin-top:20px">
      Wiadomość wysłana automatycznie z konfiguratora lesno-meble.pl
    </p>
  `

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { name: 'Konfigurator LESNO', email: 'kontakt@lesno-meble.pl' },
        to: [{ email: 'kontakt@lesno-meble.pl', name: 'LESNO Group' }],
        replyTo: { email: email, name: imie },
        subject: `Nowe zgłoszenie: ${konfiguracja?.[0]?.[1] || 'mebel'} — ${imie}`,
        htmlContent: tresc
      })
    })

    if (response.ok || response.status === 201) {
      return res.status(200).json({ success: true })
    } else {
      const err = await response.json()
      return res.status(500).json({ error: err.message || 'Błąd Brevo' })
    }
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
