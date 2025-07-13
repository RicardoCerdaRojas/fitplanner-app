'use server';

import { z } from 'zod';
import * as nodemailer from 'nodemailer';

const contactSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido.'),
  email: z.string().email('Por favor, ingresa un correo válido.'),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres.'),
});

export async function sendContactEmail(prevState: any, formData: FormData) {
  console.log('---[ sendContactEmail action started ]---');

  // 1. Validate form fields
  const validatedFields = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    console.log('Validation failed:', validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Por favor, corrige los errores en el formulario.',
    };
  }

  const { name, email, message } = validatedFields.data;
  console.log('Step 1: Form data validated successfully.', { name, email });

  // 2. Verify environment variables are loaded
  console.log('Step 2: Checking environment variables...');
  if (!process.env.ZOHO_EMAIL || !process.env.ZOHO_APP_PASSWORD || !process.env.RECIPIENT_EMAIL) {
    console.error('Error: Email environment variables are not set on the server.');
    return {
      errors: null,
      message: 'Error: El servicio de correo no está configurado. Por favor, contacta al administrador.',
    };
  }
  console.log('Environment variables found.');

  // 3. Configure Nodemailer transporter
  console.log('Step 3: Configuring Nodemailer transporter for Zoho...');
  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.ZOHO_EMAIL,
      pass: process.env.ZOHO_APP_PASSWORD,
    },
  });

  try {
    // 4. Verify connection configuration
    console.log('Step 4: Verifying connection with Zoho SMTP server...');
    await new Promise((resolve, reject) => {
        transporter.verify((error, success) => {
            if (error) {
                console.error("Nodemailer verification error:", error);
                reject(error);
            } else {
                console.log('Connection to Zoho SMTP successful!');
                resolve(success);
            }
        });
    });

    // 5. Send the email
    console.log(`Step 5: Attempting to send email to ${process.env.RECIPIENT_EMAIL}...`);
    const mailInfo = await transporter.sendMail({
      from: `"${name}" <${process.env.ZOHO_EMAIL}>`,
      to: process.env.RECIPIENT_EMAIL,
      replyTo: email,
      subject: `Nuevo Mensaje de Contacto de ${name}`,
      html: `
        <h1>Nuevo mensaje desde el formulario de contacto de Fit Planner</h1>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email (para responder):</strong> ${email}</p>
        <hr>
        <h2>Mensaje:</h2>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });
    
    console.log('Email sent successfully! Zoho server response:', mailInfo);
    console.log('---[ sendContactEmail action finished successfully ]---');

    return { success: true, message: '¡Gracias! Tu mensaje ha sido enviado.' };
  } catch (error) {
    console.error('---[ ERROR during email sending process ]---');
    console.error(error);
    console.log('---[ sendContactEmail action failed ]---');
    return {
      errors: null,
      message: 'Error: No se pudo enviar el mensaje. Por favor, revisa los logs del servidor para más detalles.',
    };
  }
}
