"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Contact Support</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Need help with your English learning journey? Have questions about our services? 
            We&apos;re here to help! Send us a message and we&apos;ll get back to you as soon as possible.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Send us a Message</h2>
            
            {submitStatus === "success" && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">
                  ✅ Thank you for your message! We&apos;ll get back to you within 24 hours.
                </p>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">
                  ❌ There was an error sending your message. Please try again or email us directly at{" "}
                  <a href="mailto:admin@enchantedenglish.org" className="underline">
                    admin@enchantedenglish.org
                  </a>
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                >
                  <option value="">Select a subject</option>
                  <option value="General Question">General Question</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Billing & Payments">Billing & Payments</option>
                  <option value="Lesson Scheduling">Lesson Scheduling</option>
                  <option value="Account Issues">Account Issues</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-vertical"
                  placeholder="Please describe your question or issue in detail..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending Message...
                  </div>
                ) : (
                  "Send Message"
                )}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Get in Touch</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📧</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Email Support</h3>
                    <p className="text-gray-600 mb-2">
                      For direct support, email us at:
                    </p>
                    <a 
                      href="mailto:admin@enchantedenglish.org" 
                      className="text-purple-600 hover:text-purple-800 font-medium underline"
                    >
                      admin@enchantedenglish.org
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">⏰</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Response Time</h3>
                    <p className="text-gray-600">
                      We typically respond within 24 hours during business days.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🌍</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Global Support</h3>
                    <p className="text-gray-600">
                      We provide support to students worldwide, with responses in English.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Common Questions</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800">How do I schedule a lesson?</h4>
                  <p className="text-sm text-gray-600">Use the &quot;Schedule Lesson&quot; button in your student dashboard.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Can I change my subscription plan?</h4>
                  <p className="text-sm text-gray-600">Yes! Use the &quot;Adjust Plan&quot; button or contact us directly.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">What if I need to cancel?</h4>
                  <p className="text-sm text-gray-600">You can cancel anytime by emailing us or using our cancellation form.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

