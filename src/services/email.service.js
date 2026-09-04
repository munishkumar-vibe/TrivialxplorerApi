const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "MyApp"}" <${process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Failed to send email to ${to}:`, err.message);
    throw err;
  }
};

const sendPasswordResetEmail = async ({ email, firstName, resetURL }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f4f4; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: #000; padding: 24px 32px;">
                  <h1 style="color: #fff; margin: 0; font-size: 22px;">${process.env.EMAIL_FROM_NAME || "MyApp"}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px;">
                  <h2 style="color: #111; margin-top: 0;">Reset Your Password</h2>
                  <p style="color: #444; line-height: 1.6;">Hi ${firstName},</p>
                  <p style="color: #444; line-height: 1.6;">
                    We received a request to reset the password for your account. Click the button below to create a new password.
                    This link is valid for <strong>10 minutes</strong>.
                  </p>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${resetURL}" style="background: #000; color: #fff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                      Reset Password
                    </a>
                  </div>
                  <p style="color: #444; line-height: 1.6;">
                    If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
                  </p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                  <p style="color: #999; font-size: 12px;">
                    Or copy and paste this URL into your browser:<br />
                    <a href="${resetURL}" style="color: #555; word-break: break-all;">${resetURL}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background: #f9f9f9; padding: 16px 32px; text-align: center;">
                  <p style="color: #aaa; font-size: 12px; margin: 0;">
                    &copy; ${new Date().getFullYear()} ${process.env.EMAIL_FROM_NAME || "MyApp"}. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await sendEmail({ to: email, subject: "Reset Your Password", html });
};

module.exports = { sendEmail, sendPasswordResetEmail };
