import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({ jsonTransport: true });

export async function sendAppointmentConfirmation(appointment) {
  const message = await transporter.sendMail({
    from: 'reservas@example.com',
    to: appointment.customerEmail,
    subject: `Reserva confirmada: ${appointment.serviceName}`,
    text: `Hola ${appointment.customerName}, tu cita con ${appointment.professionalName} está confirmada para ${new Date(appointment.startsAt).toLocaleString()}.`,
  });
  console.info('Notificación de correo simulada:', message.messageId);
}
