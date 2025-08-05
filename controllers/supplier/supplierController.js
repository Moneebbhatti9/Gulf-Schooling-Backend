const Supplier = require("../../models/supplier/supplierModel");
const AllUsers = require("../../models/Auth/allUsersModel")

// Create a new supplier
exports.createSupplier = async (req, res) => {
    try {
        const { userId } = req.body;

        // Check if a supplier with the same userId already exists
        const existingSupplier = await Supplier.findOne({ userId });
        if (existingSupplier) {
            return res.status(400).json({ message: "Supplier with this userId already exists" });
        }

        const supplier = new Supplier(req.body);
        await supplier.save();

         const user = await AllUsers.findByIdAndUpdate(
                    userId,
                    { isVerified: true },
                    { new: true }
                );
        
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }
        res.status(201).json(supplier);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all suppliers
exports.getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find().populate('userId');
        res.status(200).json(suppliers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a supplier by ID
exports.getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findOne({ userId: req.params.id });
        if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
        res.status(200).json(supplier);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a supplier by ID
exports.updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
        res.status(200).json(supplier);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a supplier by ID
exports.deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);
        if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
        res.status(200).json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.verifySupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(
            req.params.id,
            { isAdminVerified: true },
            { new: true }
        );

        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        res.status(200).json({ message: "Supplier verified successfully", supplier });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};