import nodemailer from 'nodemailer'
import nodemailerExpressHandlebars from 'nodemailer-express-handlebars';
import { EmailOption } from '../Types/types';
import dotenv from 'dotenv';
import * as path from 'path';
dotenv.config()



const { SMTP_HOST, SMTP_PORT, SMTP_TLS, GMAIL_USERNAME, GMAIL_PASSWORD } = process.env;

if(!SMTP_HOST || !SMTP_PORT || !GMAIL_USERNAME || !GMAIL_PASSWORD){
    throw new Error('Mail server configuration is not set');
}
const smtpPort = SMTP_PORT ? parseInt(SMTP_PORT, 10) : undefined;

const transport = nodemailer.createTransport({
    // host: SMTP_HOST,
    // port: smtpPort, // Adjust the port based on your server's configuration
    // secure: (SMTP_TLS === '1')? true: false, // Set to true if using SSL/TLS
    service: 'gmail',
    auth: {
      user: GMAIL_USERNAME,
      pass: GMAIL_PASSWORD,
    },
});


transport.verify(function(error, success) {
    if (error) {
          console.log(error);
    } else {
          console.log('Server is ready to take our messages');
    }
});

//point to where the email is
const viewPath =  path.resolve(__dirname, '../Templates/Views/');
const includePath = path.resolve(__dirname, '../Templates/Includes');
const handlebarsOptions = {
  viewEngine: {
    extName: '.handlebars',
    partialsDir: includePath,
    layoutsDir: viewPath,
    defaultLayout: false,
  },
  viewPath: viewPath,
  extName: '.handlebars',
}as nodemailerExpressHandlebars.NodemailerExpressHandlebarsOptions; // Type casting here
transport.use('compile', nodemailerExpressHandlebars(handlebarsOptions));


 // Function to send an email
export const sendMailNM = async (options: EmailOption): Promise<boolean> => {
  try {
    const mailFrom =  {
      name: 'Telytech',
      address: GMAIL_USERNAME
    }
    // Email options
    const msg = {
        from: (options.from)? options.from : mailFrom , // Replace with the recipient's email address
        ...options
    };
    // Send mail
    const info = await transport.sendMail(msg);
    console.log('Email sent: ', info.messageId);
    // Email sent successfully;
    return true;
  } catch (error) {
    console.error('Error sending email: ', error);
    // throw new Error('Error sending email');
    // Email sending failed
    return false;
  }
}