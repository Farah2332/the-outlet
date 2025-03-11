import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import heroImage from '../assets/outlet.jpg';
import { getProducts, addToCart, getCartItems } from '../api';
import { FaShoppingCart } from 'react-icons/fa';
import '../App.css';

const Home = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [cartItems, setCartItems] = useState([]);
    const [selectedColor, setSelectedColor] = useState({});
    const [selectedSize, setSelectedSize] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [showSpinner, setShowSpinner] = useState(false);

    // Fetch products based on all query parameters (category, gender, color, searchTerm)
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setIsLoading(true);

                // Extract all query parameters
                const searchTerm = searchParams.get('searchTerm');
                const category = searchParams.get('category');
                const gender = searchParams.get('gender');
                const color = searchParams.get('color');

                // Map gender values to match database values
                let mappedGender;
                if (['women', 'woman', 'female'].includes(gender?.toLowerCase())) {
                    mappedGender = 'women'; // Map to 'women' in the database
                } else if (['men', 'man', 'male'].includes(gender?.toLowerCase())) {
                    mappedGender = 'men'; // Map to 'men' in the database
                } else if (gender?.toLowerCase() === 'unisex') {
                    mappedGender = 'unisex'; // Map to 'unisex' in the database
                }

                // Fetch products with filters
                const data = await getProducts({ searchTerm, category, gender: mappedGender, color });
                setProducts(data || []);
            } catch (error) {
                console.error('Error fetching products:', error);
                setProducts([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, [searchParams]);

    // Fetch cart items
    useEffect(() => {
        const fetchCartItems = async () => {
            try {
                const items = await getCartItems();
                setCartItems(items || []);
            } catch (error) {
                console.error('Error fetching cart items:', error);
                setCartItems([]);
            }
        };

        fetchCartItems();
    }, []);

    // Handle selecting a color for a product
    const handleColorSelect = (productId, color) => {
        setSelectedColor((prev) => ({
            ...prev,
            [productId]: color,
        }));
        setSelectedSize((prev) => ({
            ...prev,
            [productId]: null,
        }));
    };

    // Handle selecting a size for a product
    const handleSizeSelect = (productId, size) => {
        setSelectedSize((prev) => ({
            ...prev,
            [productId]: size,
        }));
    };

    // Handle adding a product to the cart
    const handleAddToCart = async (product) => {
        const selectedColorForProduct = selectedColor[product.id];
        const selectedSizeForProduct = selectedSize[product.id];

        if (!selectedColorForProduct) {
            setMessage('Please select a color before adding to cart.');
            setMessageType('error');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        if (!selectedSizeForProduct) {
            setMessage('Please select a size before adding to cart.');
            setMessageType('error');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const tokenExpiration = localStorage.getItem('tokenExpiration');

            if (token && Date.now() < tokenExpiration) {
                await addToCart(
                    product.id,
                    selectedColorForProduct.color_id,
                    selectedSizeForProduct,
                    1
                );
                setMessage('Item added successfully!');
                setMessageType('success');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Your session has expired. Please log in again.');
                setMessageType('error');
                setTimeout(() => setMessage(''), 3000);
                localStorage.removeItem('token');
                localStorage.removeItem('tokenExpiration');
                navigate('/login');
            }
        } catch (error) {
            console.error('Error adding item to cart:', error);
            setMessage('Failed to add item to cart');
            setMessageType('error');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // Show spinner after 300ms of loading
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isLoading) {
                setShowSpinner(true);
            }
        }, 300); // Show spinner only after 300ms of loading

        return () => clearTimeout(timer);
    }, [isLoading]);

    return (
        <div className="overflow-hidden">
            {/* Hero Section */}
            <div className="relative">
                <img src={heroImage} alt="Fashion Banner" className="w-100 h-50 object-cover" />
                <div className="position-absolute top-50 start-50 translate-middle text-center text-white bg-dark bg-opacity-50 p-4">
                    <h1 className="fs-1 fw-bold">Find Your Perfect Style</h1>
                    <Link to="/clothes" className="btn btn-light mt-4">
                        Shop Now
                    </Link>
                </div>
            </div>

            {/* Search Term and Filters Display */}
            {(searchParams.get('searchTerm') ||
                searchParams.get('category') ||
                searchParams.get('gender') ||
                searchParams.get('color')) && (
                    <div className="container mt-4">
                        <h3>
                            {searchParams.get('searchTerm') && `Search results for: "${searchParams.get('searchTerm')}"`}
                            {searchParams.get('category') && ` | Category: ${searchParams.get('category')}`}
                            {searchParams.get('gender') && ` | Gender: ${searchParams.get('gender')}`}
                            {searchParams.get('color') && ` | Color: ${searchParams.get('color')}`}
                        </h3>
                    </div>
                )}

            {/* Clear Filters Button */}
            {(searchParams.get('searchTerm') ||
                searchParams.get('category') ||
                searchParams.get('gender') ||
                searchParams.get('color')) && (
                    <div className="container mt-4 text-center">
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                navigate('/');
                            }}
                        >
                            Clear Filters
                        </button>
                    </div>
                )}

            {/* Message Display */}
            {message && (
                <div
                    className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} text-center`}
                    role="alert"
                    style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}
                >
                    {message}
                </div>
            )}

            {/* Products List Section */}
            <div className="container my-5">
                <h2 className="text-2xl font-bold text-center mb-4">
                    {searchParams.get('searchTerm') ? 'Search Results' : 'Featured Products'}
                </h2>

                {isLoading ? (
                    showSpinner && (
                        <div className="text-center">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    )
                ) : products && products.length > 0 ? (
                    <div className="row g-4">
                        {products.map((product) => {
                            const selectedColorForProduct = selectedColor[product.id];
                            const selectedSizeForProduct = selectedSize[product.id];

                            return (
                                <div key={product.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                                    <div className="card h-100 d-flex flex-column">
                                        {/* Display the selected color's image (or default to first color) */}
                                        <img
                                            src={
                                                selectedColorForProduct?.image ||
                                                (product.colors && product.colors[0]?.image) ||
                                                'https://via.placeholder.com/200'
                                            }
                                            alt={product.name}
                                            className="card-img-top"
                                            style={{ height: '200px', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/200';
                                            }}
                                        />

                                        <div className="card-body d-flex flex-column">
                                            <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '10px' }}>
                                                <div className="flex-grow-1">
                                                    <h5 className="card-title m-0">{product.name}</h5>
                                                    <p className="text-muted m-0">Price: ${product.price}</p>

                                                    {/* Render color buttons */}
                                                    {product.colors && product.colors.length > 0 && (
                                                        <div className="mt-2">
                                                            <p className="text-muted">Colors:</p>
                                                            <div className="d-flex flex-wrap gap-2">
                                                                {product.colors.map((color, index) => (
                                                                    <button
                                                                        key={index}
                                                                        onClick={() => handleColorSelect(product.id, color)}
                                                                        style={{
                                                                            backgroundColor: color.color.toLowerCase(),
                                                                            width: '30px',
                                                                            height: '30px',
                                                                            borderRadius: '50%',
                                                                            border: selectedColor[product.id]?.color === color.color ? '3px solid black' : '2px solid #000',
                                                                            margin: '5px',
                                                                            cursor: 'pointer',
                                                                        }}
                                                                        title={color.color}
                                                                        aria-label={`Select color ${color.color}`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Render size buttons for the selected color */}
                                                    {selectedColorForProduct && selectedColorForProduct.sizes && (
                                                        <div className="mt-2">
                                                            <p className="text-muted">Sizes:</p>
                                                            <div className="d-flex flex-wrap gap-2">
                                                                {selectedColorForProduct.sizes.map((sizeObj, index) => (
                                                                    <button
                                                                        key={index}
                                                                        className={`size-box ${selectedSizeForProduct === sizeObj.size ? 'selected' : ''}`}
                                                                        onClick={() => handleSizeSelect(product.id, sizeObj.size)}
                                                                        aria-label={`Select size ${sizeObj.size}`}
                                                                    >
                                                                        {sizeObj.size}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <button onClick={() => handleAddToCart(product)} className="btn btn-light">
                                                        <FaShoppingCart size={24} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center">
                        <p>
                            No products found
                            {searchParams.get('searchTerm') ? ` matching "${searchParams.get('searchTerm')}"` : ''}
                            {searchParams.get('category') ? ` in category "${searchParams.get('category')}"` : ''}
                            {searchParams.get('gender') ? ` for gender "${searchParams.get('gender')}"` : ''}
                            {searchParams.get('color') ? ` in color "${searchParams.get('color')}"` : ''}.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;