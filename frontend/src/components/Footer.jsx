import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTiktok, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="bg-black text-white pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    <div>
                        <h3 className="text-xl font-bold mb-4">About Us</h3>
                        <p className="text-gray-300">
                            The Outlet is your destination for fashion and accessories.
                            We bring you the latest trends with exceptional quality.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-4">Contact</h3>
                        <div className="space-y-2 text-gray-300">
                            <p className="flex items-center gap-2">
                                <FaMapMarkerAlt /> Lebanon
                            </p>
                            <p className="flex items-center gap-2">
                                <FaPhone /> +961 1 234 567
                            </p>
                            <p className="flex items-center gap-2">
                                <FaEnvelope /> contact@theoutlet.com
                            </p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-gray-300">
                            <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                            <li><Link to="/shipping" className="hover:text-white">Shipping Policy</Link></li>
                            <li><Link to="/returns" className="hover:text-white">Returns & Exchanges</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-4">Follow Us</h3>
                        <div className="flex space-x-4 text-gray-300">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                                <FaFacebook size={24} />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                                <FaInstagram size={24} />
                            </a>
                            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                                <FaTiktok size={24} />
                            </a>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
                    <p>&copy; 2025 The Outlet. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;