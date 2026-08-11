import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoadingScreen from './pages/LoadingScreen';
import Login from './pages/Login';
import ProfileCompletion from './pages/ProfileCompletion';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Testimonial from './pages/Testimonial';
import Support from './pages/Support';
import Category from './pages/Category';
import BookService from './pages/BookService';
import OrderDetails from './pages/OrderDetails';
import MyOrders from './pages/MyOrders';

import AddAddress from './pages/AddAddress';
import Notifications from './pages/Notifications';
import Favorites from './pages/Favorites';

function AppLayout() {
  return (
    <div className="app-wrapper">
      <div className="container">
        <Routes>
          <Route path="/" element={<LoadingScreen />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile-completion" element={<ProfileCompletion />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/testimonial" element={<Testimonial />} />
          <Route path="/support" element={<Support />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/category/:id" element={<Category />} />
          <Route path="/book-service/:subcategoryId" element={<BookService />} />
          <Route path="/order-details/:id" element={<OrderDetails />} />
          <Route path="/add-address" element={<AddAddress />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
