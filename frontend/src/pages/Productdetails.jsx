import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProductDetails } from '../api'; // Define this API function

const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);

    useEffect(() => {
        const fetchProductDetails = async () => {
            const data = await getProductDetails(id);
            setProduct(data);
        };

        fetchProductDetails();
    }, [id]);

    if (!product) return <div>Loading...</div>;

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-6">{product.name}</h1>
            <img src={product.image_url} alt={product.name} className="w-full h-[300px] object-cover mb-4" />
            <p>{product.description}</p>
            <p className="mt-4 text-xl font-semibold">Price: ${product.price}</p>
            <button className="mt-4 bg-blue-500 text-white py-2 px-4 rounded">Add to Cart</button>
        </div>
    );
};

export default ProductDetails;
