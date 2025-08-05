const express = require("express");
const { 
    createSupplier, 
    getAllSuppliers, 
    getSupplierById, 
    updateSupplier, 
    deleteSupplier, 
    verifySupplier
} = require("../../controllers/supplier/supplierController");

const router = express.Router();

router.post('/create-supplier', createSupplier);
router.get('/get-all-suppliers', getAllSuppliers);
router.get('/get-supplier-by-id/:id', getSupplierById);
router.put('/update-supplier/:id', updateSupplier);
router.delete('/delete-supplier/:id', deleteSupplier);

//admin route
router.put('/admin/verify-supplier/:id', verifySupplier);

module.exports = router;
