import nodemailer from "nodemailer";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    let submission;
    try {
      submission = await request.json();
    } catch {
      return json({ error: "Invalid request" }, 400);
    }

    const firstName = String(submission.firstName || "").trim().slice(0, 80);
    const email = String(submission.email || "").trim().toLowerCase().slice(0, 254);

    // Hidden field: bots commonly fill it, people never see it.
    if (submission.website) return json({ ok: true });
    if (!firstName || !emailPattern.test(email)) {
      return json({ error: "Enter a valid name and email address" }, 400);
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_APP_PASSWORD;
    const notificationEmail = process.env.GUIDE_NOTIFICATION_EMAIL || smtpUser;

    if (!smtpUser || !smtpPassword || !notificationEmail) {
      console.error("Guide signup email is not configured");
      return json({ error: "Email notification is not configured" }, 503);
    }

    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPassword },
    });

    try {
      await transport.sendMail({
        from: `Renewed Rest Website <${smtpUser}>`,
        to: notificationEmail,
        replyTo: email,
        subject: `Free guide signup: ${firstName}`,
        text: [
          "A visitor requested the Renewed Rest free guide.",
          "",
          `Name: ${firstName}`,
          `Email: ${email}`,
          "",
          "Add this address to the newsletter BCC list when ready.",
        ].join("\n"),
      });
    } catch (error) {
      console.error("Guide signup notification failed", {
        code: error?.code,
        responseCode: error?.responseCode,
      });
      return json({ error: "Email notification could not be sent" }, 502);
    }

    return json({ ok: true });
  },
};
