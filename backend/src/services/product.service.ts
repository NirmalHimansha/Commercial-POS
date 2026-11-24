import { prisma } from '../utils/prisma';

export class ProductService {
  async createProduct(data: {
    name: string;
    sku: string;
    costPrice: number;
    sellingPrice: number;
    taxRate?: number;
    reorderLevel?: number;
    categoryId?: number;
    brand?: string;
    unit?: string;
    barcode?: string;
    isActive?: boolean;
  }) {
    const existing = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existing) {
      throw new Error('Product with this SKU already exists');
    }

    return await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        taxRate: data.taxRate || 0,
        reorderLevel: data.reorderLevel || 10,
        categoryId: data.categoryId,
        brand: data.brand,
        unit: data.unit,
        barcode: data.barcode,
        isActive: data.isActive ?? true,
      },
    });
  }

  async searchProducts(params: {
    search?: string;
    barcode?: string;
    categoryId?: number;
    isActive?: boolean;
    belowReorderLevel?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
        { barcode: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.barcode) {
      where.barcode = params.barcode;
    }

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { category: true },
      }),
      prisma.product.count({ where }),
    ]);

    // Filter by reorder level if requested
    let filteredProducts = products;
    let filteredTotal = total;
    if (params.belowReorderLevel) {
      const quantities = await Promise.all(
        products.map(async (p) => ({
          product: p,
          quantity: await this.calculateAvailableQuantity(p.id),
        }))
      );

      filteredProducts = quantities
        .filter(({ product, quantity }) => {
          return quantity <= (product.reorderLevel || 10);
        })
        .map(({ product }) => product);
      filteredTotal = filteredProducts.length;
    }

    return {
      products: filteredProducts,
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit),
      },
    };
  }

  async getProductById(id: number) {
    return await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  async updateProduct(id: number, data: {
    name?: string;
    sku?: string;
    costPrice?: number;
    sellingPrice?: number;
    taxRate?: number;
    reorderLevel?: number;
    categoryId?: number;
    brand?: string;
    unit?: string;
    barcode?: string;
    isActive?: boolean;
  }) {
    return await prisma.product.update({
      where: { id },
      data,
    });
  }

  async deleteProduct(id: number) {
    return await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async bulkPriceUpdate(params: {
    productIds: number[];
    field: 'costPrice' | 'sellingPrice';
    operation: 'percentage' | 'fixed' | 'absolute';
    value: number;
  }) {
    const results = [];

    for (const id of params.productIds) {
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) continue;

      let newValue: number;
      const currentValue = product[params.field] || 0;

      if (params.operation === 'percentage') {
        const pct = params.value;
        const multiplier = 1 + (pct / 100);
        newValue = currentValue * multiplier;
      } else if (params.operation === 'fixed') {
        const delta = params.value;
        newValue = currentValue + delta;
      } else {
        newValue = params.value;
      }

      await prisma.product.update({
        where: { id },
        data: { [params.field]: newValue },
      });

      results.push({ id, oldValue: currentValue, newValue });
    }

    return results;
  }

  async getLowStockProducts() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
    });

    const results = await Promise.all(
      products.map(async (product) => {
        const quantity = await this.calculateAvailableQuantity(product.id);
        return {
          ...product,
          currentQuantity: quantity,
          isLowStock: quantity <= (product.reorderLevel || 10),
        };
      })
    );

    return results
      .filter((p) => p.isLowStock)
      .sort((a, b) => a.currentQuantity - b.currentQuantity);
  }

  async calculateAvailableQuantity(productId: number): Promise<number> {
    const movements = await prisma.stockMovement.findMany({
      where: { productId },
    });

    let quantity = 0;
    for (const m of movements) {
      if (m.type === 'IN' || m.type === 'ADJUSTMENT_IN') {
        quantity += Number(m.quantity);
      } else {
        quantity -= Number(m.quantity);
      }
    }

    return quantity;
  }
}