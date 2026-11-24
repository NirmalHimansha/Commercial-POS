# Point of Sale (POS) System

A production-quality Point of Sale and inventory management system for small local grocery stores and retail shops. Built with React + TypeScript + Tailwind for the frontend, and Node.js + Fastify for the backend.

## Features

- **Fast & Reliable**: Optimized for daily retail operations
- **Easy to Use**: Designed for non-technical shopkeepers and cashiers
- **Offline Capable**: PWA support for offline operations
- **Barcode Scanning**: Built-in barcode scanner support
- **Role-Based Access**: Owner, Manager, and Cashier roles with appropriate permissions

### Core Features

1. **Sales & Invoicing**: Create invoices, process payments, returns, and voids
2. **Inventory Management**: Track stock levels, low stock alerts, and reorder suggestions
3. **Pricing**: Product pricing with discounts and tax calculations
4. **Customer Management**: Customer profiles and credit tracking
5. **Purchasing**: Supplier management and purchase orders
6. **Shift Management**: Cash register tracking per shift
7. **Reporting**: Sales, inventory, and financial reports
8. **Security**: JWT authentication with secure PIN-based login

## Technology Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- React Query (server state)
- Zustand (client state)
- Vite build tool
- PWA support

### Backend
- Node.js + Fastify
- Prisma ORM
- SQLite (WAL mode)
- JWT Authentication
- Bcrypt password hashing
- Zod validation

## Project Structure

```
pos-system/
├── backend/           # Fastify API server
│   ├── src/
│   │   ├── api/       # Route handlers
│   │   ├── middleware/# Auth middleware
│   │   ├── services/  # Business logic
│   │   ├── utils/     # Utilities
│   │   ├── validation/# Zod schemas
│   │   └── types/     # TypeScript types
│   └── prisma/        # Database schema and seed
├── frontend/          # React application
│   ├── src/
│   │   ├── components/# Reusable components
│   │   ├── lib/       # API client, utilities
│   │   ├── pages/     # Page components
│   │   ├── stores/    # Zustand stores
│   │   └── types/     # TypeScript types
│   └── public/        # Static assets
├── docker-compose.yml # Docker orchestration
└── .env.example       # Environment template
```

## Quick Start (Docker)

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)

### 1. Clone and Set Environment

```bash
git clone <repository-url>
cd pos-system

# Copy environment template
cp .env.example .env
# Edit .env with your settings
```

### 2. Start with Docker

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- Backend API server
- Frontend application

### 3. Access the Application

Open http://localhost:5173 in your browser

Default credentials (from seed):
- **Admin**: admin@example.com / password
- **Manager**: manager@example.com / password  
- **Cashier**: cashier@example.com / password

## Development Setup

### Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

The backend runs on http://localhost:3000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on http://localhost:5173

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | - |
| JWT_SECRET | Secret for JWT signing | - |
| APP_URL | Frontend URL | http://localhost:5173 |
| APP_PORT | Backend port | 3000 |
| PIN_LENGTH | PIN length for PIN login | 4 |
| SESSION_TIMEOUT | Session timeout in ms | 86400000 (24h) |
| DEFAULT_CURRENCY | Currency code | LKR |
| DEFAULT_TAX_RATE | Default tax percentage | 0 |
| DEFAULT_REORDER_LEVEL | Default reorder level | 10 |
| LOW_STOCK_ALERT_DAYS | Days to trigger low stock alert | 7 |
| BACKUP_ENABLED | Enable automatic backups | true |

## API Documentation

The backend provides REST API endpoints:

- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/login/pin` - Login with PIN
- `GET /api/auth/me` - Get current user
- `GET /api/products` - List products with search
- `GET /api/products/low-stock` - Low stock items
- `GET /api/invoices` - List invoices
- `GET /api/invoices/:id` - Get invoice details
- `POST /api/invoices` - Create invoice
- `POST /api/invoices/:id/pay` - Process payment
- `GET /api/reports/sales?period=today` - Sales report
- `GET /api/reports/inventory` - Inventory report

## Security

- Passwords hashed with bcrypt
- JWT tokens for API authentication
- Role-based access control
- Rate limiting available (configure in middleware)
- HTTPS recommended in production

## PWA Features

- Installable on mobile devices
- Offline support for checkout
- Local data sync when online
- Push notifications (configurable)

## Production Deployment

### Build

```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd ../backend
npm run build
```

### Docker Compose (Production)

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

See `docker-compose.prod.yml` for production-specific settings.

## Testing

```bash
# Backend tests
cd backend
npm run test

# Frontend tests
cd frontend
npm run test
```

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)