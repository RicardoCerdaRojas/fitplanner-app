
'use server';

import { z } from 'zod';
import * as nodemailer from 'nodemailer';
import { config } from 'dotenv';

config(); // Explicitly load environment variables

const contactSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido.'),
  email: z.string().email('Por favor, ingresa un correo válido.'),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres.'),
});

export async function sendContactEmail(prevState: any, formData: FormData) {
  // 1. Validate form fields
  const validatedFields = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Por favor, corrige los errores en el formulario.',
      success: false,
    };
  }

  const { name, email, message } = validatedFields.data;

  // 2. Verify environment variables are loaded
  if (!process.env.ZOHO_EMAIL || !process.env.ZOHO_APP_PASSWORD || !process.env.RECIPIENT_EMAIL) {
    return {
      errors: null,
      message: 'Error de configuración: Las variables de entorno del correo no están configuradas en el servidor.',
      success: false,
    };
  }

  // 3. Configure Nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true, // true for 465
    auth: {
      user: process.env.ZOHO_EMAIL,
      pass: process.env.ZOHO_APP_PASSWORD,
    },
  });

  try {
    // 4. Verify connection configuration
    await transporter.verify();

    // 5. Send the email
    await transporter.sendMail({
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

    return { success: true, message: '¡Gracias! Tu mensaje ha sido enviado.' };
  } catch (error: any) {
    // Return the actual error message to the client for debugging
    return {
      errors: null,
      message: `Error al enviar el correo: ${error.message}`,
      success: false,
    };
  }
}
