const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api`;

// Category/subcategory images are served by the legacy PHP app's uploads/ folder.
export const LEGACY_ASSETS_BASE_URL = import.meta.env.VITE_LEGACY_ASSETS_BASE_URL || 'http://localhost:8888/justseva';

export const loginWithMobile = async (mobileNumber, agreeTerms) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: mobileNumber, agree_terms: agreeTerms ? 1 : 0 })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data;
};

export const verifyOtp = async (mobileNumber, otp) => {
  const response = await fetch(`${API_BASE_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: mobileNumber, otp })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'OTP verification failed');
  }
  return data;
};

export const loginWithGoogle = async (credential) => {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Google login failed');
  }
  return data;
};

export const completeProfile = async (profileData, token) => {
  const response = await fetch(`${API_BASE_URL}/auth/complete-profile`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Profile completion failed');
  }
  return data;
};

export const addAddress = async (addressData, token) => {
  const response = await fetch(`${API_BASE_URL}/address/add`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(addressData)
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to add address');
  }
  return data;
};

export const getAddresses = async (token) => {
  const response = await fetch(`${API_BASE_URL}/address/all`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch addresses');
  }
  return data;
};

export const updateAddress = async (addressId, addressData, token) => {
  const response = await fetch(`${API_BASE_URL}/address/${addressId}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(addressData)
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update address');
  }
  return data;
};

export const searchServices = async (query, token) => {
  const response = await fetch(`${API_BASE_URL}/dashboard/search?q=${encodeURIComponent(query)}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Search failed');
  return data.data;
};

export const deleteAddress = async (addressId, token) => {
  const response = await fetch(`${API_BASE_URL}/address/${addressId}`, {
    method: 'DELETE',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete address');
  }
  return data;
};

export const selectAddress = async (addressId, token) => {
  const response = await fetch(`${API_BASE_URL}/address/${addressId}/select`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to select address');
  }
  return data;
};

export const updateProfile = async (formData, token) => {
  const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`
      // Note: Do NOT set Content-Type for FormData, browser sets it automatically with the boundary
    },
    body: formData
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Profile update failed');
  }
  return data;
};

export const sendProfileOtp = async (mobileNumber, token) => {
  const response = await fetch(`${API_BASE_URL}/auth/send-profile-otp`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ mobileNumber })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to send OTP');
  }
  return data;
};

export const verifyProfileOtp = async (mobileNumber, otp, token) => {
  const response = await fetch(`${API_BASE_URL}/auth/verify-profile-otp`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ mobileNumber, otp })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'OTP verification failed');
  }
  return data;
};

export const getTestimonials = async (token) => {
  const response = await fetch(`${API_BASE_URL}/testimonials`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch testimonials');
  }
  return data;
};

export const storeTestimonial = async (formData, token) => {
  const response = await fetch(`${API_BASE_URL}/testimonials`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to store testimonial');
  }
  return data;
};

export const deleteTestimonial = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/testimonials/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete testimonial');
  }
  return data;
};

// ==========================================
// Support Endpoints
// ==========================================

export const createSupportTicket = async (formData, token) => {
  const response = await fetch(`${API_BASE_URL}/support/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create ticket');
  }
  return data;
};

export const getSupportTickets = async (token) => {
  const response = await fetch(`${API_BASE_URL}/support`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch tickets');
  }
  return data;
};

export const getTicketDetails = async (ticketNo, token) => {
  const response = await fetch(`${API_BASE_URL}/support/${ticketNo}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch ticket details');
  }
  return data;
};

export const replyToSupportTicket = async (ticketNo, formData, token) => {
  const response = await fetch(`${API_BASE_URL}/support/${ticketNo}/reply`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to reply to ticket');
  }
  return data;
};

export const logoutUser = async (token) => {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Logout failed');
  }
  return data;
};

export const getPage = async (id) => {
  const response = await fetch(`${API_BASE_URL}/pages/${id}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Error fetching page ${id}`);
  }
  return data;
};

export const getDashboardData = async (token) => {
  const response = await fetch(`${API_BASE_URL}/dashboard`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message);
  }
  return data.data;
};

export const getCategoryDetails = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message);
  }
  return data.data;
};

export const getPrepareOrderData = async (subcategoryId, token) => {
  const response = await fetch(`${API_BASE_URL}/orders/prepare/${subcategoryId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message);
  }
  return data.data;
};

export const placeOrder = async (orderData, token) => {
  const response = await fetch(`${API_BASE_URL}/orders/place`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });
  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message);
  }
  return data;
};

export const getOrderDetails = async (orderId, token) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message);
  }
  return data.data;
};

export const getAllOrders = async (token) => {
  const response = await fetch(`${API_BASE_URL}/orders/all`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message);
  }
  return data.data;
};

export const getActionRequiredRefunds = async (token) => {
  const response = await fetch(`${API_BASE_URL}/orders/refunds/action-required`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message);
  }
  return data.data;
};

export const confirmServiceStatus = async (refundId, orderId, response, token) => {
  const res = await fetch(`${API_BASE_URL}/orders/refunds/confirm-service-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ refundId, orderId, response })
  });
  const data = await res.json();
  if (data.status === 'error') {
    throw new Error(data.message);
  }
  return data;
};

export const cancelOrder = async (orderId, reasonText, token) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ reasonText })
  });
  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message);
  }
  return data;
};

export const getPendingRating = async (token) => {
  const response = await fetch(`${API_BASE_URL}/orders/ratings/pending`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message);
  }
  return data.data;
};

export const submitRating = async (orderId, ratingData, token) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/rate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(ratingData)
  });
  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message);
  }
  return data;
};

export const getNotifications = async (token) => {
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message);
  }
  return data.data;
};

export const markNotificationRead = async (notificationId, token) => {
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message);
  }
  return data;
};

export const markAllNotificationsRead = async (token) => {
  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message);
  }
  return data;
};

export const getFavorites = async (token) => {
  const response = await fetch(`${API_BASE_URL}/favorites`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message);
  }
  return data.data;
};

export const toggleFavorite = async (itemId, token) => {
  const response = await fetch(`${API_BASE_URL}/favorites/toggle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ itemId })
  });
  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message);
  }
  return data;
};
