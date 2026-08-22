import handler from "../api/guide-signup.js";

async function submit(body) {
  return handler.fetch(new Request("http://localhost/api/guide-signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
}

const invalid = await submit({ firstName: "Test", email: "not-an-email" });
if (invalid.status !== 400) throw new Error("Invalid email was accepted");

const unconfigured = await submit({ firstName: "Test", email: "test@example.com" });
if (unconfigured.status !== 503) throw new Error("Unconfigured SMTP did not fail safely");

console.log("Guide signup endpoint checks passed");
