import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma';
import { toMinorUnits, fromMinorUnits } from '../utils/currency';

export class ProductService {
  constructor(private app: FastifyInstance) {}

  async createProduct(data: {
    name: string;
    sku: string;
    costPrice: string;
    sellingPrice: string;
    taxRate?: string;
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
        taxRate: data.taxRate || '0',
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
    if (params.belowReorderLevel) {
      const allProducts = await prisma.product.findMany({
        where,
        include: { category: true },
      });

      filteredProducts = allProducts.filter((p) => {
        const quantity = this.calculateAvailableQuantity(p.id);
        return quantity <= (p.reorderLevel || 10);
      });

      const filteredTotal = await prisma.product.count({
        where: {
          ...where,
          ...(params.belowReorderLevel && {
            // We need a different approach for this
          }),
        },
      });
    }

    return {
      products: filteredProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductById(id: number) {
    return await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  async updateProduct(id: number, data: Partial<{
    name: string;
    sku: string;
    costPrice: string;
    sellingPrice: string;
    taxRate: string;
    reorderLevel: number;
    categoryId: number;
    brand: string;
    unit: string;
    barcode: string;
    isActive: boolean;
  }>) {
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
    value: string;
  }) {
    const results = [];

    for (const id of params.productIds) {
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) continue;

      let newValue: string;
      const currentValue = product[params.field];

      if (params.operation === 'percentage') {
        const pct = parseFloat(params.value);
        const current = parseFloat(currentValue);
        const multiplier = 1 + (pct / 100);
        newValue = (current * multiplier).toString();
      } else if (params.operation === 'fixed') {
        const current = parseFloat(currentValue);
        const delta = parseFloat(params.value);
        newValue = (current + delta).toString();
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

    return products
      .map((product) => {
        const quantity = this.calculateAvailableQuantity(product.id);
        return {
          ...product,
          currentQuantity: quantity,
          isLowStock: quantity <= (product.reorderLevel || 10),
        };
      })
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
        quantity += parseFloat(m.quantity.toString());
      } else {
        quantity -= parseFloat(m.quantity.toString());
      }
    }

    return quantity;
  }
}