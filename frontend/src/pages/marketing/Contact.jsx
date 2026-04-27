import React from 'react';
import { MapPinIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const Contact = () => {
  return (
    <div className="pt-20 bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-extrabold text-neutral-900 tracking-tight mb-6">Get in touch</h1>
          <p className="text-xl text-neutral-600">Have questions about our product, pricing, or something else? Our team is ready to answer all your questions.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          <div className="bg-white p-8 rounded-2xl shadow-md border border-neutral-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
              <EnvelopeIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Email Us</h3>
            <p className="text-neutral-600 mb-4">We'll respond within 24 hours.</p>
            <a href="mailto:hello@hrmspro.com" className="text-primary-600 font-medium hover:underline">hello@hrmspro.com</a>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-md border border-neutral-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
              <PhoneIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Call Us</h3>
            <p className="text-neutral-600 mb-4">Mon-Fri from 8am to 5pm.</p>
            <a href="tel:+15550000000" className="text-primary-600 font-medium hover:underline">+1 (555) 000-0000</a>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-md border border-neutral-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
              <MapPinIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Visit Us</h3>
            <p className="text-neutral-600 mb-4">Come say hello at our office HQ.</p>
            <span className="text-primary-600 font-medium">100 Tech Lane, SF, CA 94105</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-neutral-100 overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-12">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Send us a message</h2>
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Full Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Email Address</label>
                  <input type="email" className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Message</label>
                  <textarea rows="4" className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow" placeholder="How can we help you?"></textarea>
                </div>
                <button type="button" className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors">
                  Send Message
                </button>
              </form>
            </div>
            <div className="bg-neutral-200 hidden md:block relative">
              {/* Placeholder Map */}
              <div className="absolute inset-0 flex items-center justify-center text-neutral-500 font-medium text-lg bg-neutral-200">
                Interactive Map Placeholder
              </div>
              <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80" alt="Map" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Contact;
