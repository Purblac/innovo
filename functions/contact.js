export async function onRequestPost({ request, env }) {
    try {
        const { name, email, message, phone_number } = await request.json();

        if (!name || !email || !message || !phone_number) {
            return new Response("Missing fields", { status: 400 });
        }

        const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": env.BREVO_API_KEY,
            },
            body: JSON.stringify({
                sender: {
                    name: "Website Contact",
                    email: "no-reply@fernai.net",
                },
                to: [{
                    email: "contact@fernai.net",
                    name: "FernAI Automation",
                }, ],
                replyTo: {
                    email: email,
                    name: name,
                },
                subject: "New Contact Form Submission",
                htmlContent: `
            <h3>New Message</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>'
            <p><strong>Phone Number:</strong> ${phone_number}</p>
            <p>Message ${message}</p>
          `,
            }),
        });

        if (!brevoRes.ok) {
            const err = await brevoRes.text();
            return new Response(err, { status: 500 });
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch {
        return new Response("Invalid request", { status: 400 });
    }
}