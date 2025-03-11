import React, { useState, useEffect } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../api';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const AdminPanel = () => {
    const [products, setProducts] = useState([]);
    const [newProduct, setNewProduct] = useState({
        name: '',
        price: '',
        category_id: '',
        gender: 'unisex',
        colors: [
            {
                color: '',
                image: null,
                sizes: [{ size: '', quantity: 1 }],
            },
        ],
    });
    const [editingProduct, setEditingProduct] = useState(null);
    const [selectedColor, setSelectedColor] = useState({}); // Track selected color for each product
    const navigate = useNavigate();

    useEffect(() => {
        fetchProducts();
    }, []);
    const fetchProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(data);

            // Set the default selected color for each product
            const defaultSelectedColors = {};
            data.forEach((product) => {
                if (product.colors.length > 0) {
                    defaultSelectedColors[product.id] = product.colors[0]; // Select the first color by default
                }
            });
            setSelectedColor(defaultSelectedColors);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };


    const handleAddProduct = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', newProduct.name);
        formData.append('price', newProduct.price);
        formData.append('category_id', newProduct.category_id);
        formData.append('gender', newProduct.gender);
        formData.append('colors', JSON.stringify(newProduct.colors));

        // Append image files for each color
        newProduct.colors.forEach((color, index) => {
            if (color.image) {
                formData.append('images', color.image); // Use 'images' as the key
            }
        });

        // Log the form data for debugging
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }

        try {
            const response = await addProduct(formData);
            console.log('Product added successfully:', response.data);
            setNewProduct({
                name: '',
                price: '',
                category_id: '',
                gender: 'unisex',
                colors: [
                    {
                        color: '',
                        image: null,
                        sizes: [{ size: '', quantity: 1 }],
                    },
                ],
            });
            fetchProducts(); // Refresh the list of products after adding
        } catch (error) {
            console.error("Error adding product:", error.response ?.data || error.message);
        }
    };

    const handleEditProduct = (product) => {
        console.log('Editing Product:', product); // Log the product being edited
        if (!product.id) {
            console.error("Product ID is missing!");
            return;
        }

        setEditingProduct(product); // Set the editingProduct state
        setNewProduct({
            name: product.name,
            price: product.price,
            category_id: product.category_id,
            gender: product.gender || 'unisex',
            colors: product.colors.map((color) => ({
                ...color,
                image: color.image || '', // Retain the existing image URL or default to an empty string
            })),
        });
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();

        if (!editingProduct || !editingProduct.id) {
            console.error("Product ID is missing!");
            return;
        }

        const formData = new FormData();
        formData.append('name', newProduct.name);
        formData.append('price', newProduct.price);
        formData.append('category_id', newProduct.category_id);
        formData.append('gender', newProduct.gender);
        formData.append('colors', JSON.stringify(newProduct.colors));

        // Append new image files for each color (if provided)
        newProduct.colors.forEach((color, index) => {
            if (color.image && typeof color.image !== 'string') {
                formData.append('images', color.image); // Append new files
            }
        });

        // Log the form data for debugging
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }

        try {
            await updateProduct(editingProduct.id, formData); // Ensure editingProduct.id is passed
            fetchProducts(); // Refresh the list of products after updating
            setEditingProduct(null); // Reset editing mode
            setNewProduct({
                name: '',
                price: '',
                category_id: '',
                gender: 'unisex',
                colors: [
                    {
                        color: '',
                        image: null,
                        sizes: [{ size: '', quantity: 1 }],
                    },
                ],
            });
        } catch (error) {
            console.error("Error updating product:", error.response ?.data || error.message);
        }
    };

    const handleDeleteProduct = async (id) => {
        try {
            await deleteProduct(id);
            fetchProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    };

    // Handle color change
    const handleColorChange = (e, colorIndex) => {
        const { value } = e.target;
        const newColors = [...newProduct.colors];
        newColors[colorIndex].color = value;
        setNewProduct({ ...newProduct, colors: newColors });
    };

    // Handle color image upload
    const handleColorImageUpload = (e, colorIndex) => {
        const file = e.target.files[0];
        if (!file) return;

        const newColors = [...newProduct.colors];
        newColors[colorIndex].image = file;

        console.log('Updated newProduct:', { ...newProduct, colors: newColors }); // Log the updated state
        setNewProduct({ ...newProduct, colors: newColors });
    };

    // Handle size change
    const handleSizeChange = (e, colorIndex, sizeIndex) => {
        const { name, value } = e.target;
        const newColors = [...newProduct.colors];
        newColors[colorIndex].sizes[sizeIndex][name] = value;
        setNewProduct({ ...newProduct, colors: newColors });
    };

    // Add a new size field
    const addSizeField = (colorIndex) => {
        const newColors = [...newProduct.colors];
        newColors[colorIndex].sizes.push({ size: '', quantity: 1 });
        setNewProduct({ ...newProduct, colors: newColors });
    };

    // Remove a size field
    const removeSizeField = (colorIndex, sizeIndex) => {
        const newColors = [...newProduct.colors];
        newColors[colorIndex].sizes.splice(sizeIndex, 1);
        setNewProduct({ ...newProduct, colors: newColors });
    };

    // Add a new color field
    const addColorField = () => {
        setNewProduct({
            ...newProduct,
            colors: [
                ...newProduct.colors,
                {
                    color: '',
                    image: null,
                    sizes: [{ size: '', quantity: 1 }],
                },
            ],
        });
    };

    // Remove a color field
    const removeColorField = (colorIndex) => {
        const newColors = [...newProduct.colors];
        newColors.splice(colorIndex, 1);
        setNewProduct({ ...newProduct, colors: newColors });
    };

    const handleColorSelect = (productId, color) => {
        setSelectedColor((prev) => ({
            ...prev,
            [productId]: color, // Update selected color for the specific product
        }));
    };

    // Render color buttons as circles
    const renderColorButtons = (product) => {
        return product.colors.map((color, index) => (
            <button
                key={index}
                onClick={() => handleColorSelect(product.id, color)}
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
        ));
    };

    // Render the selected image and sizes/quantities for a product
    const renderSelectedColorDetails = (product) => {
        const selected = selectedColor[product.id]; // Get the selected color for the product
        if (!selected) return null; // If no color is selected, return nothing

        // Get the image URL (either from the file or the existing URL)
        const imageUrl = selected.image instanceof File
            ? URL.createObjectURL(selected.image) // Generate a temporary URL for the file
            : selected.image; // Use the existing URL

        return (
            <div>
                {/* Display the selected color's image */}
                <img
                    src={imageUrl}
                    alt={selected.color}
                    className="w-20 h-20 object-cover mt-2"
                    key={imageUrl} // Add key to force re-render
                />

                {/* Display sizes and quantities for the selected color */}
                <div className="mt-2">
                    <p className="text-muted">Sizes and Quantities:</p>
                    {selected.sizes.map((sizeData, index) => (
                        <div key={index} className="flex space-x-4">
                            <p className="text-muted m-0">{sizeData.size}: {sizeData.quantity}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-6">Admin Panel</h1>

            {/* Product Add/Edit Form */}
            <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} encType="multipart/form-data">
                {/* Product Name */}
                <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Product Name"
                    required
                />

                {/* Product Price */}
                <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Product Price"
                    required
                />

                {/* Category Dropdown */}
                <select
                    value={newProduct.category_id}
                    onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                >
                    <option value="">Select Category</option>
                    <option value="2">Shoes</option>
                    <option value="3">Shirts</option>
                    <option value="4">Pants</option>
                    <option value="5">Dresses</option>
                </select>

                {/* Gender Dropdown */}
                <select
                    value={newProduct.gender}
                    onChange={(e) => setNewProduct({ ...newProduct, gender: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                >
                    <option value="unisex">Unisex</option>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                </select>

                {/* Colors Section */}
                {newProduct.colors.map((color, colorIndex) => (
                    <div key={colorIndex} className="space-y-4 border p-4 rounded">
                        {/* Color Name */}
                        <input
                            type="text"
                            value={color.color}
                            onChange={(e) => handleColorChange(e, colorIndex)}
                            className="w-full p-2 border rounded"
                            placeholder="Color Name"
                            required
                        />

                        {/* Color Image Upload */}
                        <input
                            type="file"
                            onChange={(e) => handleColorImageUpload(e, colorIndex)}
                            className="w-full p-2 border rounded"
                            accept="image/*"
                        />
                        {color.image && typeof color.image === 'string' && (
                            <img src={color.image} alt={color.color} className="w-20 h-20 object-cover mt-2" />
                        )}

                        {/* Sizes with Quantities */}
                        {color.sizes.map((sizeData, sizeIndex) => (
                            <div key={sizeIndex} className="flex space-x-4">
                                <input
                                    type="text"
                                    name="size"
                                    value={sizeData.size}
                                    onChange={(e) => handleSizeChange(e, colorIndex, sizeIndex)}
                                    className="w-full p-2 border rounded"
                                    placeholder="Size (e.g., M, L)"
                                    required
                                />
                                <input
                                    type="number"
                                    name="quantity"
                                    value={sizeData.quantity}
                                    onChange={(e) => handleSizeChange(e, colorIndex, sizeIndex)}
                                    className="w-full p-2 border rounded"
                                    placeholder="Quantity"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => removeSizeField(colorIndex, sizeIndex)}
                                    className="text-red-500"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}

                        {/* Add Size Button */}
                        <button
                            type="button"
                            onClick={() => addSizeField(colorIndex)}
                            className="text-blue-500 mt-2"
                        >
                            Add Size
                        </button>

                        {/* Remove Color Button */}
                        <button
                            type="button"
                            onClick={() => removeColorField(colorIndex)}
                            className="text-red-500 mt-2"
                        >
                            Remove Color
                        </button>
                    </div>
                ))}

                {/* Add Color Button */}
                <button
                    type="button"
                    onClick={addColorField}
                    className="text-blue-500 mt-2"
                >
                    Add Color
                </button>

                {/* Submit Button */}
                <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">
                    {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
            </form>

            {/* Products Display */}
            <h2 className="text-2xl font-bold mb-4">Existing Products</h2>
            <div className="row g-4">
                {products.map((product) => {
                    const selected = selectedColor[product.id]; // Get selected color
                    if (!selected) return null; // Prevent errors

                    // Get the image URL (either from the file or the existing URL)
                    const imageUrl = selected.image instanceof File
                        ? URL.createObjectURL(selected.image) // Generate a temporary URL for the file
                        : selected.image; // Use the existing URL

                    return (
                        <div key={product.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                            <div className="card h-100 d-flex flex-column">
                                {/* Display only the selected color’s image */}
                                <img
                                    src={imageUrl}
                                    alt={product.name}
                                    className="card-img-top"
                                    style={{ height: '200px', objectFit: 'cover' }}
                                    key={imageUrl} // Add key to force re-render
                                />

                                <div className="card-body d-flex flex-column">
                                    <h5 className="card-title m-0">{product.name}</h5>
                                    <p className="text-muted m-0">Price: ${product.price}</p>
                                    <p className="text-muted m-0">Gender: {product.gender}</p>

                                    {/* Render color buttons */}
                                    <div className="mt-2">
                                        <p className="text-muted">Colors:</p>
                                        <div className="d-flex">{renderColorButtons(product)}</div>
                                    </div>

                                    {/* Render selected color's sizes and quantities */}
                                    {selected.sizes && (
                                        <div className="mt-2">
                                            <p className="text-muted">Sizes & Quantities:</p>
                                            {selected.sizes.map((sizeObj, index) => (
                                                <p key={index}>
                                                    Size: {sizeObj.size} - Quantity: {sizeObj.quantity}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                    <div>
                                        <button onClick={() => handleEditProduct(product)} className="btn btn-link p-0">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => handleDeleteProduct(product.id)} className="btn btn-link p-0">
                                            <FaTrashAlt />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};



export default AdminPanel;