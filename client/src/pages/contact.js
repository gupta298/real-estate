'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    consent: false,
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.consent) {
      alert('Please agree to the terms and conditions to submit the form.');
      return;
    }

    try {
      // TODO: Implement API call to submit contact form
      console.log('Form submitted:', formData);
      setSubmitted(true);
      setFormData({ name: '', phone: '', email: '', message: '', consent: false });
      
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your form. Please try again.');
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-bf-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-extrabold mb-4">Contact Us</h1>
          <p className="text-xl text-bf-light italic">
            We are here to serve all of your real estate needs!
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-bf-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information Card */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex flex-col items-center mb-8">
                <div className="relative w-48 h-48 rounded-full overflow-hidden mb-6 border-4 border-bf-gold shadow-lg">
                  <Image
                    src="https://cdn.lofty.com/image/fs/user-info/2025115/22/w760_original_06e3a545-a433-4005-8056-5fce7a893899-jpeg.webp"
                    alt="Jasvir Singh"
                    fill
                    className="object-cover"
                  />
                </div>
                <h2 className="text-3xl font-bold text-bf-blue mb-2">Jasvir Singh</h2>
                <p className="text-lg text-gray-700 font-medium mb-1">
                  CEO/ Managing Broker
                </p>
                <p className="text-sm text-gray-600 mb-6">
                  License ID: RB22001424
                </p>
              </div>

              <div className="space-y-4 border-t border-gray-200 pt-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-bf-blue text-white p-3 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                    <a 
                      href="tel:+13174991516" 
                      className="text-bf-blue hover:text-bf-gold transition duration-200"
                    >
                      +1(317) 499-1516
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-bf-blue text-white p-3 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                    <a 
                      href="mailto:jsj@blueflagrealty.net" 
                      className="text-bf-blue hover:text-bf-gold transition duration-200"
                    >
                      jsj@blueflagrealty.net
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-bf-blue text-white p-3 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Office</h3>
                    <p className="text-gray-700">
                      755 E Main St, Greenwood, Indiana, 46143, USA
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-bf-blue mb-6">Send us a Message</h2>
              
              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xl font-semibold text-green-800">
                    Thanks! I'll get back to you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bf-blue focus:border-bf-blue transition duration-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bf-blue focus:border-bf-blue transition duration-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bf-blue focus:border-bf-blue transition duration-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows="6"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bf-blue focus:border-bf-blue transition duration-200 resize-none"
                      required
                    ></textarea>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="consent"
                        checked={formData.consent}
                        onChange={handleChange}
                        className="mt-1 w-4 h-4 text-bf-blue border-gray-300 rounded focus:ring-bf-blue"
                        required
                      />
                      <span className="text-xs text-gray-600 leading-relaxed">
                        By checking this box, I agree by electronic signature to the{' '}
                        <a href="/site/electronic-disclosure-consent" target="_blank" className="text-bf-blue hover:underline privacy-link">
                          Electronic Disclosure Consent Agreement
                        </a>
                        ; to receive recurring marketing communication from or on behalf of Blue Flag Realty Inc, including auto-dialed calls, texts, and artificial/prerecorded voice messages (message frequency varies; data rates may apply; reply "STOP" to opt-out of texts or "HELP" for assistance); and to the{' '}
                        <a href="/site/privacy-terms#terms-of-service" target="_blank" className="text-bf-blue hover:underline privacy-link">
                          Terms of Service
                        </a>
                        {' '}and{' '}
                        <a href="/site/privacy-terms#privacy-policy" target="_blank" className="text-bf-blue hover:underline privacy-link">
                          Privacy Policy
                        </a>
                        {' '}of this website. Consent not required to make a purchase. I understand that I can call 317-751-1918 to obtain direct assistance.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 px-6 bg-bf-blue text-white font-bold text-lg rounded-lg hover:bg-bf-gold transition duration-300 shadow-lg uppercase tracking-wider"
                  >
                    SUBMIT
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Additional Info Section */}
      <section className="py-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-bf-blue mb-4">Blue Flag Realty Inc</h3>
            <p className="text-gray-700 mb-2">
              <strong>Office:</strong> 755 E Main St, Greenwood, Indiana, 46143, USA
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Phone:</strong>{' '}
              <a href="tel:+13174991516" className="text-bf-blue hover:text-bf-gold">
                +1(317) 499-1516
              </a>
            </p>
            <p className="text-gray-700">
              <strong>Email:</strong>{' '}
              <a href="mailto:office@blueflagindy.com" className="text-bf-blue hover:text-bf-gold">
                office@blueflagindy.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
