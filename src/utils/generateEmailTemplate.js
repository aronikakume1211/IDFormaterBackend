const generateEmailTemplate = (user, percentUsed) => {
  const usageMessage =
    percentUsed === 100
      ? `<p style="font-size: 15px; font-weight: bold; color: #e53e3e;">You are not allowed to process ID cards while your points are 100% used.</p>
           <p style="font-size: 15px;">We recommend renewing or upgrading your plan to avoid interruptions and regain access to processing ID cards.</p>
           <div style="margin: 30px 0;">
             <a href="https://faydaprint.com/billing" target="_blank" style="background-color: rgb(233, 11, 11); color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block; font-size: 16px;">Upgrade Plan</a>
           </div>`
      : `<p style="font-size: 15px;">You're using <strong>${Math.round(
          percentUsed
        )}%</strong> of your points. Just a reminder to consider upgrading before reaching 100% usage to avoid any issues.</p>`;

  return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f2f4f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
              
              <!-- Header with logo -->
              <tr>
                <td style="background-color: #4f46e5; padding: 20px 30px; color: #ffffff;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="vertical-align: middle;">
                        <img src="https://faydaprint.com/logo.png" alt="Logo" width="40" height="40" style="border-radius: 5px; vertical-align: middle;">
                        <span style="font-size: 20px; font-weight: bold; margin-left: 10px; vertical-align: middle;">Fayda ID Formater</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
  
              <!-- Body -->
              <tr>
                <td style="padding: 30px; color: #333;">
                  <p style="font-size: 16px;">Hi <strong>${
                    user.name
                  }</strong>,</p>
                  <p style="font-size: 15px;">You've used <strong>${Math.round(
                    percentUsed
                  )}%</strong> of your available points.</p>
  
                  <!-- Progress Bar -->
                  <div style="margin: 20px 0;">
                    <div style="background-color: #e5e7eb; border-radius: 6px; width: 100%; height: 12px;">
                      <div style="height: 100%; background-color: ${
                        percentUsed === 100 ? "rgb(233, 11, 11)" : "#f59e0b"
                      }; border-radius: 6px; width: ${Math.min(
    Math.round(percentUsed),
    100
  )}%;"></div>
                    </div>
                    <p style="font-size: 13px; margin-top: 5px; text-align: right; color: #555;">${Math.round(
                      percentUsed
                    )}% used</p>
                  </div>
  
                  ${usageMessage}
  
                  <p style="font-size: 14px; color: #777;">Thanks for choosing us!<br>Fayda ID Formater Team</p>
                </td>
              </tr>
  
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #999;">
                  © ${new Date().getFullYear()} Fayda ID Formater. All rights reserved.<br>
                </td>
              </tr>
  
            </table>
          </td>
        </tr>
      </table>
    `;
};
module.exports={generateEmailTemplate}
