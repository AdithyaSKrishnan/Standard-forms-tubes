const nodemailer = require('nodemailer');

// Setup transporter if SMTP credentials are provided
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: parseInt(process.env.SMTP_PORT, 10) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Send an email notification when a new quotation/enquiry is submitted
 */
async function sendEnquiryNotification(enquiry) {
  const recipient = process.env.ADMIN_EMAIL || 'standardformsclt@gmail.com';
  const subject = `[Website Lead] New Enquiry from ${enquiry.name} (${enquiry.product || 'General'})`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e4e8; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #12151c; color: #ffc81e; padding: 20px; text-align: left;">
        <h2 style="margin: 0; font-size: 20px;">Standard Forms &amp; Tubes</h2>
        <p style="margin: 4px 0 0 0; color: #d3d7dc; font-size: 13px;">New Website Customer Enquiry</p>
      </div>
      <div style="padding: 24px; color: #23272f;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0f2f5; font-weight: bold; width: 140px;">Customer Name:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0f2f5;">${enquiry.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0f2f5; font-weight: bold;">Phone:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0f2f5;"><a href="tel:${enquiry.phone}" style="color: #d42329; text-decoration: none; font-weight: bold;">${enquiry.phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0f2f5; font-weight: bold;">Email:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0f2f5;">${enquiry.email ? `<a href="mailto:${enquiry.email}">${enquiry.email}</a>` : 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0f2f5; font-weight: bold;">Company / Site:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0f2f5;">${enquiry.company || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0f2f5; font-weight: bold;">Product Interested:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0f2f5;"><strong style="background: #fff8e1; padding: 2px 6px; border-radius: 4px;">${enquiry.product || 'General / Unspecified'}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0f2f5; font-weight: bold;">Channel:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0f2f5;">${enquiry.channel === 'whatsapp' ? 'WhatsApp initiated' : 'Web Contact Form'}</td>
          </tr>
        </table>

        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #d42329;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; color: #5b6470;">Requirement Message:</h4>
          <p style="margin: 0; line-height: 1.5; white-space: pre-wrap;">${enquiry.message}</p>
        </div>

        <div style="margin-top: 24px; text-align: center;">
          <a href="https://wa.me/${enquiry.phone.replace(/[^0-9]/g, '')}" style="display: inline-block; background-color: #25d366; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; margin-right: 10px;">Reply on WhatsApp</a>
          <a href="tel:${enquiry.phone}" style="display: inline-block; background-color: #12151c; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-weight: bold;">Call Customer</a>
        </div>
      </div>
      <div style="background: #f0f2f5; padding: 12px 24px; font-size: 12px; color: #88909b; text-align: center;">
        Received from Standard Forms &amp; Tubes Official Website
      </div>
    </div>
  `;

  if (!transporter) {
    console.log(`[Notification] New Enquiry #${enquiry.id || 'N/A'} from ${enquiry.name} (${enquiry.phone}). Email notification simulated (SMTP not configured).`);
    return { simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Standard Forms & Tubes <noreply@standardforms.in>',
      to: recipient,
      subject,
      html: htmlContent
    });
    console.log(`[Email Sent] Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email Error] Failed to send email alert:', err.message);
    return { error: err.message };
  }
}

module.exports = {
  sendEnquiryNotification
};
