import nodemailer from 'nodemailer';

export class EmailService {
  constructor(config) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      }
    });
  }

  async sendQuote(clientInfo, pdfBuffer) {
    const mailOptions = {
      from: '"Reroflag" <devis@reroflag.com>',
      to: clientInfo.email,
      subject: 'Votre devis Reroflag',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF9900;">Merci pour votre demande de devis</h2>
          <p>Cher(e) ${clientInfo.firstname} ${clientInfo.lastname},</p>
          <p>Nous vous remercions pour votre intérêt pour nos produits.</p>
          <p>Veuillez trouver ci-joint votre devis détaillé.</p>
          <p>Pour toute question, n'hésitez pas à nous contacter.</p>
          <br>
          <p>Cordialement,</p>
          <p>L'équipe Reroflag</p>
        </div>
      `,
      attachments: [{
        filename: 'devis-reroflag.pdf',
        content: pdfBuffer
      }]
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      throw error;
    }
  }
} 