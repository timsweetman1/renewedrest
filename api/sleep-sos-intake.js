import nodemailer from "nodemailer";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function singleLine(value, maxLength) {
  return String(value || "").replace(/[\r\n\t]+/g, " ").trim().slice(0, maxLength);
}

function multiLine(value, maxLength) {
  return String(value || "").replace(/\r/g, "").trim().slice(0, maxLength);
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

    // Hidden field: bots commonly fill it, people never see it.
    if (submission.website) return json({ ok: true });

    const intake = {
      parentName: singleLine(submission.parentName, 100),
      email: singleLine(submission.email, 254).toLowerCase(),
      phone: singleLine(submission.phone, 40),
      preferredContact: singleLine(submission.preferredContact, 30),
      childFirstName: singleLine(submission.childFirstName, 80),
      childAge: singleLine(submission.childAge, 80),
      challenge: multiLine(submission.challenge, 1500),
      typicalPattern: multiLine(submission.typicalPattern, 2000),
      familyValues: multiLine(submission.familyValues, 1200),
      consultationWindow: singleLine(submission.consultationWindow, 200),
      medicalConcern: singleLine(submission.medicalConcern, 10),
      consent: submission.consent === true,
    };

    const required = [
      intake.parentName,
      intake.email,
      intake.phone,
      intake.preferredContact,
      intake.childFirstName,
      intake.childAge,
      intake.challenge,
      intake.typicalPattern,
      intake.consultationWindow,
    ];
    if (required.some((value) => !value) || !emailPattern.test(intake.email) || !intake.consent) {
      return json({ error: "Complete all required fields and confirm the coaching acknowledgment." }, 400);
    }
    if (intake.medicalConcern !== "no") {
      return json({ error: "Please contact your child's pediatrician before purchasing." }, 400);
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_APP_PASSWORD;
    const notificationEmail = process.env.SLEEP_SOS_NOTIFICATION_EMAIL || process.env.GUIDE_NOTIFICATION_EMAIL || smtpUser;
    if (!smtpUser || !smtpPassword || !notificationEmail) {
      console.error("Sleep SOS intake email is not configured");
      return json({ error: "The intake notification is not configured." }, 503);
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
        replyTo: intake.email,
        subject: `Sleep SOS pilot request: ${intake.parentName}`,
        text: [
          "A parent submitted the private Sleep SOS pilot intake.",
          "",
          `Parent/caregiver: ${intake.parentName}`,
          `Email: ${intake.email}`,
          `Phone: ${intake.phone}`,
          `Preferred follow-up: ${intake.preferredContact}`,
          `Child: ${intake.childFirstName}`,
          `Age: ${intake.childAge}`,
          `Consultation windows: ${intake.consultationWindow}`,
          "",
          "Primary challenge:",
          intake.challenge,
          "",
          "Typical pattern:",
          intake.typicalPattern,
          "",
          "Family values or boundaries:",
          intake.familyValues || "Not provided",
          "",
          "Medical/safety screen: No current concern reported",
          "Coaching acknowledgment: Accepted",
          "",
          "Confirm payment in Stripe before beginning fulfillment.",
        ].join("\n"),
      });
    } catch (error) {
      console.error("Sleep SOS intake notification failed", {
        code: error?.code,
        responseCode: error?.responseCode,
      });
      return json({ error: "The intake notification could not be sent." }, 502);
    }

    return json({ ok: true });
  },
};
