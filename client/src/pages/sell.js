'use client';

import { useState } from 'react';
import { submitSellerInquiry } from '@/utils/api';
import { FiHome, FiMail, FiPhone, FiMapPin, FiDollarSign, FiCalendar, FiCheckCircle } from 'react-icons/fi';
import { parsePhoneNumber } from 'libphonenumber-js';
import AddressAutocomplete from '@/components/AddressAutocomplete/AddressAutocomplete';

export default function SellPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    propertyAddress: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    lotSize: '',
    yearBuilt: '',
    currentValueEstimate: '',
    reasonForSelling: '',
    timeline: '',
    hasMortgage: false,
    mortgageBalance: '',
    needsRepairs: false,
    repairDescription: '',
    additionalInfo: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneFormatted, setPhoneFormatted] = useState('');

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
    setError('');
    
    // Validate phone number
    if (e.target.name === 'phone') {
      validatePhone(value);
    }
  };

  const validatePhone = (phoneValue) => {
    if (!phoneValue) {
      setPhoneError('');
      setPhoneFormatted('');
      return;
    }

    try {
      // Try to parse and validate the phone number
      const phoneNumber = parsePhoneNumber(phoneValue, 'US');
      if (phoneNumber && phoneNumber.isValid()) {
        setPhoneFormatted(phoneNumber.formatNational());
        setPhoneError('');
      } else {
        setPhoneError('Please enter a valid US phone number');
        setPhoneFormatted('');
      }
    } catch (err) {
      // If parsing fails, check if it's a partial number (user still typing)
      if (phoneValue.length < 10) {
        setPhoneError('');
        setPhoneFormatted('');
      } else {
        setPhoneError('Please enter a valid US phone number');
        setPhoneFormatted('');
      }
    }
  };

  const handleAddressSelect = (addressData) => {
    setFormData({
      ...formData,
      propertyAddress: addressData.propertyAddress || formData.propertyAddress,
      city: addressData.city || formData.city,
      state: addressData.state || formData.state,
      zipCode: addressData.zipCode || formData.zipCode
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPhoneError('');

    // Validate phone number before submission
    let submitData = { ...formData };
    if (formData.phone) {
      try {
        const phoneNumber = parsePhoneNumber(formData.phone, 'US');
        if (!phoneNumber || !phoneNumber.isValid()) {
          setPhoneError('Please enter a valid US phone number');
          return;
        }
        // Format phone number for storage (E.164 format)
        const formattedPhone = phoneNumber.format('E.164');
        submitData.phone = formattedPhone;
      } catch (err) {
        setPhoneError('Please enter a valid US phone number');
        return;
      }
    }

    setSubmitting(true);

    try {
      const response = await submitSellerInquiry(submitData);
      if (response.success) {
        setSubmitted(true);
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          propertyAddress: '',
          city: '',
          state: '',
          zipCode: '',
          propertyType: '',
          bedrooms: '',
          bathrooms: '',
          squareFeet: '',
          lotSize: '',
          yearBuilt: '',
          currentValueEstimate: '',
          reasonForSelling: '',
          timeline: '',
          hasMortgage: false,
          mortgageBalance: '',
          needsRepairs: false,
          repairDescription: '',
          additionalInfo: ''
        });
        setPhoneFormatted('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <FiCheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h2>
          <p className="text-lg text-gray-600 mb-6">
            Your property evaluation request has been submitted successfully. 
            Our team will reach out to you soon to discuss your property.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="btn-primary"
          >
            Submit Another Inquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-bf-blue mb-4">Sell Your Property</h1>
          <p className="text-xl text-gray-600">
            Get a free property evaluation and connect with our expert team
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {/* Contact Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <FiMail className="w-6 h-6 text-bf-blue" />
              <span>Contact Information</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FiPhone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className={`input-field pl-10 ${phoneError ? 'border-red-500' : ''}`}
                    placeholder="(317) 555-1234"
                  />
                </div>
                {phoneError && (
                  <p className="text-red-600 text-sm mt-1">{phoneError}</p>
                )}
                {phoneFormatted && !phoneError && (
                  <p className="text-green-600 text-sm mt-1">✓ {phoneFormatted}</p>
                )}
              </div>
            </div>
          </div>

          {/* Property Address */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <FiMapPin className="w-6 h-6 text-bf-blue" />
              <span>Property Address</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Street Address *
                </label>
                <AddressAutocomplete
                  value={formData.propertyAddress}
                  onChange={handleChange}
                  onAddressSelect={handleAddressSelect}
                  placeholder="Start typing your address..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Start typing and select from suggestions to auto-fill city, state, and ZIP code
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className={`input-field ${formData.propertyAddress && formData.city ? 'bg-gray-50' : ''}`}
                  readOnly={!!(formData.propertyAddress && formData.city)}
                />
                {formData.propertyAddress && formData.city && (
                  <p className="text-xs text-green-600 mt-1">✓ Auto-filled from address</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className={`input-field ${formData.propertyAddress && formData.state ? 'bg-gray-50' : ''}`}
                  readOnly={!!(formData.propertyAddress && formData.state)}
                />
                {formData.propertyAddress && formData.state && (
                  <p className="text-xs text-green-600 mt-1">✓ Auto-filled from address</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  required
                  className={`input-field ${formData.propertyAddress && formData.zipCode ? 'bg-gray-50' : ''}`}
                  readOnly={!!(formData.propertyAddress && formData.zipCode)}
                />
                {formData.propertyAddress && formData.zipCode && (
                  <p className="text-xs text-green-600 mt-1">✓ Auto-filled from address</p>
                )}
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <FiHome className="w-6 h-6 text-bf-blue" />
              <span>Property Details</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Property Type
                </label>
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select type</option>
                  <option value="Single Family">Single Family</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Condo">Condo</option>
                  <option value="Multi-Family">Multi-Family</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Land">Land</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bedrooms
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  min="0"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bathrooms
                </label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Square Feet
                </label>
                <input
                  type="number"
                  name="squareFeet"
                  value={formData.squareFeet}
                  onChange={handleChange}
                  min="0"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lot Size (sq ft)
                </label>
                <input
                  type="number"
                  name="lotSize"
                  value={formData.lotSize}
                  onChange={handleChange}
                  min="0"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year Built
                </label>
                <input
                  type="number"
                  name="yearBuilt"
                  value={formData.yearBuilt}
                  onChange={handleChange}
                  min="1800"
                  max={new Date().getFullYear()}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <FiDollarSign className="w-6 h-6 text-bf-blue" />
              <span>Financial Information</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Estimated Current Value
                </label>
                <input
                  type="number"
                  name="currentValueEstimate"
                  value={formData.currentValueEstimate}
                  onChange={handleChange}
                  min="0"
                  className="input-field"
                  placeholder="$"
                />
              </div>
              <div>
                <label className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    name="hasMortgage"
                    checked={formData.hasMortgage}
                    onChange={handleChange}
                    className="w-4 h-4 text-bf-blue border-gray-300 rounded"
                  />
                  <span className="text-sm font-semibold text-gray-700">Has Mortgage</span>
                </label>
                {formData.hasMortgage && (
                  <input
                    type="number"
                    name="mortgageBalance"
                    value={formData.mortgageBalance}
                    onChange={handleChange}
                    min="0"
                    className="input-field"
                    placeholder="Mortgage Balance ($)"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Selling Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <FiCalendar className="w-6 h-6 text-bf-blue" />
              <span>Selling Information</span>
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Selling
                </label>
                <textarea
                  name="reasonForSelling"
                  value={formData.reasonForSelling}
                  onChange={handleChange}
                  rows={3}
                  className="input-field"
                  placeholder="Tell us why you're selling..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Timeline
                </label>
                <select
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select timeline</option>
                  <option value="Immediately">Immediately</option>
                  <option value="Within 1 month">Within 1 month</option>
                  <option value="1-3 months">1-3 months</option>
                  <option value="3-6 months">3-6 months</option>
                  <option value="6+ months">6+ months</option>
                  <option value="Just exploring">Just exploring</option>
                </select>
              </div>
            </div>
          </div>

          {/* Property Condition */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Condition</h2>
            <div className="space-y-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="needsRepairs"
                  checked={formData.needsRepairs}
                  onChange={handleChange}
                  className="w-4 h-4 text-bf-blue border-gray-300 rounded"
                />
                <span className="text-sm font-semibold text-gray-700">Property needs repairs</span>
              </label>
              {formData.needsRepairs && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Repair Description
                  </label>
                  <textarea
                    name="repairDescription"
                    value={formData.repairDescription}
                    onChange={handleChange}
                    rows={4}
                    className="input-field"
                    placeholder="Describe the repairs needed..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Information
            </label>
            <textarea
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleChange}
              rows={5}
              className="input-field"
              placeholder="Any additional information about your property..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Property Evaluation Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

