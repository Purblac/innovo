// functions/api/verify.js
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { token, formData } = await request.json();
        console.log(formData)
        const verifyResponse = await fetch(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    secret: env.TURNSTILE_SECRET_KEY,
                    response: token
                })
            }
        );

        const verifyData = await verifyResponse.json();

        if (!verifyData.success) {
            return new Response(JSON.stringify({
                success: false,
                message: 'CAPTCHA verification failed',
                errors: verifyData['error-codes']
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        const brevoResponse = await fetch(
            'https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': env.BREVO_API_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: {
                        name: "Innovo Synergy Website",
                        email: "no-reply@innovosynergy.com"
                    },
                    to: [{
                        email: "contact@innovosynergy.com",
                        name: "Innovo Synergy Team"
                    }],
                    subject: `New Contact Form: ${formData.subject}`,
                    htmlContent: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f9f9f9;
                  border-radius: 10px;
                }
                .header {
                  background-color: #d97706;
                  color: white;
                  padding: 20px;
                  border-radius: 10px 10px 0 0;
                  text-align: center;
                }
                .content {
                  background-color: white;
                  padding: 30px;
                  border-radius: 0 0 10px 10px;
                }
                .field {
                  margin-bottom: 20px;
                  padding-bottom: 15px;
                  border-bottom: 1px solid #eee;
                }
                .label {
                  font-weight: bold;
                  color: #d97706;
                  margin-bottom: 5px;
                }
                .value {
                  color: #555;
                  margin-top: 5px;
                }
                .footer {
                  text-align: center;
                  margin-top: 20px;
                  padding-top: 20px;
                  border-top: 1px solid #eee;
                  color: #888;
                  font-size: 12px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>New Contact Form Submission</h1>
                  <p>Innovo Synergy Website</p>
                </div>
                <div class="content">
                  <div class="field">
                    <div class="label">Full Name:</div>
                    <div class="value">${formData.fullName}</div>
                  </div>
                  
                  <div class="field">
                    <div class="label">Email:</div>
                    <div class="value"><a href="mailto:${formData.email}">${formData.email}</a></div>
                  </div>
                  
                  <div class="field">
                    <div class="label">Phone:</div>
                    <div class="value">${formData.phone || 'Not provided'}</div>
                  </div>
                  
                  <div class="field">
                    <div class="label">Subject:</div>
                    <div class="value">${formData.subject}</div>
                  </div>
                  
                  <div class="field">
                    <div class="label">Message:</div>
                    <div class="value">${formData.message.replace(/\n/g, '<br>')}</div>
                  </div>
                  
                  <div class="footer">
                    <p>This email was sent from your Innovo Synergy contact form.</p>
                    <p>Submitted on ${new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
                    textContent: `
New Contact Form Submission

Name: ${formData.fullName}
Email: ${formData.email}
Phone: ${formData.phone || 'Not provided'}
Subject: ${formData.subject}

Message:
${formData.message}

---
Submitted on ${new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}
          `
                })
            }
        );

        const brevoData = await brevoResponse.json();

        if (brevoResponse.ok) {
            // Email sent successfully
            return new Response(JSON.stringify({
                success: true,
                message: 'Form submitted and email sent successfully',
                messageId: brevoData.messageId
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        } else {
            // Email sending failed
            console.error('Brevo error:', brevoData);
            return new Response(JSON.stringify({
                success: false,
                message: 'CAPTCHA verified but email sending failed',
                error: brevoData
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

    } catch (error) {
        console.error('Server error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: 'Server error',
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// Handle OPTIONS for CORS
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}