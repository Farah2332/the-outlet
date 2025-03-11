import React from "react";
import { Link } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";

const ProductCard = ({ product }) => {
    return (
        <div className="card h-100 d-flex flex-column">
            {/* Product Image */}
            <img
                src={product.image}
                alt={product.name}
                className="card-img-top"
                style={{ height: "200px", objectFit: "cover" }}
            />

            <div className="card-body d-flex flex-column">
                {/* Product Name and Price */}
                <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '10px' }}>
                    <div className="flex-grow-1">
                        <h5 className="card-title m-0">{product.name}</h5>
                        <p className="text-muted m-0">Price: ${product.price}</p>
                    </div>

                    {/* Shopping Cart Button */}
                    <div>
                        <Link to="/shopping-cart" className="btn btn-light">
                            <FaShoppingCart size={24} />
                        </Link>
                    </div>
                </div>

                {/* Sizes Section */}
                <div className="d-flex flex-wrap gap-2 mt-2">
                    {product.sizes.map((sizeObj, index) => (
                        <div
                            key={index}
                            className="size-box"
                            style={{
                                width: '30px',
                                height: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                transition: 'background-color 0.3s ease',
                            }}
                        >
                            {sizeObj.size}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;