# Point of Sale System - User Guide

Welcome to the POS System! This guide will help you navigate and use the system effectively.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Logging In](#logging-in)
3. [Dashboard](#dashboard)
4. [Checkout Process](#checkout-process)
5. [Inventory Management](#inventory-management)
6. [Low Stock Alerts](#low-stock-alerts)
7. [Sales & Returns](#sales--returns)
8. [Reports](#reports)
9. [Settings](#settings)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### System Requirements

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Barcode scanner (optional, works as keyboard input)
- Receipt printer (thermal 58mm or 80mm recommended)
- Stable internet connection (optional for offline mode)

### Accessing the System

Open your web browser and go to: `http://localhost:5173` (or your server URL)

---

## Logging In

### Email/Password Login

1. Enter your registered email address
2. Enter your password
3. Click "Sign In"

### PIN Login (Cashiers)

1. Enter your email address
2. Enter your 4-digit PIN
3. Click "Sign In with PIN"

### After Login

You'll be redirected to the Dashboard showing your daily summary and quick actions.

---

## Dashboard

The Dashboard is your home screen showing at-a-glance information:

| Section | What You See |
|---------|--------------|
| Today's Sales | Total sales amount for today |
| Total Orders | Number of completed sales |
| Low Stock | Items needing attention |
| System Status | Database connection status |

### Quick Actions

- **New Sale**: Start a new checkout
- **View Receipts**: See your sales history
- **Low Stock**: Check items needing restock

---

## Checkout Process

### Starting a Sale

1. Click "New Sale" button or go to `/checkout`
2. The checkout screen appears

### Scanning Items

**With Barcode Scanner:**
- Simply scan the product barcode
- The product will automatically add to the cart

**Without Scanner:**
- Click the search box
- Enter product name, SKU, or barcode manually
- Click the product to add it to the cart

### Managing the Cart

| Action | How to Do It |
|--------|--------------|
| Change quantity | Click quantity, type new value |
| Remove item | Click trash icon |
| Apply discount | Enter discount percentage |
| Add customer | Click customer icon, select or create |

### Processing Payment

1. Click "Complete Sale" button
2. Select payment method:
   - **Cash**: Enter cash received, get change
   - **Card**: Simulated card payment
   - **Transfer**: Bank transfer
3. Click "Process Payment"

### Receiving the Receipt

- Receipt displays with QR code for customer
- Click "Print" for physical receipt
- Click "Save" for digital copy
- Click "Share" to send receipt

---

## Inventory Management

### Viewing Products

Go to **Products** in the sidebar menu:

- **Search**: Type in name, SKU, or barcode
- **Columns**: Name, SKU, Category, Price, Stock Level
- **Color coding**: Green = in stock, Red = low stock

### Adding a New Product

1. Click "Add Product" button
2. Fill in product details:
   - Name
   - SKU (unique identifier)
   - Barcode (leave blank for manual entry)
   - Category
   - Cost price
   - Selling price
   - Initial stock quantity
3. Click "Save"

### Editing Products

1. Find the product in the list
2. Click the edit icon (pencil)
3. Make changes
4. Click "Save"

### Bulk Operations

- **Bulk Price Update**: Select multiple products, update prices
- **Export**: Export product list to CSV
- **Import**: Import products from CSV (admin only)

---

## Low Stock Alerts

### What Are Low Stock Alerts?

Items displayed when current stock is at or below the reorder level.

### Viewing Low Stock

Go to **Low Stock** in the sidebar:

- Red border indicates low stock item
- Shows current quantity vs reorder level
- Shows total units needed

### Creating Purchase Orders

**For Managers and Owners:**
1. Click "Create Purchase Order" on any low stock item
2. Enter quantities to order
3. Select supplier
4. Save order

### Reordering Thresholds

- Default threshold: 10 units
- Adjust per product in product editing
- Custom thresholds can be set per category

---

## Sales & Returns

### Finding Sales

Go to **Receipts** in the sidebar:

- **Search**: By invoice number
- **Filter**: By status (Paid, Pending, Voided)
- **Sort**: By date (newest first)

### Processing a Return

1. Find the original invoice
2. Click "Return" button
3. Select items to return
4. Enter returned quantity
5. Select return reason
6. Click "Confirm Return"

**Note**: Returns require Manager or Owner permission

### Voiding a Sale

1. Find the invoice (only drafts can be voided)
2. Click "Void" button
3. Enter reason
4. Provide Manager PIN for confirmation

**Note**: Only Managers and Owners can void sales

---

## Reports

### Types of Reports

| Report | What You See |
|--------|--------------|
| Sales | Daily/weekly/monthly sales totals |
| Inventory | Total value, low stock items |
| Customers | Outstanding balances, active customers |
| Suppliers | Payables, pending purchases |

### Generating Reports

1. Go to **Reports** in the sidebar
2. Select report type
3. Choose date range
4. Click "Export CSV" to download

### Sales Report Details

- **Total Sales**: Sum of all paid invoices
- **Total Orders**: Number of completed transactions
- **Average Order**: Total sales divided by order count
- **Active Products**: Products with sales in period

### Inventory Report Details

- **Total Products**: Count of active products
- **Low Stock Count**: Items below reorder level
- **Out of Stock**: Items with zero quantity
- **Total Value**: Current inventory value

---

## Settings

### Business Profile

**For Managers and Owners:**
- Shop name and address
- Phone number and tax number
- Currency and tax settings

### Receipt Settings

- Receipt width (58mm/80mm)
- Header and footer text
- Logo display
- QR code generation

### Tax Configuration (Phase 3)

- Default tax rate
- Per-category tax rates
- Tax-inclusive pricing option

### Backup & Restore

- Automatic daily backups
- Manual backup creation
- Restore from backup

**Note**: Backup feature requires Phase 3 implementation

---

## Troubleshooting

### Common Issues

**Cannot log in:**
- Check email and password
- Password is case-sensitive
- Ensure CAPS LOCK is off
- Reset password via email (if configured)

**Barcode scanner not working:**
- Scanner works as keyboard input
- Click on the search input first
- Ensure barcode format matches product
- Check if product exists in system

**Slow performance:**
- Check internet connection
- System may be slow with large databases
- Contact support if persistent

**Receipt prints incorrectly:**
- Check receipt width setting in Settings
- Ensure printer is properly connected
- Try different paper size in settings

### Browser Requirements

- JavaScript enabled
- Cookies enabled
- Modern browser (Chrome 80+, Firefox 75+, Edge 80+)

### Getting Help

1. Check this guide
2. Check the README.md for developers
3. Contact your system administrator
4. Restart the application

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+F | Search products in checkout |
| Esc | Clear search/input |
| Enter | Confirm/Submit |
| Tab | Move between fields |

---

## User Roles & Permissions

| Role | Can | Cannot |
|------|-----|--------|
| **Owner** | All operations, user management, settings | None |
| **Manager** | Create returns, void sales, view all data | Create users, modify settings |
| **Cashier** | Create sales, process payments | Returns, voids, reports, settings |

---

## Data Safety

- All data is stored in the database
- Regular backups recommended
- Local data persists during network loss
- Syncs automatically when online

---

End of User Guide

For technical support, refer to the README.md or contact your system administrator.