const Customer = require('../models/Customer');

// Get all customers
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new customer
exports.createCustomer = async (req, res) => {
  try {
    const { name, email, phone, totalSpent, lastPurchase } = req.body;
    
    // Check if customer with email already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ error: 'Customer with this email already exists' });
    }

    const customer = new Customer({
      name,
      email,
      phone,
      totalSpent,
      lastVisit: lastPurchase // Map lastPurchase to lastVisit in our schema
    });

    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get customer by ID
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const { name, email, phone, totalSpent, lastPurchase } = req.body;
    
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // If email is being changed, check for duplicates
    if (email !== customer.email) {
      const existingCustomer = await Customer.findOne({ email });
      if (existingCustomer) {
        return res.status(400).json({ error: 'Customer with this email already exists' });
      }
    }

    customer.name = name || customer.name;
    customer.email = email || customer.email;
    customer.phone = phone || customer.phone;
    customer.totalSpent = totalSpent || customer.totalSpent;
    if (lastPurchase) {
      customer.lastVisit = lastPurchase;
    }

    await customer.save();
    res.json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 