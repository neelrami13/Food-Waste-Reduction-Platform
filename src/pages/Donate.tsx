import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SuccessMessage from '../components/SuccessMessage';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';
import { Store, Utensils, Package, Calendar, MapPin, Clock, MessageSquare, Building2 } from 'lucide-react';

const Donate: React.FC = () => {
  const { user, token, donationFormData, saveDonationFormData } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    donorType: '',
    organizationName: '',
    foodType: '',
    quantity: '',
    expiryDate: '',
    description: '',
    pickupAddress: '',
    pickupTime: '',
    specialInstructions: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (donationFormData) {
      setFormData({
        donorType: donationFormData.donorType,
        organizationName: donationFormData.organizationName,
        foodType: donationFormData.foodType,
        quantity: donationFormData.quantity.toString(),
        expiryDate: donationFormData.expiryDate,
        description: donationFormData.description,
        pickupAddress: donationFormData.pickupAddress,
        pickupTime: donationFormData.pickupTime,
        specialInstructions: donationFormData.specialInstructions
      });
    }
  }, [donationFormData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.foodType) newErrors.foodType = 'Food type is required';
    if (!formData.quantity || Number(formData.quantity) < 1) newErrors.quantity = 'Quantity must be at least 1';
    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';
    if (!formData.description || formData.description.length < 10) newErrors.description = 'Description must be at least 10 characters';
    if (!formData.pickupAddress) newErrors.pickupAddress = 'Pickup address is required';
    if (!formData.pickupTime) newErrors.pickupTime = 'Pickup time is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (!user) {
      saveDonationFormData({
        donorType: formData.donorType,
        organizationName: formData.organizationName,
        foodType: formData.foodType,
        quantity: Number(formData.quantity),
        expiryDate: formData.expiryDate,
        description: formData.description,
        pickupAddress: formData.pickupAddress,
        pickupTime: formData.pickupTime,
        specialInstructions: formData.specialInstructions
      });
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          foodType: formData.foodType,
          quantity: Number(formData.quantity),
          description: formData.description,
          pickupTime: formData.pickupTime,
          donorType: formData.donorType,
          organizationName: formData.organizationName,
          expiryDate: formData.expiryDate,
          pickupAddress: formData.pickupAddress,
          specialInstructions: formData.specialInstructions
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      toast.success('Food donation submitted successfully!');
      setSuccessMessage('Food donation submitted successfully!');
      setShowSuccess(true);
      setFormData({
        donorType: '',
        organizationName: '',
        foodType: '',
        quantity: '',
        expiryDate: '',
        description: '',
        pickupAddress: '',
        pickupTime: '',
        specialInstructions: ''
      });
    } catch (error) {
      console.error('Donation submission error:', error);
      toast.error('Failed to submit donation. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 fade-in">
          <h1 className="text-4xl font-bold mb-4">Donate Food</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Share your food with those in need. Fill out the form below to make a food donation.
          </p>
        </div>

        <div className={`p-8 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg transition-all duration-300 transform hover:shadow-xl`}>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Donor Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
                  formData.donorType === 'grocery' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-300 hover:border-green-300 dark:border-gray-600 dark:hover:border-green-500'
                }`}
              >
                <label className="flex flex-col items-center space-y-4 cursor-pointer">
                  <input
                    type="radio"
                    name="donorType"
                    value="grocery"
                    checked={formData.donorType === 'grocery'}
                    onChange={handleChange}
                    className="form-radio text-green-500 h-5 w-5"
                    required
                  />
                  <Store className="h-12 w-12 text-green-500" />
                  <div className="text-center">
                    <span className="text-lg font-semibold">Grocery Store</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Donate surplus groceries and fresh produce</p>
                  </div>
                </label>
              </div>
              <div 
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
                  formData.donorType === 'restaurant' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-300 hover:border-green-300 dark:border-gray-600 dark:hover:border-green-500'
                }`}
              >
                <label className="flex flex-col items-center space-y-4 cursor-pointer">
                  <input
                    type="radio"
                    name="donorType"
                    value="restaurant"
                    checked={formData.donorType === 'restaurant'}
                    onChange={handleChange}
                    className="form-radio text-green-500 h-5 w-5"
                    required
                  />
                  <Utensils className="h-12 w-12 text-green-500" />
                  <div className="text-center">
                    <span className="text-lg font-semibold">Restaurant</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Share prepared meals and ingredients</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Organization Name */}
            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium mb-2">
                Organization Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="organizationName"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-md ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } border focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300`}
                  required
                />
              </div>
            </div>

            {/* Food Type */}
            <div>
              <label htmlFor="foodType" className="block text-sm font-medium mb-2">
                Type of Food
              </label>
              <select
                id="foodType"
                name="foodType"
                value={formData.foodType}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-md ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } border focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300`}
                required
              >
                <option value="">Select food type</option>
                <option value="perishable">Perishable Food (Fruits, Vegetables, Dairy)</option>
                <option value="non-perishable">Non-Perishable Food (Canned, Dried, Packaged)</option>
                <option value="prepared">Prepared Food (Meals, Baked Goods)</option>
                <option value="beverages">Beverages (Drinks, Juices)</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium mb-2">
                Quantity
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="e.g., 2 kg, 5 packets, 10 meals"
                  className={`w-full pl-10 pr-4 py-3 rounded-md ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } border focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300`}
                  required
                />
              </div>
            </div>

            {/* Expiry Date */}
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium mb-2">
                Expiry Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  id="expiryDate"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full pl-10 pr-4 py-3 rounded-md ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } border focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300`}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`w-full px-4 py-3 rounded-md ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } border focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300`}
                placeholder="Describe the food items, packaging, and any special instructions"
                required
              />
            </div>

            {/* Pickup Address */}
            <div>
              <label htmlFor="pickupAddress" className="block text-sm font-medium mb-2">
                Pickup Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <textarea
                  id="pickupAddress"
                  name="pickupAddress"
                  value={formData.pickupAddress}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full pl-10 pr-4 py-3 rounded-md ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } border focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300`}
                  placeholder="Enter complete address with landmarks"
                  required
                />
              </div>
            </div>

            {/* Preferred Pickup Time */}
            <div>
              <label htmlFor="pickupTime" className="block text-sm font-medium mb-2">
                Preferred Pickup Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="datetime-local"
                  id="pickupTime"
                  name="pickupTime"
                  value={formData.pickupTime}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 16)}
                  className={`w-full pl-10 pr-4 py-3 rounded-md ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } border focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300`}
                  required
                />
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label htmlFor="specialInstructions" className="block text-sm font-medium mb-2">
                Special Instructions
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <textarea
                  id="specialInstructions"
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full pl-10 pr-4 py-3 rounded-md ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } border focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300`}
                  placeholder="Any additional information or special requirements"
                />
              </div>
            </div>

            {errors.submit && (
              <div className="text-red-600 text-sm text-center">{errors.submit}</div>
            )}

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-4 px-6 rounded-md text-lg font-medium hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
            >
              {user ? 'Submit Donation' : 'Continue to Login'}
            </button>
          </form>
        </div>
      </div>

      {showSuccess && (
        <SuccessMessage
          message={successMessage}
          onClose={() => setShowSuccess(false)}
        />
      )}
    </div>
  );
};

export default Donate;