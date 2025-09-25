import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // For now, we'll just log the contact form submission
    // In production, you would integrate with an email service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Nodemailer with SMTP
    console.log("Contact form submission:", {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

    // TODO: Implement actual email sending
    // Example with Nodemailer:
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransporter({
    //   // your email configuration
    // });
    // 
    // await transporter.sendMail({
    //   from: email,
    //   to: 'admin@enchantedenglish.org',
    //   subject: `Contact Form: ${subject}`,
    //   html: `
    //     <h2>New Contact Form Submission</h2>
    //     <p><strong>Name:</strong> ${name}</p>
    //     <p><strong>Email:</strong> ${email}</p>
    //     <p><strong>Subject:</strong> ${subject}</p>
    //     <p><strong>Message:</strong></p>
    //     <p>${message.replace(/\n/g, '<br>')}</p>
    //   `
    // });

    return NextResponse.json({
      success: true,
      message: "Contact form submitted successfully",
    });

  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

