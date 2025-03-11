require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./configdb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });



// Logger for debugging
app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.url}`);
    next();
});

// Authentication Middleware
const verifyAdmin = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    const bearerToken = token.split(' ')[1];
    jwt.verify(bearerToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
        req.userId = decoded.id;
        next();
    });
};

// User Signup
app.post('/api/signup', async (req, res) => {
    const { email, password, role = 'user' } = req.body;
    try {
        const [existingUser] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) return res.status(400).json({ error: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.execute('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashedPassword, role]);

        const token = jwt.sign({ email, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ message: 'User registered successfully', token });
    } catch (err) {
        console.error('Signup Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User Signin
// User Signin
app.post('/api/signin', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, userRole: user.role });
    } catch (err) {
        console.error('Signin Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch Products with Filtering
app.get('/api/products/section', async (req, res) => {
    const { gender, category } = req.query;

    if (!gender) {
        return res.status(400).json({ error: 'Gender is required' });
    }

    let query = `
        SELECT 
            p.id, p.name, p.price, p.category_id, p.gender, p.description,
            pc.id AS color_id, pc.color, pc.image,
            ps.size, ps.quantity
        FROM products p
        LEFT JOIN product_colors pc ON p.id = pc.product_id
        LEFT JOIN product_sizes ps ON pc.id = ps.color_id
        WHERE (p.gender = ? OR p.gender = "unisex")
    `;
    const queryParams = [gender.toLowerCase()];

    if (category) {
        query += ' AND p.category_id = ?';
        queryParams.push(parseInt(category));
    }

    try {
        const [rows] = await pool.query(query, queryParams);

        // Organize data into structured JSON response
        const productsMap = new Map();
        rows.forEach(row => {
            if (!productsMap.has(row.id)) {
                productsMap.set(row.id, {
                    id: row.id,
                    name: row.name,
                    price: row.price,
                    category_id: row.category_id,
                    gender: row.gender,
                    description: row.description,
                    colors: [] // Add colors array
                });
            }

            // Add color if it doesn't already exist
            const product = productsMap.get(row.id);
            const colorExists = product.colors.some(color => color.color_id === row.color_id);

            if (!colorExists && row.color_id) {
                product.colors.push({
                    color_id: row.color_id,
                    color: row.color,
                    image: row.image ? `${req.protocol}://${req.get('host')}${row.image}` : null,
                    sizes: []
                });
            }

            // Add size to the corresponding color
            if (row.size) {
                const color = product.colors.find(color => color.color_id === row.color_id);
                if (color) {
                    color.sizes.push({ size: row.size, quantity: row.quantity });
                }
            }
        });

        res.json(Array.from(productsMap.values()));
    } catch (err) {
        console.error('Error fetching section products:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
app.get('/api/products', async (req, res) => {
    const { category, gender, color, searchTerm } = req.query;

    console.log("Received query parameters:", req.query);

    let query = `
        SELECT 
            p.id, p.name, p.price, p.category_id, p.gender, p.description,
            pc.id AS color_id, pc.color, pc.image,
            ps.size, ps.quantity
        FROM products p
        LEFT JOIN product_colors pc ON p.id = pc.product_id
        LEFT JOIN product_sizes ps ON pc.id = ps.color_id
        WHERE 1=1
    `;
    const queryParams = [];

    // Handle searchTerm
    if (searchTerm) {
        // If searchTerm is 'unisex', treat it as a gender filter
        if (searchTerm.toLowerCase() === 'unisex') {
            query += ' AND p.gender = "unisex"';
        }
        // If searchTerm is 'men', treat it as a gender filter
        else if (['men', 'man', 'male'].includes(searchTerm.toLowerCase())) {
            query += ' AND (p.gender = "men" OR p.gender = "unisex")';
        }
        // If searchTerm is 'women', treat it as a gender filter
        else if (['women', 'woman', 'female'].includes(searchTerm.toLowerCase())) {
            query += ' AND (p.gender = "women" OR p.gender = "unisex")';
        }
        // Otherwise, apply searchTerm to name, description, color, and category
        else {
            query += `
                AND (
                    LOWER(p.name) LIKE ? OR
                    LOWER(p.description) LIKE ? OR
                    LOWER(pc.color) LIKE ? OR
                    LOWER(p.category_id) IN (
                        SELECT id FROM categories WHERE LOWER(name) LIKE ?
                    )
                )
            `;
            const searchTermLike = `%${searchTerm.toLowerCase()}%`;
            queryParams.push(
                searchTermLike, // For p.name
                searchTermLike, // For p.description
                searchTermLike, // For pc.color
                searchTermLike  // For category name
            );
        }
    }

    // Filter by gender (if provided explicitly)
    if (gender) {
        if (['women', 'woman', 'female'].includes(gender.toLowerCase())) {
            query += ' AND (p.gender = "women" OR p.gender = "unisex")';
        } else if (['men', 'man', 'male'].includes(gender.toLowerCase())) {
            query += ' AND (p.gender = "men" OR p.gender = "unisex")';
        } else if (gender.toLowerCase() === 'unisex') {
            query += ' AND p.gender = "unisex"';
        }
    }

    // Filter by category
    if (category) {
        query += ' AND p.category_id = ?';
        queryParams.push(category);
    }

    // Filter by color
    if (color) {
        query += ' AND pc.color = ?';
        queryParams.push(color);
    }

    console.log("SQL Query:", query);
    console.log("Query Parameters:", queryParams);

    try {
        const [rows] = await pool.query(query, queryParams);
        console.log("Raw database results:", rows.length, "rows found");

        // Organize data into structured JSON response
        const productsMap = new Map();
        rows.forEach(row => {
            if (!productsMap.has(row.id)) {
                productsMap.set(row.id, {
                    id: row.id,
                    name: row.name,
                    price: row.price,
                    category_id: row.category_id,
                    gender: row.gender,
                    description: row.description,
                    colors: [] // Add colors array
                });
            }
            // Add color if it doesn't already exist
            const product = productsMap.get(row.id);
            const colorExists = product.colors.some(color => color.color_id === row.color_id);
            if (!colorExists && row.color_id) {
                product.colors.push({
                    color_id: row.color_id,
                    color: row.color,
                    image: row.image ? `${req.protocol}://${req.get('host')}${row.image}` : null,
                    sizes: []
                });
            }
            // Add size to the corresponding color
            if (row.size) {
                const color = product.colors.find(color => color.color_id === row.color_id);
                if (color) {
                    color.sizes.push({ size: row.size, quantity: row.quantity });
                }
            }
        });

        const result = Array.from(productsMap.values());
        console.log("Final response:", result.length, "products");
        res.json(result);
    } catch (err) {
        console.error('Fetch Products Error:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
// Add Product (Admin Only)
app.post('/api/products', verifyAdmin, upload.array('images'), async (req, res) => {
    const { name, price, category_id, gender, description, colors } = req.body;

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Product images are required' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // Insert product
        const [productResult] = await connection.query(
            'INSERT INTO products (name, price, category_id, gender, description) VALUES (?, ?, ?, ?, ?)',
            [name, price, category_id, gender, description]
        );
        const productId = productResult.insertId;

        // Insert colors and sizes
        const colorData = JSON.parse(colors); // Expecting colors as a JSON string
        for (let i = 0; i < colorData.length; i++) {
            const { color, sizes } = colorData[i];
            const image = `/uploads/${req.files[i].filename}`; // Map each image to its color

            // Insert color
            const [colorResult] = await connection.query(
                'INSERT INTO product_colors (product_id, color, image) VALUES (?, ?, ?)',
                [productId, color, image]
            );
            const colorId = colorResult.insertId;

            // Insert sizes
            for (const { size, quantity } of sizes) {
                await connection.query(
                    'INSERT INTO product_sizes (product_id, color_id, size, quantity) VALUES (?, ?, ?, ?)',
                    [productId, colorId, size, quantity]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Product added successfully' });
    } catch (err) {
        await connection.rollback();
        console.error('Add Product Error:', err);
        res.status(500).json({ error: 'Failed to add product' });
    } finally {
        connection.release();
    }
});

app.get('/api/products/:id', async (req, res) => {
    const productId = req.params.id;

    try {
        const [rows] = await pool.query(`
            SELECT 
                p.id, p.name, p.price, p.category_id, p.gender, p.description,
                pc.id AS color_id, pc.color, pc.image,
                ps.size, ps.quantity
            FROM products p
            LEFT JOIN product_colors pc ON p.id = pc.product_id
            LEFT JOIN product_sizes ps ON pc.id = ps.color_id
            WHERE p.id = ?`, [productId]);

        // Organize data into structured JSON response
        const product = {
            id: rows[0].id,
            name: rows[0].name,
            price: rows[0].price,
            category_id: rows[0].category_id,
            gender: rows[0].gender,
            description: rows[0].description,
            colors: []
        };

        const colorsMap = new Map();
        rows.forEach(row => {
            if (!colorsMap.has(row.color_id)) {
                colorsMap.set(row.color_id, {
                    color: row.color,
                    image: row.image,
                    sizes: []
                });
            }
            if (row.size) {
                colorsMap.get(row.color_id).sizes.push({ size: row.size, quantity: row.quantity });
            }
        });

        product.colors = Array.from(colorsMap.values());
        res.json(product);
    } catch (err) {
        console.error('Fetch Product Error:', err);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Update Product (Admin Only)
app.put('/api/products/:id', verifyAdmin, upload.array('images'), async (req, res) => {
    const { id } = req.params;
    const { name, price, category_id, gender, description, colors } = req.body;

    if (!id || !name || !price || !category_id || !colors) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // Update the product details
        await connection.query(
            `UPDATE products SET name = ?, price = ?, category_id = ?, gender = ?, description = ? WHERE id = ?`,
            [name, price, category_id, gender, description, id]
        );

        // Parse colors from JSON string
        const colorData = JSON.parse(colors);

        // Delete old colors and sizes before inserting updated ones
        await connection.query(`DELETE FROM product_sizes WHERE product_id = ?`, [id]);
        await connection.query(`DELETE FROM product_colors WHERE product_id = ?`, [id]);

        // Insert updated colors and images
        for (let i = 0; i < colorData.length; i++) {
            const { color, sizes } = colorData[i];

            // Use new image if uploaded, otherwise keep existing one
            const image = req.files[i] ? `/uploads/${req.files[i].filename}` : colorData[i].image;

            const [colorResult] = await connection.query(
                `INSERT INTO product_colors (product_id, color, image) VALUES (?, ?, ?)`,
                [id, color, image]
            );
            const colorId = colorResult.insertId;

            // Insert updated sizes
            for (const { size, quantity } of sizes) {
                await connection.query(
                    `INSERT INTO product_sizes (product_id, color_id, size, quantity) VALUES (?, ?, ?, ?)`,
                    [id, colorId, size, quantity]
                );
            }
        }

        await connection.commit();
        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Update Product Error:', error);
        res.status(500).json({ error: 'Failed to update product' });
    } finally {
        connection.release();
    }
});

// Delete Product (Admin Only)
app.delete('/api/products/:id', verifyAdmin, async (req, res) => {
    const productId = req.params.id;
    try {
        const [result] = await pool.query('DELETE FROM products WHERE id = ?', [productId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Delete Product Error:', err);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});




// Middleware to extract user from JWT
const authenticateUser = (req, res, next) => {
    console.log('Authorization header:', req.headers.authorization);  // Log header for debugging
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const bearerToken = token.split(' ')[1];
        if (!bearerToken) {
            return res.status(401).json({ error: 'Token format is incorrect' });
        }

        jwt.verify(bearerToken, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Token is invalid' });
            }
            req.user = decoded;
            next();
        });
    } catch (err) {
        return res.status(401).json({ error: 'Failed to authenticate token' });
    }
};

app.post('/api/cart', authenticateUser, async (req, res) => {
    const { product_id, color_id, size, quantity } = req.body;
    const user_email = req.user.email;

    console.log('Request Body:', req.body); // Log the request body
    console.log('User Email:', user_email); // Log the user email

    try {
        // Fetch product details
        const [product] = await pool.query('SELECT * FROM products WHERE id = ?', [product_id]);
        console.log('Product Details:', product); // Log the product details
        if (product.length === 0) return res.status(404).json({ error: 'Product not found' });

        // Fetch color details
        const [color] = await pool.query('SELECT * FROM product_colors WHERE id = ?', [color_id]);
        console.log('Color Details:', color); // Log the color details
        if (color.length === 0) return res.status(404).json({ error: 'Color not found' });

        // Check if the requested size and quantity are available
        const [sizeDetails] = await pool.query(
            'SELECT * FROM product_sizes WHERE product_id = ? AND color_id = ? AND size = ? AND quantity >= ?',
            [product_id, color_id, size, quantity]
        );
        console.log('Size Details:', sizeDetails); // Log the size details
        if (sizeDetails.length === 0) {
            return res.status(400).json({ error: 'Requested size or quantity not available' });
        }

        // Check if the product is already in the cart
        const [existingCartItem] = await pool.query(
            'SELECT * FROM cart WHERE user_email = ? AND product_id = ? AND color_id = ? AND product_sizes = ?',
            [user_email, product_id, color_id, size]
        );
        console.log('Existing Cart Item:', existingCartItem); // Log the existing cart item

        if (existingCartItem.length > 0) {
            // Update quantity if the product with the same size and color is already in the cart
            const updateResult = await pool.query(
                'UPDATE cart SET quantity = quantity + ? WHERE user_email = ? AND product_id = ? AND color_id = ? AND product_sizes = ?',
                [quantity, user_email, product_id, color_id, size]
            );
            console.log('Update Result:', updateResult); // Log the update result
        } else {
            // Insert new product into the cart
            const insertResult = await pool.query(
                'INSERT INTO cart (user_email, product_id, color_id, product_name, product_image_url, product_sizes, quantity, product_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [user_email, product_id, color_id, product[0].name, color[0].image, size, quantity, product[0].price]
            );
            console.log('Insert Result:', insertResult); // Log the insert result
        }

        res.status(200).json({ message: 'Item added to cart' });
    } catch (err) {
        console.error('Add to Cart Error:', err);
        res.status(500).json({ error: 'Failed to add item to cart' });
    }
});
// Get Cart Items for the Signed-in User
app.get('/api/cart', authenticateUser, async (req, res) => {
    const user_email = req.user.email;

    try {
        // Fetch cart items with product details, selected color, selected size, and available colors/sizes
        const [cartItems] = await pool.query(`
            SELECT cart.id, cart.product_id, cart.color_id, cart.product_sizes, cart.quantity, 
                   products.name, products.price, 
                   product_colors.color AS selected_color, product_colors.image AS selected_image,
                   (SELECT JSON_ARRAYAGG(JSON_OBJECT('color_id', pc.id, 'color', pc.color, 'image', pc.image))
                    FROM product_colors pc
                    WHERE pc.product_id = products.id) AS available_colors,
                   (SELECT JSON_ARRAYAGG(JSON_OBJECT('size', ps.size, 'quantity', ps.quantity))
                    FROM product_sizes ps
                    WHERE ps.product_id = products.id AND ps.color_id = cart.color_id) AS available_sizes
            FROM cart 
            JOIN products ON cart.product_id = products.id
            JOIN product_colors ON cart.color_id = product_colors.id
            WHERE cart.user_email = ?`, [user_email]);

        // Format the cart items
        const formattedCartItems = cartItems.map(item => ({
            id: item.id,
            product_id: item.product_id,
            color_id: item.color_id,
            product_name: item.name,
            product_price: item.price,
            selected_color: item.selected_color,
            selected_image: item.selected_image ? `http://localhost:5000${item.selected_image}` : null, // Construct full image URL
            selected_size: item.product_sizes,
            quantity: item.quantity,
            available_colors: typeof item.available_colors === 'string' ? JSON.parse(item.available_colors) : item.available_colors || [], // Parse available colors
            available_sizes: typeof item.available_sizes === 'string' ? JSON.parse(item.available_sizes) : item.available_sizes || [] // Parse available sizes
        }));

        console.log('Formatted cart items:', formattedCartItems); // Debugging

        res.status(200).json(formattedCartItems);
    } catch (err) {
        console.error('Fetch Cart Error:', err);
        res.status(500).json({ error: 'Failed to fetch cart items' });
    }
});
// Update Cart Item Color
// Backend code to update the color and return the new image
app.put('/api/cart/update-color', authenticateUser, async (req, res) => {
    const { cartItemId, colorId } = req.body;

    try {
        // Update the color in the database
        await pool.query('UPDATE cart SET color_id = ? WHERE id = ?', [colorId, cartItemId]);

        // Fetch the new image URL for the selected color
        const [newColor] = await pool.query('SELECT image FROM product_colors WHERE id = ?', [colorId]);

        // Assuming the image is stored as a BLOB and served as a URL
        const imageUrl = `http://localhost:5000${newColor[0].image}`; // Construct the full image URL

        // Send the new image URL in the response
        res.status(200).json({
            success: true,
            image: imageUrl, // Send the image URL
        });
    } catch (err) {
        console.error('Update Color Error:', err);
        res.status(500).json({ error: 'Failed to update color' });
    }
});

// Update Cart Item Size
app.put('/api/cart/update-size', authenticateUser, async (req, res) => {
    const { cart_id, new_size } = req.body;

    try {
        // Update the size in the cart table
        await pool.query(
            'UPDATE cart SET product_sizes = ? WHERE id = ?',
            [new_size, cart_id]
        );

        res.status(200).json({ message: 'Size updated successfully' });
    } catch (err) {
        console.error('Update Size Error:', err);
        res.status(500).json({ error: 'Failed to update size' });
    }
});
// Update Cart Item Quantity
app.put('/api/cart/update-quantity', authenticateUser, async (req, res) => {
    const { cart_id, color_id, size, quantity } = req.body;

    try {
        // Update the quantity in the cart table
        await pool.query(
            'UPDATE cart SET quantity = ? WHERE id = ? AND color_id = ? AND product_sizes = ?',
            [quantity, cart_id, color_id, size]
        );

        res.status(200).json({ message: 'Quantity updated successfully' });
    } catch (err) {
        console.error('Update Quantity Error:', err);
        res.status(500).json({ error: 'Failed to update quantity' });
    }
});

// Remove a Single Item from Cart
app.delete('/api/cart/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const user_email = req.user.email.trim(); // Trim to ensure no spaces in the email

    try {
        // Fetch the cart item based on id and user_email
        const [cartItem] = await pool.query(
            'SELECT * FROM cart WHERE id = ? AND user_email = ?',
            [id, user_email]
        );

        if (cartItem.length === 0) {
            return res.status(404).json({ error: 'Item not found or does not belong to user' });
        }

        // Delete the cart item
        await pool.query('DELETE FROM cart WHERE id = ?', [id]);

        res.status(200).json({ message: 'Item removed from cart' });
    } catch (err) {
        console.error('Remove from Cart Error:', err);
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
});


// Clear Entire Cart for the Signed-in User
app.delete('/api/cart', authenticateUser, async (req, res) => {
    const user_email = req.user.email; // Extracted from token

    try {
        await pool.query('DELETE FROM cart WHERE user_email = ?', [user_email]);
        res.status(200).json({ message: 'Cart cleared successfully' });
    } catch (err) {
        console.error('Clear Cart Error:', err);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});


app.put('/api/cart/update', authenticateUser, async (req, res) => {
    const { cart_id, size, quantity } = req.body;  // Extract cart_id, size, and quantity from the request body
    const user_email = req.user.email;  // Extract user email from the token

    try {
        if (!cart_id || !size || !quantity) {
            return res.status(400).json({ error: 'Cart ID, size, and quantity are required' });
        }

        // Fetch the cart item
        const [cartItem] = await pool.query(
            'SELECT * FROM cart WHERE id = ? AND user_email = ?',
            [cart_id, user_email]
        );
        if (cartItem.length === 0) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        // Check if the requested size and quantity are available in the product_sizes table
        const [sizeDetails] = await pool.query(
            'SELECT * FROM product_sizes WHERE product_id = ? AND size = ? AND quantity >= ?',
            [cartItem[0].product_id, size, quantity]
        );
        if (sizeDetails.length === 0) {
            return res.status(400).json({ error: 'Requested size or quantity not available' });
        }

        // Update the cart item
        await pool.query(
            'UPDATE cart SET product_sizes = ?, quantity = ? WHERE id = ? AND user_email = ?',
            [size, quantity, cart_id, user_email]
        );

        res.status(200).json({ message: 'Cart item updated successfully' });
    } catch (err) {
        console.error('Update Cart Error:', err);
        res.status(500).json({ error: 'Failed to update cart item' });
    }
});


app.get('/api/products/search', async (req, res) => {
    const { color, category, gender } = req.query;

    try {
        let searchQuery = `
            SELECT 
                p.id, p.name, p.price, p.category_id, p.gender, p.description,
                pc.id AS color_id, pc.color, pc.image,
                ps.size, ps.quantity
            FROM products p
            LEFT JOIN product_colors pc ON p.id = pc.product_id
            LEFT JOIN product_sizes ps ON ps.product_id = p.id
            WHERE 1=1
        `;
        const queryParams = [];

        // Search by color
        if (color) {
            searchQuery += ' AND pc.color LIKE ?';
            queryParams.push(`%${color}%`);
        }

        // Search by category
        if (category) {
            const categoryMap = {
                shirts: 3,
                pants: 4,
                dresses: 5,
                shoes: 2,
            };
            const categoryId = categoryMap[category.toLowerCase()];
            if (categoryId) {
                searchQuery += ' AND p.category_id = ?';
                queryParams.push(categoryId);
            }
        }

        // Search by gender
        if (gender) {
            searchQuery += ' AND (p.gender = ? OR p.gender = "unisex")';
            queryParams.push(gender.toLowerCase());
        }

        console.log("Executing Query:", searchQuery);
        console.log("Query Parameters:", queryParams);

        const [rows] = await pool.query(searchQuery, queryParams);

        // Check for valid rows
        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(404).json({ error: 'No products found' });
        }

        console.log("Query Result:", rows); // Debug the query result

        // Organize data into structured JSON response
        const productsMap = new Map();
        rows.forEach(row => {
            if (!row || !row.id) {
                console.warn("Skipping invalid row:", row);
                return; // Skip invalid rows
            }

            if (!productsMap.has(row.id)) {
                productsMap.set(row.id, {
                    id: row.id,
                    name: row.name,
                    price: row.price,
                    category_id: row.category_id,
                    gender: row.gender,
                    description: row.description,
                    colors: []
                });
            }

            // Add color if it doesn't already exist
            const product = productsMap.get(row.id);
            if (row.color_id) {
                const colorExists = product.colors.some(color => color.color_id === row.color_id);

                if (!colorExists) {
                    product.colors.push({
                        color_id: row.color_id,
                        color: row.color,
                        image: row.image ? row.image.toString('base64') : null,
                        sizes: []
                    });
                }

                // Add size to the corresponding color
                if (row.size) {
                    const color = product.colors.find(color => color.color_id === row.color_id);
                    if (color) {
                        color.sizes.push({ size: row.size, quantity: row.quantity });
                    }
                }
            }
        });

        res.json(Array.from(productsMap.values()));
    } catch (err) {
        console.error('Search Error:', err);
        res.status(500).json({ error: 'Failed to perform search' });
    }
});

app.put('/api/cart/update-color', authenticateUser, async (req, res) => {
    const { cart_id, new_color_id, size } = req.body; // Extract cart_id, new_color_id, and size
    const user_email = req.user.email; // Extracted from token

    try {
        if (!cart_id || !new_color_id || !size) {
            return res.status(400).json({ error: 'Cart ID, new color ID, and size are required' });
        }

        // Fetch the cart item
        const [cartItem] = await pool.query(
            'SELECT * FROM cart WHERE id = ? AND user_email = ?',
            [cart_id, user_email]
        );
        if (cartItem.length === 0) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        // Fetch the new color details
        const [newColor] = await pool.query(
            'SELECT * FROM product_colors WHERE id = ? AND product_id = ?',
            [new_color_id, cartItem[0].product_id]
        );
        if (newColor.length === 0) {
            return res.status(404).json({ error: 'New color not found for this product' });
        }

        // Check if the requested size is available for the new color
        const [sizeDetails] = await pool.query(
            'SELECT * FROM product_sizes WHERE product_id = ? AND color_id = ? AND size = ?',
            [cartItem[0].product_id, new_color_id, size]
        );
        if (sizeDetails.length === 0) {
            return res.status(400).json({ error: 'Requested size not available for the new color' });
        }

        // Update the cart item with the new color and size
        await pool.query(
            'UPDATE cart SET color_id = ?, product_sizes = ?, quantity = 1 WHERE id = ? AND user_email = ?',
            [new_color_id, size, cart_id, user_email]
        );

        res.status(200).json({ message: 'Cart item color updated successfully' });
    } catch (err) {
        console.error('Update Cart Color Error:', err);
        res.status(500).json({ error: 'Failed to update cart item color' });
    }
});
// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));