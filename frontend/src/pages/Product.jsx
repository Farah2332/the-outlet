import React, { useEffect, useState } from 'react';
import { getProducts } from '../api'; // API call to fetch products
import { useNavigate } from 'react-router-dom'; // For navigation

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Hook to navigate to shopping cart

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await getProducts();
                setProducts(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load products. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleAddToCart = () => {
        // Add logic to handle adding product to the cart
        navigate('/shopping-cart'); // Navigate to shopping cart
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center">
                <div className="spinner-border animate-spin"></div>
                <p className="ml-4 text-xl">Loading products...</p>
            </div>
        );
    }

    if (error) {
        return <p className="text-center text-red-500">{error}</p>;
    }

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-6 text-center">Products</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map(({ id, name, image, price, category_id, gender, sizes }) => (
                    <div key={id} className="border p-4 rounded shadow-lg flex flex-col justify-between">
                        <img
                            src={`http://localhost:5000${image}`}
                            alt={name}
                            className="w-full h-[300px] object-cover mb-4"
                            onError={(e) => e.target.src = '/placeholder.jpg'} // Fallback image
                        />
                        <h3 className="text-xl font-semibold mb-2">{name}</h3>
                        <p className="text-gray-700 mb-1">Price: ${price}</p>
                        <p className="text-gray-600 mb-1">Category: {category_id}</p>
                        <p className="text-gray-600 mb-1">Gender: {gender}</p>
                        {sizes && (
                            <p className="text-gray-600 mb-4">Sizes: {Array.isArray(sizes) ? sizes.join(", ") : JSON.parse(sizes).join(", ")}</p>
                        )}
                        <button
                            onClick={handleAddToCart}
                            className="bg-blue-500 text-white py-2 px-4 rounded mt-auto"
                        >
                            Add to Cart
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Products;
