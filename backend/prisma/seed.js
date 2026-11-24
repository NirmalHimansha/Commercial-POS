const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create default admin user
  const passwordHash = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@grocery.com' },
    update: {},
    create: {
      email: 'admin@grocery.com',
      passwordHash,
      name: 'Admin User',
      role: 'OWNER',
    },
  });

  console.log(`Created admin user: ${adminUser.email}`);

  // Create categories using raw SQL for upsert behavior
  for (const cat of ['Fruits', 'Vegetables', 'Dairy', 'Meat & Poultry', 'Bakery', 'Beverages', 'Snacks', 'Cleaning', 'Personal Care', 'Frozen']) {
    await prisma.category.upsert({
      where: { name: cat },
      update: {},
      create: { name: cat },
    });
  }
  const categoryCount = await prisma.category.count();
  console.log(`Created ${categoryCount} categories`);

  // Create suppliers - use raw SQL for upsert since name isn't unique
  const suppliers = [
    { name: 'Fresh Farms Ltd', contact: 'John Smith', phone: '011-1234567', email: 'info@freshfarms.com' },
    { name: 'Super Mart Distributors', contact: 'Jane Doe', phone: '011-2345678', email: 'sales@supermart.lk' },
    { name: 'Island Produce', contact: 'Raj Kumar', phone: '011-3456789', email: 'contact@islandproduce.lk' },
  ];

  for (const sup of suppliers) {
    await prisma.supplier.create({ data: sup }).catch(() => {});
  }
  const supplierCount = await prisma.supplier.count();
  console.log(`Created ${supplierCount} suppliers`);

  // Create sample products (about 200 for demo)
  const products = [];
  const fruts = ['Apple', 'Banana', 'Orange', 'Mango', 'Pineapple', 'Grapes', 'Strawberry', 'Watermelon', 'Papaya', 'Pear'];
  const veg = ['Carrot', 'Broccoli', 'Cauliflower', 'Cabbage', 'Spinach', 'Kale', 'Lettuce', 'Tomato', 'Cucumber', 'Bell Pepper'];
  const dairy = ['Milk', 'Yogurt', 'Cheese', 'Butter', 'Ghee', 'Eggs', 'Cream', 'Paneer', 'Curd', 'Whipped Cream'];
  const meat = ['Chicken', 'Beef', 'Pork', 'Fish', 'Shrimp', 'Eggs', 'Chicken Thighs', 'Beef Strips', 'Pork Chops', 'Salmon'];
  const bakery = ['Bread', 'Buns', 'Croissants', 'Muffins', 'Cupcakes', 'Cookies', 'Pies', 'Cakes', 'Donuts', 'Bagels'];
  const beverages = ['Coca Cola', 'Pepsi', 'Sprite', 'Fanta', 'Mountain Dew', 'Orange Juice', 'Apple Juice', 'Water', 'Coffee', 'Tea'];
  const snacks = ['Chips', 'Pretzels', 'Nuts', 'Cookies', 'Chocolate', 'Candy', 'Crackers', 'Popcorn', 'Rice Cakes', 'Dried Fruit'];
  const cleaning = ['Dish Soap', 'Laundry Detergent', 'All Purpose Cleaner', 'Toilet Bowl Cleaner', 'Glass Cleaner', 'Paper Towels', 'Tissues', 'Trash Bags', 'Sponges', 'Brushes'];
  const personal = ['Soap', 'Shampoo', 'Conditioner', 'Body Wash', 'Deodorant', 'Toothpaste', 'Toothbrush', 'Razor', 'Lotion', 'Sunscreen'];
  const frozen = ['Ice Cream', 'Frozen Pizza', 'Frozen Vegetables', 'Frozen Fruits', 'Frozen Noodles', 'Frozen Bread', 'Frozen Dumplings', 'Ice Pops', 'Frozen Cakes', 'Frozen Meals'];

  for (let i = 0; i < 20; i++) {
    // Fruits
    products.push({
      name: `${fruts[i % fruts.length]} (${i + 1})`,
      sku: `FRUIT-${(i % fruts.length) + 1}`,
      barcode: `123456${i.toString().padStart(3, '0')}`,
      costPrice: parseFloat((10 + i * 0.5).toFixed(2)),
      sellingPrice: parseFloat((15 + i * 0.8).toFixed(2)),
      taxRate: 0.0,
      reorderLevel: 10,
      categoryId: 1,
      isActive: true,
      unit: 'pcs',
    });

    // Vegetables
    products.push({
      name: `${veg[i % veg.length]} (${i + 1})`,
      sku: `VEG-${(i % veg.length) + 1}`,
      barcode: `234567${i.toString().padStart(3, '0')}`,
      costPrice: parseFloat((8 + i * 0.3).toFixed(2)),
      sellingPrice: parseFloat((12 + i * 0.5).toFixed(2)),
      taxRate: 0.0,
      reorderLevel: 15,
      categoryId: 2,
      isActive: true,
      unit: 'pcs',
    });

    // Dairy
    products.push({
      name: `${dairy[i % dairy.length]} ${i + 1}`,
      sku: `DAIRY-${(i % dairy.length) + 1}`,
      barcode: `345678${i.toString().padStart(3, '0')}`,
      costPrice: parseFloat((12 + i * 0.7).toFixed(2)),
      sellingPrice: parseFloat((18 + i * 1.2).toFixed(2)),
      taxRate: 0.0,
      reorderLevel: 8,
      categoryId: 3,
      isActive: true,
      unit: 'pcs',
    });

    // Meat
    products.push({
      name: `${meat[i % meat.length]} ${i + 1}`,
      sku: `MEAT-${(i % meat.length) + 1}`,
      barcode: `456789${i.toString().padStart(3, '0')}`,
      costPrice: parseFloat((15 + i * 1.5).toFixed(2)),
      sellingPrice: parseFloat((25 + i * 2.0).toFixed(2)),
      taxRate: 0.0,
      reorderLevel: 5,
      categoryId: 4,
      isActive: true,
      unit: 'kg',
    });

    // Bakery
    products.push({
      name: `${bakery[i % bakery.length]} ${i + 1}`,
      sku: `BAKERY-${(i % bakery.length) + 1}`,
      barcode: `567890${i.toString().padStart(3, '0')}`,
      costPrice: parseFloat((5 + i * 0.3).toFixed(2)),
      sellingPrice: parseFloat((8 + i * 0.5).toFixed(2)),
      taxRate: 0.0,
      reorderLevel: 15,
      categoryId: 5,
      isActive: true,
      unit: 'pcs',
    });

    // Beverages
    products.push({
      name: `${beverages[i % beverages.length]} ${i + 1}`,
      sku: `BEV-${(i % beverages.length) + 1}`,
      barcode: `678901${i.toString().padStart(3, '0')}`,
      costPrice: parseFloat((2 + i * 0.1).toFixed(2)),
      sellingPrice: parseFloat((3 + i * 0.15).toFixed(2)),
      taxRate: 0.0,
      reorderLevel: 20,
      categoryId: 6,
      isActive: true,
      unit: 'pcs',
    });

    // Snacks
    products.push({
      name: `${snacks[i % snacks.length]} ${i + 1}`,
      sku: `SNACK-${(i % snacks.length) + 1}`,
      barcode: `789012${i.toString().padStart(3, '0')}`,
      costPrice: parseFloat((3 + i * 0.2).toFixed(2)),
      sellingPrice: parseFloat((5 + i * 0.3).toFixed(2)),
      taxRate: 0.0,
      reorderLevel: 25,
      categoryId: 7,
      isActive: true,
      unit: 'pcs',
    });

    // Cleaning
    products.push({
      name: `${cleaning[i % cleaning.length]} ${i + 1}`,
      sku: `CLEAN-${(i % cleaning.length) + 1}`,
      barcode: `890123${i.toString().padStart(3, '0')}`,
      costPrice: parseFloat((10 + i * 1).toFixed(2)),
      sellingPrice: parseFloat((15 + i * 1.5).toFixed(2)),
      taxRate: 0.0,
      reorderLevel: 5,
      categoryId: 8,
      isActive: true,
      unit: 'pcs',
    });

    // Personal Care
    products.push({
      name: `${personal[i % personal.length]} ${i + 1}`,
      sku: `CARE-${(i % personal.length) + 1}`,
      barcode: `901234${i.toString().padStart(3, '0')}`,
      costPrice: parseFloat((8 + i * 0.8).toFixed(2)),
      sellingPrice: parseFloat((12 + i * 1.2).toFixed(2)),
      taxRate: 0.0,
      reorderLevel: 10,
      categoryId: 9,
      isActive: true,
      unit: 'pcs',
    });

    // Frozen
    products.push({
      name: `${frozen[i % frozen.length]} ${i + 1}`,
      sku: `FROZ-${(i % frozen.length) + 1}`,
      barcode: `012345${i.toString().padStart(3, '0')}`,
      costPrice: parseFloat((12 + i * 1).toFixed(2)),
      sellingPrice: parseFloat((18 + i * 1.5).toFixed(2)),
      taxRate: 0.0,
      reorderLevel: 8,
      categoryId: 10,
      isActive: true,
      unit: 'pcs',
    });
  }

  for (const product of products) {
    try {
      await prisma.product.create({ data: product });
    } catch (e) {
      // Skip duplicates
    }
  }

  console.log(`Created ${products.length} products`);

  // Create sample customers
  const customerData = [
    { name: 'John Perera', phone: '077-1234567', address: '123 Main Street, Colombo' },
    { name: 'Jane Silva', phone: '077-2345678', address: '45 Hill Road, Kandy' },
    { name: 'Raj Mendis', phone: '077-3456789', address: '78 Beach Ave, Galle' },
    { name: 'Kamal Weerasinghe', phone: '077-4567890', address: '22 Park Street, Negombo' },
    { name: 'Suja Wijesinghe', phone: '077-5678901', address: '9 Market Lane, Jaffna' },
  ];

  for (const cust of customerData) {
    try {
      await prisma.customer.create({ data: cust });
    } catch (e) {
      // Skip duplicates
    }
  }
  const customerCount = await prisma.customer.count();
  console.log(`Created ${customerCount} customers`);

  // Create sample cashiers
  const managerPasswordHash = await bcrypt.hash('manager123', 12);
  const cashierPasswordHash = await bcrypt.hash('cashier123', 12);

  await prisma.user.upsert({
    where: { email: 'manager@grocery.com' },
    update: {},
    create: {
      email: 'manager@grocery.com',
      passwordHash: managerPasswordHash,
      name: 'Shop Manager',
      role: 'MANAGER',
      pin: '1234',
    },
  });

  try {
    await prisma.user.create({
      data: {
        email: 'cashier1@grocery.com',
        passwordHash: cashierPasswordHash,
        name: 'Cashier One',
        role: 'CASHIER',
        pin: '1111',
      },
    });
  } catch (e) {
    // Skip duplicate
  }

  try {
    await prisma.user.create({
      data: {
        email: 'cashier2@grocery.com',
        passwordHash: cashierPasswordHash,
        name: 'Cashier Two',
        role: 'CASHIER',
        pin: '2222',
      },
    });
  } catch (e) {
    // Skip duplicate
  }

  console.log('Created manager and cashiers');

  // Create initial stock movements
  const stockMovements = [];
  for (let i = 1; i <= 200; i++) {
    // Initial stock in
    stockMovements.push({
      productId: i,
      type: 'IN',
      quantity: (50 + i),
      referenceType: 'initial',
      reason: 'Initial stock',
    });
  }

  for (const movement of stockMovements) {
    try {
      await prisma.stockMovement.create({ data: movement });
    } catch (e) {
      // Skip errors
    }
  }

  console.log('Created initial stock movements');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });