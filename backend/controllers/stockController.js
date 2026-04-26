const db = require('../db');
const { notifyStockManagersLowStock } = require('../utils/cronScheduler');

// Add new stock item
exports.addItem = async (req, res) => {
    try {
        const { item_name, item_code, category, quantity, unit, min_quantity, location, supplier, purchase_date, purchase_price, description, status, image_url } = req.body;

        // Auto-calculate status based on quantity
        let itemStatus = status || 'available';
        if (!status) {
            if (quantity <= 0) itemStatus = 'depleted';
            else if (quantity < (min_quantity || 5)) itemStatus = 'low_stock';
        }

        const [result] = await db.execute(
            `INSERT INTO stock_items (item_name, item_code, category, quantity, unit, min_quantity, location, supplier, purchase_date, purchase_price, description, status, image_url) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [item_name, item_code || null, category || 'other', quantity || 0, unit || 'pieces', min_quantity || 5, location || null, supplier || null, purchase_date || null, purchase_price || null, description || null, itemStatus, image_url || null]
        );

        // Record initial transaction if quantity > 0
        if (quantity > 0) {
            await db.execute(
                `INSERT INTO stock_transactions (item_id, transaction_type, quantity, quantity_before, quantity_after, unit_price, total_price, recorded_by) 
                 VALUES (?, 'purchase', ?, 0, ?, ?, ?, ?)`,
                [result.insertId, quantity, quantity, purchase_price || null, (quantity * (purchase_price || 0)), req.user.id]
            );
        }

        // Auto SMS to admin/stock_manager if it starts in low/depleted state
        if (itemStatus === 'low_stock' || itemStatus === 'depleted') {
            notifyStockManagersLowStock({
                item_name, category: category || 'other',
                quantity: quantity || 0, unit: unit || 'pieces',
                min_quantity: min_quantity || 5, status: itemStatus
            }).catch(()=>{});
        }

        res.status(201).json({ message: 'Stock item added', itemId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all stock items
exports.getItems = async (req, res) => {
    try {
        const [items] = await db.execute('SELECT * FROM stock_items ORDER BY item_name');
        res.status(200).json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single item by ID
exports.getItemById = async (req, res) => {
    try {
        const { id } = req.params;
        const [items] = await db.execute('SELECT * FROM stock_items WHERE id = ?', [id]);
        if (items.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.status(200).json(items[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update stock item (supports both partial PATCH-style and full PUT updates)
exports.updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body || {};

        // Load full current row so any field omitted from the request keeps its value
        const [current] = await db.execute('SELECT * FROM stock_items WHERE id = ?', [id]);
        if (current.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }
        const row = current[0];

        // Helper: pick value from body if defined (allows null/empty), else fall back to existing row
        const pick = (key) => (body[key] !== undefined ? body[key] : row[key]);

        const item_name     = pick('item_name');
        const item_code     = body.item_code     !== undefined ? body.item_code     : row.item_code;
        const category      = pick('category') || 'other';
        const unit          = pick('unit') || 'pieces';
        const min_quantity  = body.min_quantity  !== undefined ? Number(body.min_quantity) : (row.min_quantity ?? 5);
        const location      = body.location      !== undefined ? body.location      : row.location;
        const supplier      = body.supplier      !== undefined ? body.supplier      : row.supplier;
        const purchase_date = body.purchase_date !== undefined ? (body.purchase_date || null) : row.purchase_date;
        const purchase_price= body.purchase_price!== undefined ? body.purchase_price: row.purchase_price;
        const description   = body.description   !== undefined ? body.description   : row.description;
        const image_url     = body.image_url     !== undefined ? body.image_url     : row.image_url;

        const currentQty = Number(row.quantity) || 0;
        const prevStatus = row.status;
        const newQty = body.quantity !== undefined ? Number(body.quantity) : currentQty;

        // Auto-derive status from quantity unless caller provided one explicitly
        let itemStatus = body.status;
        if (!itemStatus) {
            if (newQty <= 0) itemStatus = 'depleted';
            else if (newQty < min_quantity) itemStatus = 'low_stock';
            else itemStatus = 'available';
        }

        await db.execute(
            `UPDATE stock_items SET item_name = ?, item_code = ?, category = ?, quantity = ?, unit = ?, min_quantity = ?,
             location = ?, supplier = ?, purchase_date = ?, purchase_price = ?, description = ?, status = ?, image_url = ?
             WHERE id = ?`,
            [
                item_name, item_code ?? null, category, newQty, unit, min_quantity,
                location ?? null, supplier ?? null, purchase_date ?? null,
                purchase_price ?? null, description ?? null, itemStatus, image_url ?? null, id
            ]
        );

        // Record adjustment transaction if quantity changed
        if (body.quantity !== undefined && newQty !== currentQty) {
            const transType = newQty > currentQty ? 'purchase' : 'adjustment';
            await db.execute(
                `INSERT INTO stock_transactions (item_id, transaction_type, quantity, quantity_before, quantity_after, recorded_by)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [id, transType, Math.abs(newQty - currentQty), currentQty, newQty, req.user?.id || null]
            );
        }

        // Fire low-stock SMS only when crossing the threshold (not every save)
        if ((itemStatus === 'low_stock' || itemStatus === 'depleted') && itemStatus !== prevStatus) {
            notifyStockManagersLowStock({
                item_name, category, quantity: newQty, unit,
                min_quantity, status: itemStatus
            }).catch(() => {});
        }

        res.status(200).json({ message: 'Stock updated', id: Number(id), quantity: newQty, status: itemStatus });
    } catch (error) {
        console.error('Stock update error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete stock item
exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM stock_items WHERE id = ?', [id]);
        res.json({ message: 'Item deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add stock transaction
exports.addTransaction = async (req, res) => {
    try {
        const { item_id, transaction_type, quantity, unit_price, reference, notes } = req.body;

        // Get current quantity
        const [current] = await db.execute('SELECT quantity FROM stock_items WHERE id = ?', [item_id]);
        if (current.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const currentQty = current[0].quantity;
        let quantityAfter = currentQty;

        // Calculate new quantity based on transaction type
        if (transaction_type === 'purchase' || transaction_type === 'return') {
            quantityAfter = currentQty + quantity;
        } else if (transaction_type === 'usage' || transaction_type === 'damage' || transaction_type === 'disposal') {
            quantityAfter = Math.max(0, currentQty - quantity);
        }

        // Update item quantity (use the item's own min_quantity threshold)
        const [meta] = await db.execute('SELECT item_name, category, unit, min_quantity, status FROM stock_items WHERE id = ?', [item_id]);
        const minQ = meta[0]?.min_quantity || 5;
        const prevStatus = meta[0]?.status;

        let newStatus = 'available';
        if (quantityAfter <= 0) newStatus = 'depleted';
        else if (quantityAfter < minQ) newStatus = 'low_stock';

        await db.execute(
            'UPDATE stock_items SET quantity = ?, status = ?, last_restocked = CURDATE() WHERE id = ?',
            [quantityAfter, newStatus, item_id]
        );

        // Record transaction
        const [result] = await db.execute(
            `INSERT INTO stock_transactions (item_id, transaction_type, quantity, quantity_before, quantity_after, unit_price, total_price, reference, notes, recorded_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [item_id, transaction_type, quantity, currentQty, quantityAfter, unit_price, (quantity * (unit_price || 0)), reference, notes, req.user.id]
        );

        // Auto-SMS to stock managers when crossing threshold
        if ((newStatus === 'low_stock' || newStatus === 'depleted') && newStatus !== prevStatus) {
            notifyStockManagersLowStock({
                item_name: meta[0]?.item_name,
                category: meta[0]?.category,
                quantity: quantityAfter,
                unit: meta[0]?.unit,
                min_quantity: minQ,
                status: newStatus
            }).catch(()=>{});
        }

        res.status(201).json({ message: 'Transaction recorded', transactionId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all transactions
exports.getTransactions = async (req, res) => {
    try {
        const [transactions] = await db.execute(
            `SELECT st.*, si.item_name, si.item_code 
             FROM stock_transactions st 
             JOIN stock_items si ON st.item_id = si.id 
             ORDER BY st.transaction_date DESC`
        );
        res.status(200).json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get transactions for specific item
exports.getItemTransactions = async (req, res) => {
    try {
        const { id } = req.params;
        const [transactions] = await db.execute(
            'SELECT * FROM stock_transactions WHERE item_id = ? ORDER BY transaction_date DESC',
            [id]
        );
        res.status(200).json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get low stock items
exports.getLowStockItems = async (req, res) => {
    try {
        const [items] = await db.execute(
            'SELECT * FROM stock_items WHERE quantity <= min_quantity OR status IN ("low_stock", "depleted") ORDER BY quantity ASC'
        );
        res.status(200).json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get items by category
exports.getItemsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const [items] = await db.execute(
            'SELECT * FROM stock_items WHERE category = ? ORDER BY item_name',
            [category]
        );
        res.status(200).json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get stock summary
exports.getStockSummary = async (req, res) => {
    try {
        const [[total]] = await db.execute('SELECT COUNT(*) as count FROM stock_items');
        const [[totalQty]] = await db.execute('SELECT SUM(quantity) as total FROM stock_items');
        const [[lowStock]] = await db.execute('SELECT COUNT(*) as count FROM stock_items WHERE status IN ("low_stock", "depleted")');
        const [[depleted]] = await db.execute('SELECT COUNT(*) as count FROM stock_items WHERE status = "depleted"');

        const [byCategory] = await db.execute(
            'SELECT category, COUNT(*) as count, SUM(quantity) as total_qty FROM stock_items GROUP BY category'
        );

        res.status(200).json({
            total_items: total.count,
            total_quantity: totalQty.total || 0,
            low_stock_count: lowStock.count,
            depleted_count: depleted.count,
            by_category: byCategory
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get stock valuation report
exports.getStockValuation = async (req, res) => {
    try {
        const [items] = await db.execute(
            'SELECT item_name, item_code, category, quantity, unit, purchase_price, (quantity * COALESCE(purchase_price, 0)) as total_value FROM stock_items ORDER BY total_value DESC'
        );

        const [[totalValue]] = await db.execute(
            'SELECT SUM(quantity * COALESCE(purchase_price, 0)) as total FROM stock_items'
        );

        const [byCategory] = await db.execute(
            'SELECT category, SUM(quantity * COALESCE(purchase_price, 0)) as total_value, COUNT(*) as item_count FROM stock_items GROUP BY category ORDER BY total_value DESC'
        );

        res.status(200).json({
            items,
            total_value: totalValue.total || 0,
            by_category: byCategory
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get suppliers report
exports.getSuppliersReport = async (req, res) => {
    try {
        const [suppliers] = await db.execute(
            `SELECT supplier, COUNT(*) as item_count, SUM(quantity) as total_quantity, 
             SUM(quantity * COALESCE(purchase_price, 0)) as total_value
             FROM stock_items 
             WHERE supplier IS NOT NULL AND supplier != ''
             GROUP BY supplier 
             ORDER BY total_value DESC`
        );

        res.status(200).json(suppliers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get depleted items
exports.getDepletedItems = async (req, res) => {
    try {
        const [items] = await db.execute(
            "SELECT * FROM stock_items WHERE status = 'depleted' OR quantity = 0 ORDER BY item_name"
        );
        res.status(200).json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Export stock to CSV
exports.exportStock = async (req, res) => {
    try {
        const { category, status, low_stock } = req.query;

        let query = 'SELECT * FROM stock_items WHERE 1=1';
        const params = [];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        if (low_stock === 'true') {
            query += ' AND (quantity <= min_quantity OR status IN ("low_stock", "depleted"))';
        }

        query += ' ORDER BY category, item_name';

        const [items] = await db.execute(query, params);

        // Create CSV
        const headers = ['Item Code', 'Item Name', 'Category', 'Quantity', 'Unit', 'Min Qty', 'Status', 'Location', 'Supplier', 'Price', 'Value'];
        const rows = items.map(item => [
            item.item_code || '',
            item.item_name,
            item.category,
            item.quantity,
            item.unit,
            item.min_quantity,
            item.status,
            item.location || '',
            item.supplier || '',
            item.purchase_price || 0,
            (item.quantity * (item.purchase_price || 0)).toFixed(2)
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=stock_inventory.csv');
        res.send(csv);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Search stock
exports.searchStock = async (req, res) => {
    try {
        const { q, category } = req.query;

        if (!q) {
            return res.status(400).json({ message: 'Search query required' });
        }

        let query = 'SELECT * FROM stock_items WHERE (item_name LIKE ? OR item_code LIKE ? OR supplier LIKE ?)';
        const searchPattern = `%${q}%`;
        const params = [searchPattern, searchPattern, searchPattern];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' ORDER BY item_name';

        const [items] = await db.execute(query, params);
        res.status(200).json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Generate barcode data
exports.generateBarcode = async (req, res) => {
    try {
        const { id } = req.params;
        const [items] = await db.execute('SELECT * FROM stock_items WHERE id = ?', [id]);

        if (items.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const item = items[0];
        const barcodeData = {
            item_id: item.id,
            item_code: item.item_code || `ITEM-${item.id}`,
            item_name: item.item_name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit
        };

        res.status(200).json(barcodeData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
