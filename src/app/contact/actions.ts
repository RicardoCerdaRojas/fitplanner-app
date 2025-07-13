'use server';

import { z } from 'zod';
import * as nodemailer from 'nodemailer';

const contactSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido.'),
  email: z.string().email('Por favor, ingresa un correo válido.'),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres.'),
});

export async function sendContactEmail(prevState: any, formData: FormData) {
  const validatedFields = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Por favor, corrige los errores en el formulario.',
    };
  }

  const { name, email, message } = validatedFields.data;

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
    // Verify connection configuration
    await new Promise((resolve, reject) => {
        transporter.verify((error, success) => {
            if (error) {
                console.error("Nodemailer verification error:", error);
                reject(error);
            } else {
                resolve(success);
            }
        });
    });

    await transporter.sendMail({
      from: `"${name}" <${process.env.ZOHO_EMAIL}>`, // Send FROM your authenticated email address
      to: process.env.RECIPIENT_EMAIL,
      replyTo: email, // Set the user's email as the reply-to address
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
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    return {
      errors: null,
      message: 'Error: No se pudo enviar el mensaje. Por favor, revisa la configuración del servidor o intenta más tarde.',
    };
  }
}
