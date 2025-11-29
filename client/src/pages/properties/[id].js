import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { getPropertyById } from '@/utils/api';
import { FiBed, FiDroplet, FiHome, FiMapPin, FiCalendar, FiDollarSign } from 'react-icons/fi';
import PropertyInquiryModal from '@/components/PropertyInquiryModal/PropertyInquiryModal';

export default function PropertyDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    if (id) {
      loadProperty();
      // Check if form was already submitted (stored in sessionStorage)
      const submitted = sessionStorage.getItem(`property_${id}_viewed`);
      if (submitted) {
        setFormSubmitted(true);
      } else {
        // Show inquiry modal if not submitted
        setShowInquiryModal(true);
      }
    }
  }, [id]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      const data = await getPropertyById(id);
      setProperty(data.property);
      if (data.property?.images?.length > 0) {
        setSelectedImage(0);
      }
    } catch (error) {
      console.error('Error loading property:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 text-lg">Property not found.</p>
      </div>
    );
  }

  const handleInquirySuccess = () => {
    setFormSubmitted(true);
    if (id) {
      sessionStorage.setItem(`property_${id}_viewed`, 'true');
    }
    setShowInquiryModal(false);
  };

  const images = property.images || [];
  const currentImage = images[selectedImage] || images[0];

  // Show inquiry modal if form not submitted
  if (!formSubmitted && property) {
    return (
      <>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{property.title}</h1>
            <p className="text-gray-600 mb-6">
              Please fill out the form to view full property details
            </p>
            <button
              onClick={() => setShowInquiryModal(true)}
              className="btn-primary"
            >
              Request Property Details
            </button>
          </div>
        </div>
        <PropertyInquiryModal
          isOpen={showInquiryModal}
          onClose={() => setShowInquiryModal(false)}
          property={property}
          onSuccess={handleInquirySuccess}
        />
      </>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Property Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{property.title}</h1>
        <div className="flex items-center text-gray-600 mb-4">
          <FiMapPin className="mr-2" />
          <span>{property.address}, {property.city}, {property.state} {property.zipCode}</span>
        </div>
        <div className="text-3xl font-bold text-primary-600 mb-4">
          {formatPrice(property.price)}
        </div>
        {property.mlsNumber && (
          <div className="text-sm text-gray-500">
            MLS #: {property.mlsNumber}
          </div>
        )}
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="mb-8">
          <div className="relative h-96 mb-4 rounded-lg overflow-hidden">
            <Image
              src={currentImage.imageUrl || currentImage.thumbnailUrl}
              alt={property.title}
              fill
              className="object-cover"
              priority
            />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative h-24 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-primary-600' : 'border-transparent'
                  }`}
                >
                  <Image
                    src={img.thumbnailUrl || img.imageUrl}
                    alt={`${property.title} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Property Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <FiBed className="text-primary-600 text-xl" />
                <div>
                  <div className="text-sm text-gray-500">Bedrooms</div>
                  <div className="font-semibold">{property.bedrooms}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <FiDroplet className="text-primary-600 text-xl" />
                <div>
                  <div className="text-sm text-gray-500">Bathrooms</div>
                  <div className="font-semibold">{property.bathrooms}</div>
                </div>
              </div>
              {property.squareFeet && (
                <div className="flex items-center space-x-2">
                  <FiHome className="text-primary-600 text-xl" />
                  <div>
                    <div className="text-sm text-gray-500">Square Feet</div>
                    <div className="font-semibold">{property.squareFeet.toLocaleString()}</div>
                  </div>
                </div>
              )}
              {property.lotSize && (
                <div className="flex items-center space-x-2">
                  <FiHome className="text-primary-600 text-xl" />
                  <div>
                    <div className="text-sm text-gray-500">Lot Size</div>
                    <div className="font-semibold">{property.lotSize} acres</div>
                  </div>
                </div>
              )}
              {property.yearBuilt && (
                <div className="flex items-center space-x-2">
                  <FiCalendar className="text-primary-600 text-xl" />
                  <div>
                    <div className="text-sm text-gray-500">Year Built</div>
                    <div className="font-semibold">{property.yearBuilt}</div>
                  </div>
                </div>
              )}
              {property.garage > 0 && (
                <div className="flex items-center space-x-2">
                  <FiHome className="text-primary-600 text-xl" />
                  <div>
                    <div className="text-sm text-gray-500">Garage</div>
                    <div className="font-semibold">{property.garage} spaces</div>
                  </div>
                </div>
              )}
              {property.propertyType && (
                <div>
                  <div className="text-sm text-gray-500">Property Type</div>
                  <div className="font-semibold">{property.propertyType}</div>
                </div>
              )}
              {property.status && (
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="font-semibold capitalize">{property.status}</div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
            </div>
          )}

          {/* Features */}
          {property.features && property.features.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Features & Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {property.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                    <span className="text-gray-700">{feature.feature || feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Agent</h3>
            <form className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Your Name"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Your Email"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Your Phone"
                  className="input-field"
                />
              </div>
              <div>
                <textarea
                  placeholder="Message"
                  rows="4"
                  className="input-field"
                  defaultValue={`I'm interested in ${property.title} (MLS #${property.mlsNumber || property.id})`}
                ></textarea>
              </div>
              <button type="submit" className="btn-primary w-full">
                Send Message
              </button>
            </form>

            {property.propertyTax && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Property Tax</span>
                  <span className="font-semibold">{formatPrice(property.propertyTax)}/year</span>
                </div>
              </div>
            )}

            {property.hoaFee && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">HOA Fee</span>
                  <span className="font-semibold">{formatPrice(property.hoaFee)}/month</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <PropertyInquiryModal
        isOpen={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
        property={property}
        onSuccess={handleInquirySuccess}
      />
    </div>
  );
}

