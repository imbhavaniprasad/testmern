const nodeMailer = require("nodemailer");
exports.sendEmail = async (options) => {
    const transport = nodeMailer.createTransport({
        host: "smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: "0569be1e288163",
            pass: "efa7dfd38c16be"
        }
    });

    const mailOptions = {
        from: process.env.SMPT_MAIL,
        to: options.email,
        subject: options.subject,
        text: options.message
    }
    await transport.sendMail(mailOptions);
}