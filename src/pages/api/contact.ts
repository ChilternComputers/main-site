import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();

  const name = formData.get('name')?.toString();
  const email = formData.get('email')?.toString();
  const message = formData.get('message')?.toString();

  // Basic validation
  if (!name || !email || !message) {
    return new Response(JSON.stringify({ error: 'All fields are required' }), { 
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email address' }), { 
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Chiltern Computers Contact Form <contact@chilterncomputers.net>',
      to: ['david@chilterncomputers.net'],
      subject: `New Message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 0 0 10px 0;"><strong>Message:</strong></p>
            <div style="background-color: #fff; padding: 15px; border-left: 4px solid #007bff; border-radius: 4px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This email was sent from your website's contact form.
          </p>
        </div>
      `,
      // Optional: Add reply-to header so you can reply directly to the sender
      replyTo: email,
    });

    if (error) {
      console.error('Resend error:', error);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    console.log('Email sent successfully:', data);

    // Return JSON response for AJAX requests or redirect for form submissions
    const acceptHeader = request.headers.get('accept');
    if (acceptHeader && acceptHeader.includes('application/json')) {
      return new Response(JSON.stringify({ success: true, message: 'Email sent successfully!' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      // Redirect for traditional form submissions
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/thank-you',
        },
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Something went wrong' }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};