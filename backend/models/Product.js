const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0 // Set default quantity to 0
    }
}, {
        timestamps: true
    });

module.exports = mongoose.model('Product', productSchema);
