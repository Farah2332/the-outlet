import React from 'react';

const ProductList = ({ products, loading, error }) => {
    if (loading) {
        return (
            <div className="product-list">
                <h2>Product List</h2>
                <p>Loading products...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="product-list">
                <h2>Product List</h2>
                <p style={{ color: 'red' }}>Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="product-list">
            <h2>Product List</h2>
            {products && products.length > 0 ? (
                <ul style={styles.productList}>
                    {products.map((product) => (
                        <li key={product.id} style={styles.productItem}>
                            <span style={styles.productName}>{product.name}</span>
                            <span style={styles.productPrice}>${product.price.toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                    <p>No products available</p>
                )}
        </div>
    );
};

const styles = {
    productList: {
        listStyle: 'none',
        padding: 0,
        margin: '20px 0'
    },
    productItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px',
        margin: '5px 0',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    productName: {
        fontWeight: '500'
    },
    productPrice: {
        color: '#2c5282',
        fontWeight: '600'
    }
};

export default ProductList;
