const db = require('../config/db');
const crypto = require('crypto');

// Create shipment
exports.createShipment = async (req, res) => {
  const { order_id, shipment_type, courier_name, tracking_code } = req.body;
  try {
    const id = crypto.randomUUID();
    await db.query(
      'INSERT INTO shipments (id, order_id, shipment_type, courier_name, tracking_code) VALUES (?, ?, ?, ?, ?)',
      [id, order_id, shipment_type, courier_name, tracking_code]
    );
    res.status(201).json({ id, message: 'Shipment created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update shipment status
exports.updateShipmentStatus = async (req, res) => {
  const { shipment_status, delivery_notes } = req.body;
  try {
    await db.query(
      'UPDATE shipments SET shipment_status = ?, delivery_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [shipment_status, delivery_notes, req.params.id]
    );
    res.json({ message: 'Shipment updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
