import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getProductsBySearch } from "../api";
import ProductCard from "./ProductCard";

const SearchResults = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const searchTerm = queryParams.get("searchTerm");

    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchSearchResults = async () => {
            try {
                console.log('Fetching search results for:', searchTerm); // Log search term
                const data = await getProductsBySearch(searchTerm);
                setProducts(data);
            } catch (error) {
                console.error("Error fetching search results:", error);
            }
        };

        fetchSearchResults();
    }, [searchTerm]);

    return (
        <div className="container my-5">
            <h2>Search Results for "{searchTerm}"</h2>
            <div className="row g-4">
                {products.length > 0 ? (
                    products.map((product) => (
                        <div key={product.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                            <ProductCard product={product} />
                        </div>
                    ))
                ) : (
                        <p>No products found.</p>
                    )}
            </div>
        </div>
    );
};

export default SearchResults;