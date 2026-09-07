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

function listValues(value, maxItems = 20, maxLength = 120) {
  const values = Array.isArray(value) ? value : [value];
  return values.map((item) => singleLine(item, maxLength)).filter(Boolean).slice(0, maxItems);
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
      childDob: singleLine(submission.childDob, 20),
      timeZone: singleLine(submission.timeZone, 80),
      challenge: multiLine(submission.challenge, 1500),
      typicalPattern: multiLine(submission.typicalPattern, 2000),
      daytimeSchedule: multiLine(submission.daytimeSchedule, 2000),
      bedtimeRoutine: multiLine(submission.bedtimeRoutine, 1500),
      sleepOutfit: singleLine(submission.sleepOutfit, 300),
      sleepingArrangement: multiLine(submission.sleepingArrangement, 1500),
      totalSleep: singleLine(submission.totalSleep, 120),
      pacifierUse: singleLine(submission.pacifierUse, 120),
      sleepProps: listValues(submission.sleepProps),
      nutrition: listValues(submission.nutrition),
      nighttimeFeedings: singleLine(submission.nighttimeFeedings, 120),
      personality: listValues(submission.personality),
      methodsTried: multiLine(submission.methodsTried, 1200),
      milestones: listValues(submission.milestones),
      cryingComfort: singleLine(submission.cryingComfort, 180),
      additionalInfo: multiLine(submission.additionalInfo, 2500),
      goals: multiLine(submission.goals, 1500),
      familyValues: multiLine(submission.familyValues, 1200),
      consultationWindow: singleLine(submission.consultationWindow, 200),
      preferredStartDate: singleLine(submission.preferredStartDate, 20),
      howHeard: singleLine(submission.howHeard, 120),
      referrerName: singleLine(submission.referrerName, 120),
      leadSource: singleLine(submission.leadSource, 80) || "direct",
      leadCampaign: singleLine(submission.leadCampaign, 80),
      medicalConcern: singleLine(submission.medicalConcern, 10),
      pediatricianApproval: submission.pediatricianApproval === true,
      termsAccepted: submission.termsAccepted === true,
      signatureName: singleLine(submission.signatureName, 100),
      consent: submission.consent === true,
    };

    const required = [
      intake.parentName,
      intake.email,
      intake.phone,
      intake.preferredContact,
      intake.childFirstName,
      intake.childAge,
      intake.timeZone,
      intake.challenge,
      intake.typicalPattern,
      intake.daytimeSchedule,
      intake.sleepingArrangement,
      intake.pacifierUse,
      intake.nighttimeFeedings,
      intake.cryingComfort,
      intake.goals,
      intake.consultationWindow,
      intake.signatureName,
    ];
    if (
      required.some((value) => !value) ||
      !emailPattern.test(intake.email) ||
      !intake.consent ||
      !intake.pediatricianApproval ||
      !intake.termsAccepted
    ) {
      return json({ error: "Complete all required fields and confirm each client acknowledgment." }, 400);
    }
    if (intake.medicalConcern !== "no") {
      return json({ error: "Please contact your child's pediatrician before purchasing." }, 400);
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_APP_PASSWORD;
    // Sleep SOS requests always go directly to Emily. Keep this explicit so a
    // guide-signup override cannot accidentally reroute a paid-pilot intake.
    const notificationEmail = "emily@renewed.rest";
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
          `Date of birth: ${intake.childDob || "Not provided"}`,
          `Time zone: ${intake.timeZone}`,
          `Consultation windows: ${intake.consultationWindow}`,
          `Preferred start date: ${intake.preferredStartDate || "No preference"}`,
          `Referral source: ${intake.leadSource}`,
          `Campaign: ${intake.leadCampaign || "Not provided"}`,
          `How they heard about Renewed Rest: ${intake.howHeard || "Not provided"}`,
          `Referring friend: ${intake.referrerName || "Not provided"}`,
          "",
          "Primary challenge:",
          intake.challenge,
          "",
          "Nighttime pattern:",
          intake.typicalPattern,
          "",
          "Daytime sleep schedule:",
          intake.daytimeSchedule,
          "",
          "Bedtime routine:",
          intake.bedtimeRoutine || "Not provided",
          "",
          `Sleep outfit: ${intake.sleepOutfit || "Not provided"}`,
          "Sleeping arrangement:",
          intake.sleepingArrangement,
          `Estimated total sleep: ${intake.totalSleep || "Not provided"}`,
          `Pacifier: ${intake.pacifierUse}`,
          `Sleep props: ${intake.sleepProps.join(", ") || "None selected"}`,
          `Nutrition: ${intake.nutrition.join(", ") || "Not provided"}`,
          `Nighttime feedings: ${intake.nighttimeFeedings}`,
          "",
          `Personality: ${intake.personality.join(", ") || "Not provided"}`,
          "Methods or programs already tried:",
          intake.methodsTried || "Not provided",
          `Developmental milestones: ${intake.milestones.join(", ") || "Not provided"}`,
          `Comfort with crying: ${intake.cryingComfort}`,
          "",
          "Additional context and questions:",
          intake.additionalInfo || "Not provided",
          "",
          "Goals for Sleep SOS:",
          intake.goals,
          "",
          "Family values or boundaries:",
          intake.familyValues || "Not provided",
          "",
          "Medical/safety screen: No current concern reported",
          "Medical/coaching acknowledgment: Accepted",
          "Pediatrician approval acknowledgment: Accepted",
          "Client terms acknowledgment: Accepted",
          `Typed acknowledgment: ${intake.signatureName}`,
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
