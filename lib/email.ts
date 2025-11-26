export async function sendBookingConfirmation({ email, name, date, serviceName, token }: { email: string; name: string; date: Date; serviceName?: string | null; token?: string }) {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error("BREVO_API_KEY not set");
      return false;
    }
    type Auth = { apiKey: string };
    type TxApi = { authentications: Record<string, Auth>; sendTransacEmail: (payload: unknown) => Promise<unknown> };
    type Smtp = { subject: string; htmlContent: string; sender: { name: string; email: string }; to: { email: string; name: string }[] };
    const Brevo = (await import("@getbrevo/brevo")) as unknown as { TransactionalEmailsApi: new () => TxApi; SendSmtpEmail: new () => Smtp };
    const api = new Brevo.TransactionalEmailsApi();
    api.authentications["apiKey"].apiKey = apiKey;

    const d = new Intl.DateTimeFormat("de-CH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
    const subj = "Terminbestätigung";
    const title = process.env.BREVO_SENDER_NAME || "Barber Shop – Brienz";
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const manageUrl = token ? `${base}/booking/manage/${token}` : base;
    const html = `
      <div style="font-family: Arial, sans-serif; background:#0f0f0f; color:#fff; padding:24px;">
        <div style="max-width:560px; margin:0 auto; border:1px solid #C5A059; border-radius:12px; padding:24px; background:#141414;">
          <h2 style="margin:0 0 12px; color:#C5A059;">${title}</h2>
          <p style="margin:0 0 12px;">Hallo ${name},</p>
          <p style="margin:0 0 12px;">Dein Termin${serviceName ? ` für <strong>${serviceName}</strong>` : ""} am <strong>${d}</strong> wurde bestätigt!</p>
          <p style="margin:0 0 12px;">Solltest du den Termin nicht wahrnehmen können, storniere ihn bitte rechtzeitig.</p>
          <div style="margin:20px 0;">
            <a href="${manageUrl}" style="display:inline-block; padding:10px 14px; background:#C5A059; color:#000; text-decoration:none; border-radius:8px; font-weight:600;">Termin verwalten / stornieren</a>
          </div>
          <hr style="border-color:#2a2a2a; margin:20px 0;" />
          <p style="margin:0; font-size:12px; color:#bdbdbd;">Diese E‑Mail wurde automatisch generiert – bitte nicht antworten.</p>
        </div>
      </div>
    `;

    const payload = new Brevo.SendSmtpEmail();
    payload.subject = subj;
    payload.htmlContent = html;
    payload.sender = { name: title, email: process.env.BREVO_SENDER_EMAIL || "kontakt@barbershop-brienz.ch" };
    payload.to = [{ email, name }];

    await api.sendTransacEmail(payload);
    return true;
  } catch (e) {
    console.error("Brevo sendBookingConfirmation failed", e);
    return false;
  }
}

export async function sendReminderEmail({ to, name, date, time, serviceName }: { to: string; name: string; date: string; time: string; serviceName: string }) {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      return false;
    }
    type Auth = { apiKey: string };
    type TxApi = { authentications: Record<string, Auth>; sendTransacEmail: (payload: unknown) => Promise<unknown> };
    type Smtp = { subject: string; htmlContent: string; sender: { name: string; email: string }; to: { email: string; name: string }[] };
    const Brevo = (await import("@getbrevo/brevo")) as unknown as { TransactionalEmailsApi: new () => TxApi; SendSmtpEmail: new () => Smtp };
    const api = new Brevo.TransactionalEmailsApi();
    api.authentications["apiKey"].apiKey = apiKey;

    const subj = "Erinnerung: Ihr Termin im Barber Shop Brienz";
    const title = process.env.BREVO_SENDER_NAME || "Barber Shop – Brienz";
    const html = `
      <div style="font-family: Arial, sans-serif; background:#0f0f0f; color:#fff; padding:24px;">
        <div style="max-width:560px; margin:0 auto; border:1px solid #C5A059; border-radius:12px; padding:24px; background:#141414;">
          <h2 style="margin:0 0 12px; color:#C5A059;">BARBER SHOP BRIENZ</h2>
          <p style="margin:0 0 12px;">Hallo ${name},</p>
          <p style="margin:0 0 12px;">Wir freuen uns auf Ihren Besuch heute!</p>
          <p style="margin:0 0 12px;"><strong>Termin:</strong> ${date} um ${time}</p>
          <p style="margin:0 0 12px;"><strong>Leistung:</strong> ${serviceName}</p>
          <p style="margin:0 0 12px;">Bitte seien Sie pünktlich.</p>
          <hr style="border-color:#2a2a2a; margin:20px 0;" />
          <div style="margin:0 0 12px;">
            <div style="color:#bdbdbd; font-size:12px;">Barber Shop Brienz, Hauptstrasse 1, 3855 Brienz, +41 76 000 00 00</div>
            <div style="color:#bdbdbd; font-size:12px;">Falls Sie verhindert sind, rufen Sie uns bitte an.</div>
          </div>
        </div>
      </div>
    `;

    const payload = new Brevo.SendSmtpEmail();
    payload.subject = subj;
    payload.htmlContent = html;
    payload.sender = { name: title, email: process.env.BREVO_SENDER_EMAIL || "kontakt@barbershop-brienz.ch" };
    payload.to = [{ email: to, name }];

    await api.sendTransacEmail(payload);
    return true;
  } catch {
    return false;
  }
}
