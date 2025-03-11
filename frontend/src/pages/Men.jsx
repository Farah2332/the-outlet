import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Nav, Container } from "react-bootstrap";
import { getProductsBySection, addToCart, getCartItems } from "../api"; // API functions
import { FaShoppingCart } from "react-icons/fa"; // Shopping cart icon
import "../App.css";

const Men = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const category = searchParams.get("category") || "shirts";
    const [products, setProducts] = useState([]);
    const [selectedColor, setSelectedColor] = useState({}); // Track selected color for each product
    const [selectedSize, setSelectedSize] = useState({}); // Track selected size for each product
    const [message, setMessage] = useState(""); // Combined message state
    const [messageType, setMessageType] = useState(""); // "success" or "error"

    useEffect(() => {
        const fetchProducts = async () => {
            const categoryMap = {
                shirts: 3,
                pants: 4,
                shoes: 2,
            };

            try {
                const data = await getProductsBySection("men", categoryMap[category]);
                setProducts(data || []); // Ensure data is an array

                // Set the default selected color for each product
                const defaultSelectedColors = {};
                data.forEach((product) => {
                    if (product.colors && product.colors.length > 0) {
                        defaultSelectedColors[product.id] = product.colors[0]; // Set the first color as default
                    }
                });
                setSelectedColor(defaultSelectedColors);
            } catch (error) {
                console.error("Error fetching products:", error);
                setProducts([]); // Set products to an empty array in case of error
            }
        };

        fetchProducts();
    }, [category]);

    const handleCategoryClick = (newCategory) => {
        setSearchParams({ category: newCategory });
    };

    // Handle selecting a color for a product
    const handleColorSelect = (productId, color) => {
        setSelectedColor((prev) => ({
            ...prev,
            [productId]: color, // Update selected color for the specific product
        }));
        setSelectedSize((prev) => ({
            ...prev,
            [productId]: null, // Reset selected size when color changes
        }));
    };

    // Handle selecting a size for a product
    const handleSizeSelect = (productId, size) => {
        setSelectedSize((prev) => ({
            ...prev,
            [productId]: size, // Update selected size for the specific product
        }));
    };

    // Handle adding a product to the cart
    const handleAddToCart = async (product) => {
        const selectedColorForProduct = selectedColor[product.id]; // Get the selected color for the product
        const selectedSizeForProduct = selectedSize[product.id]; // Get the selected size for the product

        if (!selectedColorForProduct) {
            setMessage("Please select a color before adding to cart.");
            setMessageType("error");
            setTimeout(() => setMessage(""), 3000);
            return;
        }

        if (!selectedSizeForProduct) {
            setMessage("Please select a size before adding to cart.");
            setMessageType("error");
            setTimeout(() => setMessage(""), 3000);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const tokenExpiration = localStorage.getItem("tokenExpiration");

            if (token && Date.now() < tokenExpiration) {
                await addToCart(
                    product.id, // product_id
                    selectedColorForProduct.color_id, // color_id (use the selected color's ID)
                    selectedSizeForProduct, // size
                    1 // quantity (default to 1)
                );
                setMessage("Item added successfully!");
                setMessageType("success");
                setTimeout(() => setMessage(""), 3000);
            } else {
                setMessage("Your session has expired. Please log in again.");
                setMessageType("error");
                setTimeout(() => setMessage(""), 3000);
                localStorage.removeItem("token");
                localStorage.removeItem("tokenExpiration");
                navigate("/login");
            }
        } catch (error) {
            console.error("Error adding item to cart:", error);
            setMessage("Failed to add item to cart");
            setMessageType("error");
            setTimeout(() => setMessage(""), 3000);
        }
    };

    return (
        <div>
            {/* Second Navbar with inverted colors using Bootstrap */}
            <Nav className="bg-dark text-white py-2 justify-content-center">
                <Container className="d-flex justify-content-center">
                    {["shirts", "pants", "shoes"].map((item) => (
                        <Nav.Item key={item}>
                            <Nav.Link
                                as={Link}
                                to={`?category=${item}`}
                                onClick={() => handleCategoryClick(item)}
                                className={`mx-3 text-white ${category === item ? "fw-bold text-warning" : ""}`}
                            >
                                {item.charAt(0).toUpperCase() + item.slice(1)}
                            </Nav.Link>
                        </Nav.Item>
                    ))}
                </Container>
            </Nav>

            {/* Message Display */}
            {message && (
                <div
                    className={`alert ${messageType === "success" ? "alert-success" : "alert-danger"} text-center`}
                    role="alert"
                    style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}
                >
                    {message}
                </div>
            )}

            <Container className="py-4">
                <h1 className="text-center">Men's Collection - {category.toUpperCase()}</h1>

                {/* Product Grid */}
                <div className="row g-4">
                    {products.length > 0 ? (
                        products.map((product) => {
                            const selectedColorForProduct = selectedColor[product.id]; // Get selected color for the product
                            const selectedSizeForProduct = selectedSize[product.id]; // Get selected size for the product

                            return (
                                <div key={product.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                                    <div className="card h-100 d-flex flex-column">
                                        {/* Display the selected color's image (or default to first color) */}
                                        <img
                                            src={selectedColorForProduct ?.image || product.colors[0] ?.image}
                                            alt={product.name}
                                            className="card-img-top"
                                            style={{ height: "200px", objectFit: "cover" }}
                                        />

                                        <div className="card-body d-flex flex-column">
                                            <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '10px' }}>
                                                <div className="flex-grow-1">
                                                    <h5 className="card-title m-0">{product.name}</h5>
                                                    <p className="text-muted m-0">Price: ${product.price}</p>

                                                    {/* Render color buttons */}
                                                    <div className="mt-2">
                                                        <p className="text-muted">Colors:</p>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {product.colors.map((color, index) => (
                                                                <button
                                                                    key={index}
                                                                    onClick={() => handleColorSelect(product.id, color)} // Pass the full color object
                                                                    style={{
                                                                        backgroundColor: color.color.toLowerCase(),
                                                                        width: '30px',
                                                                        height: '30px',
                                                                        borderRadius: '50%',
                                                                        border: selectedColor[product.id] ?.color === color.color ? '3px solid black' : '2px solid #000',
                                                                        margin: '5px',
                                                                        cursor: 'pointer',
                                                                    }}
                                                                    title={color.color}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Render size buttons for the selected color */}
                                                    {selectedColorForProduct && (
                                                        <div className="mt-2">
                                                            <p className="text-muted">Sizes:</p>
                                                            <div className="d-flex flex-wrap gap-2">
                                                                {selectedColorForProduct.sizes.map((sizeObj, index) => (
                                                                    <button
                                                                        key={index}
                                                                        className={`size-box ${selectedSizeForProduct === sizeObj.size ? "selected" : ""}`}
                                                                        onClick={() => handleSizeSelect(product.id, sizeObj.size)}
                                                                    >
                                                                        {sizeObj.size}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Shopping Cart Button */}
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
                        })
                    ) : (
                            <p className="text-center">No products available for this category.</p>
                        )}
                </div>
            </Container>
        </div>
    );
};

export default Men;