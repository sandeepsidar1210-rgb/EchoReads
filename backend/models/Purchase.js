const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String },
    userEmail: { type: String },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    price: { type: Number, required: true, min: 0 },
    address: { type: String },
    pincode: { type: String },
    paymentMethod: { type: String, enum: ['UPI', 'Cash on Delivery'], default: 'Cash on Delivery' },
  },
  { 
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        ret.address = ret.address || '';
        ret.pincode = ret.pincode || '';
        ret.paymentMethod = ret.paymentMethod || 'Cash on Delivery';
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('Purchase', purchaseSchema);
