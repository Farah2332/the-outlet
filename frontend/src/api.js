import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Signup User
export const register = async (email, password, role) => {
    const response = await api.post('/signup', { email, password, role });
    return response.data;
};

// Login User
export const login = async (email, password) => {
    try {
        const response = await api.post('/signin', { email, password });
        const { token } = response.data;
        const expirationTime = Date.now() + 60 * 60 * 1000; // Set expiration time (1 hour)

        localStorage.setItem('email', email);
        localStorage.setItem('token', token);
        localStorage.setItem('tokenExpiration', expirationTime);

        return response.data;
    } catch (error) {
        throw error;
    }
};

// Get Products
// Get Products with Filters

export const getProducts = async (filters = {}) => {
    const { searchTerm, category, gender, color } = filters;

    // Map gender values to match backend expectations
    let mappedGender;
    if (['women', 'woman', 'female'].includes(gender ?.toLowerCase())) {
        mappedGender = 'women';
    } else if (['men', 'man', 'male'].includes(gender ?.toLowerCase())) {
        mappedGender = 'men';
    } else if (gender ?.toLowerCase() === 'unisex') {
        mappedGender = 'unisex';
    }

    // Construct query parameters
    const queryParams = new URLSearchParams();

    if (searchTerm) queryParams.append("searchTerm", searchTerm);
    if (category) queryParams.append("category", category);
    if (mappedGender) queryParams.append("gender", mappedGender); // Use mappedGender
    if (color) queryParams.append("color", color);

    console.log("Query Parameters:", { searchTerm, category, gender: mappedGender, color });

    try {
        console.log("Sending request to:", `/products?${queryParams.toString()}`);

        // Make the API request with query parameters
        const response = await api.get(`/products?${queryParams.toString()}`);

        console.log("API Response Status:", response.status);
        console.log("API Response Data:", response.data);

        return response.data;
    } catch (error) {
        console.error("Error fetching products:", error);

        // Log detailed error information
        if (error.response) {
            console.error("Error response data:", error.response.data);
            console.error("Error status:", error.response.status);
            console.error("Error headers:", error.response.headers);
        } else if (error.request) {
            console.error("No response received:", error.request);
        } else {
            console.error("Error message:", error.message);
        }

        throw error; // Re-throw the error for the caller to handle
    }
};
// Get Products by Section (Gender and Category)
export const getProductsBySection = async (gender, category) => {
    const response = await api.get('/products/section', { params: { gender, category } });
    return response.data;
};

// Add Product (Admin only)
export const addProduct = async (formData) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    try {
        const response = await api.post('/products', formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error adding product:', error.response ?.data || error.message);
        throw error;
    }
};

// Update Product (Admin only)
export const updateProduct = async (id, updatedProduct) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    try {
        const response = await api.put(`/products/${id}`, updatedProduct, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error updating product:', error.response ?.data || error.message);
        throw error;
    }
};

// Delete Product (Admin only)
export const deleteProduct = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    try {
        const response = await api.delete(`/products/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting product:', error.response ?.data || error.message);
        throw error;
    }
};

// Get Product Details
export const getProductDetails = async (id) => {
    try {
        const response = await api.get(`/products/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching product details:', error.response ?.data || error.message);
        throw error;
    }
};

// Add to Cart
export const addToCart = async (product_id, color_id, size, quantity) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found. Please log in.');

    console.log('Sending Request Body:', { product_id, color_id, size, quantity }); // Log the request body

    try {
        const response = await api.post(
            '/cart',
            { product_id, color_id, size, quantity },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error adding to cart:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Update Cart Item Color
export const updateCartItemColor = async (cartItemId, colorId) => {
    const token = localStorage.getItem('token'); // Retrieve the token from localStorage
    if (!token) {
        throw new Error('No token found. Please log in.'); // Throw an error if the token is missing
    }

    try {
        const response = await api.put(
            '/cart/update-color', // Ensure the endpoint matches the backend
            { cartItemId, colorId }, // Request body
            {
                headers: {
                    'Content-Type': 'application/json', // Set the content type
                    Authorization: `Bearer ${token}`, // Include the token in the Authorization header
                },
            }
        );

        // Return the response data (including the new image)
        return response.data;
    } catch (error) {
        console.error('Error updating cart item color:', error.response ?.data || error.message);
        throw error; // Re-throw the error for the caller to handle
    }
};
// Get Cart Items
export const getCartItems = async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found. Please log in.');

    try {
        const response = await api.get('/cart', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching cart items:', error.response ?.data || error.message);
        throw error;
    }
};

// Remove from Cart
export const removeFromCart = async (cartItemId) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found. Please log in.');

    try {
        const response = await api.delete(`/cart/${cartItemId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error('Failed to remove item from cart:', error.response ?.data || error.message);
        throw error;
    }
};

// Update Cart Item Size
export const updateCartItemSize = async (cartId, color_id, newSize) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token provided. Please log in.');

    try {
        const response = await api.put(
            '/cart/update-size',
            { cart_id: cartId, color_id, new_size: newSize },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating cart item size:', error.response ?.data || error.message);
        throw error;
    }
};

// Update Cart Item Quantity
export const updateCartItemQuantity = async (cartId, color_id, size, quantity) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token provided. Please log in.');

    try {
        const response = await api.put(
            '/cart/update-quantity',
            { cart_id: cartId, color_id, size, quantity },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating cart item:', error.response ?.data || error.message);
        throw error;
    }
};

// Fetch Product Colors
export const getProductColors = async (productId) => {
    try {
        const response = await api.get(`/products/${productId}`);
        return response.data.colors; // Returns an array of colors with their sizes
    } catch (error) {
        console.error('Error fetching product colors:', error.response ?.data || error.message);
        throw error;
    }
};

// Fetch Product Sizes
export const getProductSizes = async (productId) => {
    try {
        const response = await api.get(`/products/${productId}/sizes`);
        return response.data; // Example: [{ size: "M", quantity: 10 }, { size: "L", quantity: 5 }]
    } catch (error) {
        console.error('Error fetching product sizes:', error.response ?.data || error.message);
        throw error;
    }
};

// Search Products
export const getProductsBySearch = async (searchTerm) => {
    try {
        const response = await api.get('/products/search', {
            params: { searchTerm },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching search results:', error.response ?.data || error.message);
        throw error;
    }
};