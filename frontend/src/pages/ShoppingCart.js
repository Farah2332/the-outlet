import React, { useEffect, useState } from 'react';
import { FaTrashAlt } from 'react-icons/fa';
import { getCartItems, updateCartItemQuantity, removeFromCart, updateCartItemColor, updateCartItemSize } from '../api';
import '../App.css';

const ShoppingCart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [userEmail, setUserEmail] = useState(null);
    const [selectedColor, setSelectedColor] = useState({});
    const [selectedSize, setSelectedSize] = useState({});

    // Fetch user email from localStorage
    useEffect(() => {
        const fetchUserEmail = localStorage.getItem('email');
        if (fetchUserEmail) {
            setUserEmail(fetchUserEmail);
        }
    }, []);

    // Fetch cart items when userEmail changes
    useEffect(() => {
        const fetchCartItems = async () => {
            try {
                const items = await getCartItems();
                console.log('Fetched cart items:', items);

                // Convert base64 to URL for each item
                const itemsWithImageUrls = items.map((item) => {
                    if (item.selected_image && item.selected_image.startsWith('data:image')) {
                        item.selected_image = item.selected_image; // Use the base64 URL directly
                    }
                    return item;
                });

                setCartItems(itemsWithImageUrls || []);

                // Initialize selected color and size for each item
                const initialSelectedColors = {};
                const initialSelectedSizes = {};
                itemsWithImageUrls.forEach((item) => {
                    initialSelectedColors[item.id] = item.available_colors.find((color) => color.color_id === item.color_id);
                    initialSelectedSizes[item.id] = item.selected_size;
                });
                setSelectedColor(initialSelectedColors);
                setSelectedSize(initialSelectedSizes);
            } catch (error) {
                console.error('Error fetching cart items:', error);
            }
        };

        if (userEmail) {
            fetchCartItems();
        }
    }, [userEmail]);

    // Handle quantity change
    const handleQuantityChange = async (item, newQuantity) => {
        try {
            if (newQuantity < 1) {
                await handleRemoveFromCart(item.id);
                return;
            }

            const selectedSizeForItem = selectedSize[item.id];
            const sizeDetails = item.available_sizes.find((size) => size.size === selectedSizeForItem);

            if (newQuantity > sizeDetails.quantity) {
                alert(`Only ${sizeDetails.quantity} items are available in stock.`);
                return;
            }

            await updateCartItemQuantity(item.id, item.color_id, selectedSizeForItem, newQuantity);

            setCartItems((prevItems) =>
                prevItems.map((i) =>
                    i.id === item.id ? { ...i, quantity: newQuantity } : i
                )
            );
        } catch (error) {
            console.error('Error updating cart item:', error);
            alert('An error occurred while updating the cart item.');
        }
    };

    // Handle removing an item from the cart
    const handleRemoveFromCart = async (cartItemId) => {
        try {
            await removeFromCart(cartItemId);
            setCartItems((prevItems) => prevItems.filter((item) => item.id !== cartItemId));
        } catch (error) {
            console.error('Error removing item from cart:', error);
        }
    };

    // Handle selecting an item for checkout
    const handleSelectItemForCheckout = (cartItemId) => {
        setSelectedItems((prevSelected) =>
            prevSelected.includes(cartItemId)
                ? prevSelected.filter((id) => id !== cartItemId)
                : [...prevSelected, cartItemId]
        );
    };

    // Handle color change
    const handleColorChange = async (item, newColor) => {
        try {
            // Call the API to update the color and fetch the new image URL
            const response = await updateCartItemColor(item.id, newColor.color_id);

            let imageUrl = 'https://placehold.co/150'; // Fallback image

            // Check if the response contains the new image URL
            if (response.image && response.image.startsWith('http')) {
                imageUrl = response.image; // Use the image URL directly
            } else {
                console.warn('Invalid image URL, using fallback image:', response.image);
            }

            // Update the selected color and size in the UI
            setSelectedColor((prev) => ({
                ...prev,
                [item.id]: newColor,
            }));
            setSelectedSize((prev) => ({
                ...prev,
                [item.id]: null, // Reset selected size when color changes
            }));

            // Update the item in the UI with the new image URL
            setCartItems((prevItems) =>
                prevItems.map((i) =>
                    i.id === item.id
                        ? {
                            ...i,
                            color_id: newColor.color_id,
                            selected_image: imageUrl, // Update the image with the new color's image URL
                        }
                        : i
                )
            );
        } catch (error) {
            console.error('Error updating cart item color:', error);
            if (error.response ?.status === 401) {
                alert('Your session has expired. Please log in again.');
                // Redirect to login page or clear the token
                localStorage.removeItem('token');
                window.location.href = '/login';
            } else {
                alert('An error occurred while updating the cart item color.');
            }
        }
    };

    // Handle size change
    const handleSizeChange = async (item, newSize) => {
        try {
            await updateCartItemSize(item.id, newSize);
            setSelectedSize((prev) => ({
                ...prev,
                [item.id]: newSize,
            }));

            setCartItems((prevItems) =>
                prevItems.map((i) =>
                    i.id === item.id ? { ...i, selected_size: newSize, quantity: 1 } : i
                )
            );
        } catch (error) {
            console.error('Error updating cart item size:', error);
            alert('An error occurred while updating the cart item size.');
        }
    };

    // Calculate total price of selected items
    useEffect(() => {
        const selectedItemsTotal = cartItems.reduce((acc, item) => {
            if (selectedItems.includes(item.id)) {
                acc += parseFloat(item.product_price) * item.quantity;
            }
            return acc;
        }, 0);
        setTotal(selectedItemsTotal);
    }, [cartItems, selectedItems]);

    return (
        <div className="shopping-cart-container">
            <h2 className="text-center my-4">Shopping Cart</h2>

            {cartItems.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                    <div>
                        <div className="row g-4">
                            {cartItems.map((item) => {
                                const selectedColorForItem = selectedColor[item.id];
                                const selectedSizeForItem = selectedSize[item.id];
                                const sizeDetails = item.available_sizes.find((size) => size.size === selectedSizeForItem);
                                const maxQuantity = sizeDetails ? sizeDetails.quantity : 1;

                                return (
                                    <div key={item.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                                        <div className="cart-item">
                                            <div className="cart-item-info">
                                                <img
                                                    src={item.selected_image} // Use the image URL or fallback image
                                                    alt={item.product_name}
                                                    className="cart-item-image"
                                                    onError={(e) => {
                                                        console.error('Image failed to load:', item.selected_image);
                                                        e.target.src = 'https://placehold.co/150'; // Fallback image
                                                    }}
                                                />
                                                <div className="cart-item-details">
                                                    <h5>{item.product_name}</h5>
                                                    <p>Price: ${item.product_price}</p>

                                                    {/* Color Selector */}
                                                    <div className="color-selector">
                                                        {item.available_colors.map((color) => (
                                                            <button
                                                                key={color.color_id}
                                                                className={`color-btn ${selectedColorForItem ?.color_id === color.color_id ? 'selected' : ''}`}
                                                                onClick={() => handleColorChange(item, color)}
                                                                style={{
                                                                    backgroundColor: color.color.toLowerCase(),
                                                                    width: '30px',
                                                                    height: '30px',
                                                                    borderRadius: '50%',
                                                                    border: selectedColorForItem ?.color_id === color.color_id ? '3px solid black' : '2px solid #000',
                                                                    margin: '5px',
                                                                    cursor: 'pointer',
                                                                }}
                                                                title={color.color}
                                                            />
                                                        ))}
                                                    </div>

                                                    {/* Size Selector */}
                                                    {selectedColorForItem && (
                                                        <div className="size-selector">
                                                            {item.available_sizes.map((size) => (
                                                                <button
                                                                    key={size.size}
                                                                    className={`size-btn ${selectedSizeForItem === size.size ? 'selected' : ''}`}
                                                                    onClick={() => handleSizeChange(item, size.size)}
                                                                >
                                                                    {size.size}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Quantity Selector */}
                                                    <div className="quantity-selector">
                                                        <button
                                                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                                            disabled={item.quantity <= 1}
                                                            className={`quantity-btn ${item.quantity <= 1 ? 'disabled' : ''}`}
                                                        >
                                                            -
                                                    </button>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            readOnly
                                                            className="quantity-input"
                                                        />
                                                        <button
                                                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                                            disabled={item.quantity >= maxQuantity}
                                                            className={`quantity-btn ${item.quantity >= maxQuantity ? 'disabled' : ''}`}
                                                        >
                                                            +
                                                    </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="cart-item-actions">
                                                <button
                                                    className="btn-remove"
                                                    onClick={() => handleRemoveFromCart(item.id)}
                                                >
                                                    <FaTrashAlt />
                                                </button>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.includes(item.id)}
                                                    onChange={() => handleSelectItemForCheckout(item.id)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="checkout-summary">
                            <h3>Total: ${total.toFixed(2)}</h3>
                            <button className="btn btn-primary">Proceed to Checkout</button>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default ShoppingCart;