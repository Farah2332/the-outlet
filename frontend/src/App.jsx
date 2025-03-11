import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/Adminpanel';
import ProductDetails from './pages/Productdetails';
import Products from './pages/Product';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import Women from './pages/Women';
import Men from './pages/Men';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import ShoppingCart from './pages/ShoppingCart';
import SearchResults from './components/SearchResults';

const App = () => {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/products" element={<Products />} />
                <Route path="/women" element={<Women />} />  {/* Fixed route for Women */}
                <Route path="/men" element={<Men />} />      {/* Fixed route for Men */}
                <Route path="/ShoppingCart" element={<ShoppingCart />} />
                <Route path="/search" element={<SearchResults />} />
            </Routes>
            <Footer />
        </Router>
    );
};

export default App;
