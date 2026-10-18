-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PaymentTerms" AS ENUM ('CASH', 'CREDIT_15', 'CREDIT_30', 'CREDIT_60', 'PREPAID_50');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('SUPPLY', 'TIRE', 'SERVICE');

-- CreateEnum
CREATE TYPE "Prefix" AS ENUM ('P', 'LT', 'ST', 'T');

-- CreateEnum
CREATE TYPE "Construction" AS ENUM ('R', 'D', 'B');

-- CreateEnum
CREATE TYPE "LoadRange" AS ENUM ('C', 'XL');

-- CreateEnum
CREATE TYPE "TireCondition" AS ENUM ('NEW', 'USED', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "TireQuality" AS ENUM ('A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('ENTRY', 'EXIT', 'ADJUSTMENT', 'SALE_REVERSAL', 'TRANSFER_ENTRY', 'TRANSFER_EXIT');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'COMPLETED', 'REJECTED', 'ANNULLED', 'CONTINGENCY');

-- CreateEnum
CREATE TYPE "SaleType" AS ENUM ('INVOICE', 'TAX_CREDIT');

-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('TAXABLE', 'EXEMPT', 'NON_TAXABLE');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('NATURAL', 'LEGAL');

-- CreateEnum
CREATE TYPE "SaleRequestStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SELLER', 'VIEWER', 'ACCOUNTANT');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttemptLock" (
    "id" SERIAL NOT NULL,
    "ipAddress" VARCHAR(45) NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockLevel" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "permanentlyLocked" BOOLEAN NOT NULL DEFAULT false,
    "lastFailedAt" TIMESTAMP(3),
    "unlockedAt" TIMESTAMP(3),
    "unlockedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginAttemptLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshTokens" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "userAgent" TEXT NOT NULL,
    "deviceType" VARCHAR(50) NOT NULL,
    "ipAddress" VARCHAR(45) NOT NULL,
    "country" VARCHAR(100),
    "city" VARCHAR(100),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefreshTokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "nrc" VARCHAR(30),
    "nit" VARCHAR(30),
    "phone" VARCHAR(30),
    "email" VARCHAR(254),
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "type" "ProductType" NOT NULL,
    "purchasePrice" DECIMAL(14,4),
    "salePrice" DECIMAL(18,8),
    "taxType" "TaxType" NOT NULL DEFAULT 'TAXABLE',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "averageCost" DECIMAL(14,2),
    "notes" TEXT,
    "brandId" INTEGER,
    "providerId" INTEGER,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "itemTypeCatalogId" INTEGER NOT NULL,
    "unitOfMeasureCatalogId" INTEGER NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tire" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "prefix" "Prefix",
    "width" INTEGER NOT NULL,
    "aspectRatio" INTEGER,
    "construction" "Construction" NOT NULL DEFAULT 'R',
    "rimDiameter" DECIMAL(4,1) NOT NULL,
    "loadIndexFront" INTEGER,
    "loadIndexRear" INTEGER,
    "speedRating" CHAR(1),
    "loadRange" "LoadRange",
    "plies" INTEGER,
    "condition" "TireCondition",
    "quality" "TireQuality" NOT NULL DEFAULT 'D',
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Tire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVehicleType" (
    "productId" INTEGER NOT NULL,
    "vehicleTypeId" INTEGER NOT NULL,

    CONSTRAINT "ProductVehicleType_pkey" PRIMARY KEY ("productId","vehicleTypeId")
);

-- CreateTable
CREATE TABLE "VehicleType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(30) NOT NULL,
    "deleteAt" TIMESTAMP(3),

    CONSTRAINT "VehicleType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" SERIAL NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductZoneStock" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "zoneId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductZoneStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "type" "MovementType" NOT NULL,
    "note" TEXT,
    "warehouseId" INTEGER,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unitCost" DECIMAL(14,4) NOT NULL,
    "totalCost" DECIMAL(14,2) NOT NULL,
    "balanceQuantity" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "balanceValue" DECIMAL(14,2) NOT NULL,
    "averageCost" DECIMAL(14,2) NOT NULL,
    "purchaseOrderId" INTEGER,
    "saleOrderId" INTEGER,
    "saleReturnId" INTEGER,
    "purchaseReturnId" INTEGER,
    "zoneId" INTEGER,
    "zoneBalanceQuantity" INTEGER,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleOrder" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER,
    "requestId" TEXT,
    "documentNumber" TEXT NOT NULL,
    "SaleType" "SaleType" NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentTypeCode" TEXT NOT NULL,
    "documentTypeId" INTEGER,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "iva" DECIMAL(14,2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,
    "globalDiscount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "externalInvoiceId" TEXT,
    "isLegacy" BOOLEAN NOT NULL DEFAULT false,
    "customerName" TEXT,
    "customerDocumentType" TEXT,
    "customerDocumentNumber" TEXT,
    "customerNrc" TEXT,
    "customerAddress" TEXT,
    "customerDistrict" TEXT,
    "canceledById" INTEGER,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "quotationId" INTEGER,
    "rejectedFromId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "canceledAt" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "SaleOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleOrderDetail" (
    "id" SERIAL NOT NULL,
    "saleOrderId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "taxType" "TaxType" NOT NULL DEFAULT 'TAXABLE',
    "subtotal" DECIMAL(18,8) NOT NULL,
    "discountAmount" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "amountAfterDiscount" DECIMAL(18,8) NOT NULL,
    "unitPrice" DECIMAL(18,8) NOT NULL,
    "netDiscount" DECIMAL(18,8) NOT NULL,
    "taxAmount" DECIMAL(18,8) NOT NULL,
    "taxableAmount" DECIMAL(18,8) NOT NULL,
    "unitPriceNet" DECIMAL(18,8) NOT NULL,
    "itemTypeCatalogId" INTEGER NOT NULL,
    "unitOfMeasureCatalogId" INTEGER NOT NULL,
    "zoneId" INTEGER NOT NULL,

    CONSTRAINT "SaleOrderDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "destinationWarehouseId" INTEGER,
    "requestId" TEXT,
    "sourceIdentity" TEXT,
    "id" SERIAL NOT NULL,
    "documentNumber" SERIAL NOT NULL,
    "providerId" INTEGER NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "canceledById" INTEGER,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "canceledAt" TIMESTAMP(3),

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderDetail" (
    "id" SERIAL NOT NULL,
    "purchaseOrderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(14,4) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "suggestedZoneId" INTEGER,

    CONSTRAINT "PurchaseOrderDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleReturn" (
    "id" SERIAL NOT NULL,
    "saleOrderId" INTEGER NOT NULL,
    "reason" TEXT,
    "total" DECIMAL(14,2) NOT NULL,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleReturnDetail" (
    "id" SERIAL NOT NULL,
    "saleReturnId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(14,4) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "SaleReturnDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseReturn" (
    "id" SERIAL NOT NULL,
    "purchaseOrderId" INTEGER NOT NULL,
    "reason" TEXT,
    "total" DECIMAL(14,2) NOT NULL,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseReturnDetail" (
    "id" SERIAL NOT NULL,
    "purchaseReturnId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(14,4) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "PurchaseReturnDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isTaxPayer" BOOLEAN NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "customerType" "CustomerType" NOT NULL,
    "districtId" INTEGER,
    "address" TEXT,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectronicInvoiceTaxDocumentTypeCatalog" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL,

    CONSTRAINT "ElectronicInvoiceTaxDocumentTypeCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectronicInvoiceEconomicActivityCatalog" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "isLegacy" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ElectronicInvoiceEconomicActivityCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerTaxInfo" (
    "id" SERIAL NOT NULL,
    "tradeName" TEXT,
    "customerId" INTEGER NOT NULL,
    "taxDocumentTypeId" INTEGER NOT NULL,
    "taxDocumentNumber" TEXT NOT NULL,
    "nrc" TEXT,
    "economicActivityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerTaxInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" SERIAL NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "nit" TEXT NOT NULL,
    "nrc" TEXT,
    "registryNo" TEXT,
    "address" TEXT NOT NULL,
    "districtId" INTEGER NOT NULL,
    "EstablishmentMHCode" TEXT NOT NULL,
    "salePointMHCode" TEXT NOT NULL,
    "establishmentTypeCatalogId" INTEGER,
    "economicActivityId" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "isContingency" BOOLEAN NOT NULL DEFAULT false,
    "responsableName" VARCHAR(150),
    "responsableDocTypeId" INTEGER,
    "responsableDocNumber" VARCHAR(25),
    "ivaRate" DECIMAL(5,4) NOT NULL DEFAULT 0.13,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "externalCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Municipality" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "externalCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Municipality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agentCode" TEXT,
    "municipalityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectronicInvoiceDocumentTypeCatalog" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(2) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectronicInvoiceDocumentTypeCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectronicInvoiceBillingModelCatalog" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(2) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectronicInvoiceBillingModelCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectronicInvoiceTransmissionTypeCatalog" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(2) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectronicInvoiceTransmissionTypeCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectronicInvoiceContingencyTypeCatalog" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(2) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectronicInvoiceContingencyTypeCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectronicInvoiceEstablishmentTypeCatalog" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(2) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectronicInvoiceEstablishmentTypeCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectronicInvoiceItemTypeCatalog" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(2) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isLegacy" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectronicInvoiceItemTypeCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectronicInvoiceUnitOfMeasureCatalog" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isLegacy" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectronicInvoiceUnitOfMeasureCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectronicInvoiceTributeCatalog" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(4) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectronicInvoiceTributeCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectronicInvoiceOperationConditionCatalog" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(2) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectronicInvoiceOperationConditionCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectronicInvoicePaymentMethodCatalog" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(2) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isLegacy" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectronicInvoicePaymentMethodCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectronicInvoicePaymentTermCatalog" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(2) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isLegacy" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectronicInvoicePaymentTermCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectronicInvoiceOtherAssociatedDocumentCatalog" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(2) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectronicInvoiceOtherAssociatedDocumentCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectronicInvoiceContingencyDocumentTypeCatalog" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(2) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectronicInvoiceContingencyDocumentTypeCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectronicInvoiceInvalidationTypeCatalog" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(2) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectronicInvoiceInvalidationTypeCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleOrderRequest" (
    "id" SERIAL NOT NULL,
    "requestId" VARCHAR(36) NOT NULL,
    "saleOrderId" INTEGER NOT NULL,
    "status" "SaleRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleOrderRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" SERIAL NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "customerId" INTEGER,
    "saleType" "SaleType",
    "subtotal" DECIMAL(14,2) NOT NULL,
    "iva" DECIMAL(14,2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,
    "globalDiscount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "customerName" TEXT,
    "customerAddress" TEXT,
    "notes" TEXT,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationDetail" (
    "id" SERIAL NOT NULL,
    "quotationId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "taxType" "TaxType" NOT NULL DEFAULT 'TAXABLE',
    "unitPrice" DECIMAL(18,8) NOT NULL,
    "subtotal" DECIMAL(18,8) NOT NULL,
    "discountAmount" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "amountAfterDiscount" DECIMAL(18,8) NOT NULL,
    "taxAmount" DECIMAL(18,8) NOT NULL,
    "taxableAmount" DECIMAL(18,8) NOT NULL,
    "unitPriceNet" DECIMAL(18,8) NOT NULL,
    "netDiscount" DECIMAL(18,8) NOT NULL,

    CONSTRAINT "QuotationDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationSequence" (
    "id" SERIAL NOT NULL,
    "currentNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuotationSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" SERIAL NOT NULL,
    "fromZoneId" INTEGER NOT NULL,
    "toZoneId" INTEGER NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferDetail" (
    "id" SERIAL NOT NULL,
    "transferId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "TransferDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "ip" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleOrderPayment" (
    "id" SERIAL NOT NULL,
    "saleOrderId" INTEGER NOT NULL,
    "paymentMethodCatalogId" INTEGER NOT NULL,
    "paymentTermCatalogId" INTEGER,
    "paymentReference" VARCHAR(100),
    "termValue" INTEGER,
    "amount" DECIMAL(14,2) NOT NULL,
    "rawAmount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleOrderPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleOrderDocument" (
    "id" SERIAL NOT NULL,
    "saleOrderId" INTEGER NOT NULL,
    "pdfKey" TEXT,
    "jsonKey" TEXT NOT NULL,
    "pdfFilename" TEXT,
    "jsonFilename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleOrderDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderDocument" (
    "id" SERIAL NOT NULL,
    "purchaseOrderId" INTEGER NOT NULL,
    "pdfKey" TEXT,
    "jsonKey" TEXT,
    "pdfFilename" TEXT,
    "jsonFilename" TEXT,
    "source" TEXT NOT NULL,
    "sourceSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrderDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderAttempt" (
    "requestId" TEXT NOT NULL,
    "actorId" INTEGER NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "pdfKey" TEXT,
    "jsonKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "purchaseOrderId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrderAttempt_pkey" PRIMARY KEY ("requestId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LoginAttemptLock_ipAddress_key" ON "LoginAttemptLock"("ipAddress");

-- CreateIndex
CREATE INDEX "LoginAttemptLock_lockedUntil_idx" ON "LoginAttemptLock"("lockedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshTokens_id_key" ON "RefreshTokens"("id");

-- CreateIndex
CREATE INDEX "RefreshTokens_userId_idx" ON "RefreshTokens"("userId");

-- CreateIndex
CREATE INDEX "RefreshTokens_tokenHash_idx" ON "RefreshTokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_nrc_key" ON "Provider"("nrc");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_nit_key" ON "Provider"("nit");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Tire_productId_key" ON "Tire"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_warehouseId_name_key" ON "Zone"("warehouseId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductZoneStock_productId_zoneId_key" ON "ProductZoneStock"("productId", "zoneId");

-- CreateIndex
CREATE INDEX "InventoryMovement_productId_createdAt_idx" ON "InventoryMovement"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_purchaseOrderId_idx" ON "InventoryMovement"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "InventoryMovement_saleOrderId_idx" ON "InventoryMovement"("saleOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "SaleOrder_requestId_key" ON "SaleOrder"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "SaleOrder_documentNumber_key" ON "SaleOrder"("documentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SaleOrder_externalInvoiceId_key" ON "SaleOrder"("externalInvoiceId");

-- CreateIndex
CREATE INDEX "SaleOrder_customerId_status_createdAt_idx" ON "SaleOrder"("customerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SaleOrderDetail_saleOrderId_idx" ON "SaleOrderDetail"("saleOrderId");

-- CreateIndex
CREATE INDEX "SaleOrderDetail_zoneId_idx" ON "SaleOrderDetail"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_requestId_key" ON "PurchaseOrder"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_sourceIdentity_key" ON "PurchaseOrder"("sourceIdentity");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_documentNumber_key" ON "PurchaseOrder"("documentNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_providerId_status_createdAt_idx" ON "PurchaseOrder"("providerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PurchaseOrderDetail_purchaseOrderId_idx" ON "PurchaseOrderDetail"("purchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_name_key" ON "Customer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicInvoiceTaxDocumentTypeCatalog_code_key" ON "ElectronicInvoiceTaxDocumentTypeCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicInvoiceEconomicActivityCatalog_code_key" ON "ElectronicInvoiceEconomicActivityCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTaxInfo_customerId_key" ON "CustomerTaxInfo"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTaxInfo_taxDocumentNumber_key" ON "CustomerTaxInfo"("taxDocumentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTaxInfo_taxDocumentTypeId_taxDocumentNumber_key" ON "CustomerTaxInfo"("taxDocumentTypeId", "taxDocumentNumber");

-- CreateIndex
CREATE INDEX "CompanySettings_establishmentTypeCatalogId_idx" ON "CompanySettings"("establishmentTypeCatalogId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Department_externalCode_key" ON "Department"("externalCode");

-- CreateIndex
CREATE UNIQUE INDEX "Municipality_code_key" ON "Municipality"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Municipality_departmentId_externalCode_key" ON "Municipality"("departmentId", "externalCode");

-- CreateIndex
CREATE UNIQUE INDEX "District_code_key" ON "District"("code");

-- CreateIndex
CREATE INDEX "District_municipalityId_idx" ON "District"("municipalityId");

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicInvoiceDocumentTypeCatalog_code_key" ON "ElectronicInvoiceDocumentTypeCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicInvoiceBillingModelCatalog_code_key" ON "ElectronicInvoiceBillingModelCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicInvoiceTransmissionTypeCatalog_code_key" ON "ElectronicInvoiceTransmissionTypeCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicInvoiceContingencyTypeCatalog_code_key" ON "ElectronicInvoiceContingencyTypeCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicInvoiceEstablishmentTypeCatalog_code_key" ON "ElectronicInvoiceEstablishmentTypeCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicInvoiceItemTypeCatalog_code_key" ON "ElectronicInvoiceItemTypeCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicInvoiceUnitOfMeasureCatalog_code_key" ON "ElectronicInvoiceUnitOfMeasureCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicInvoiceTributeCatalog_code_key" ON "ElectronicInvoiceTributeCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicInvoiceOperationConditionCatalog_code_key" ON "ElectronicInvoiceOperationConditionCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicInvoicePaymentMethodCatalog_code_key" ON "ElectronicInvoicePaymentMethodCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicInvoicePaymentTermCatalog_code_key" ON "ElectronicInvoicePaymentTermCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicInvoiceOtherAssociatedDocumentCatalog_code_key" ON "ElectronicInvoiceOtherAssociatedDocumentCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicInvoiceContingencyDocumentTypeCatalog_code_key" ON "ElectronicInvoiceContingencyDocumentTypeCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicInvoiceInvalidationTypeCatalog_code_key" ON "ElectronicInvoiceInvalidationTypeCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SaleOrderRequest_requestId_key" ON "SaleOrderRequest"("requestId");

-- CreateIndex
CREATE INDEX "SaleOrderRequest_saleOrderId_createdAt_idx" ON "SaleOrderRequest"("saleOrderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_documentNumber_key" ON "Quotation"("documentNumber");

-- CreateIndex
CREATE INDEX "Quotation_customerId_createdAt_idx" ON "Quotation"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "QuotationDetail_quotationId_idx" ON "QuotationDetail"("quotationId");

-- CreateIndex
CREATE INDEX "Transfer_fromZoneId_idx" ON "Transfer"("fromZoneId");

-- CreateIndex
CREATE INDEX "Transfer_toZoneId_idx" ON "Transfer"("toZoneId");

-- CreateIndex
CREATE INDEX "Transfer_status_createdAt_idx" ON "Transfer"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TransferDetail_transferId_idx" ON "TransferDetail"("transferId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_at_idx" ON "AuditLog"("entityType", "entityId", "at");

-- CreateIndex
CREATE INDEX "AuditLog_userId_at_idx" ON "AuditLog"("userId", "at");

-- CreateIndex
CREATE INDEX "AuditLog_action_at_idx" ON "AuditLog"("action", "at");

-- CreateIndex
CREATE INDEX "SaleOrderPayment_saleOrderId_idx" ON "SaleOrderPayment"("saleOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "SaleOrderDocument_saleOrderId_key" ON "SaleOrderDocument"("saleOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrderDocument_purchaseOrderId_key" ON "PurchaseOrderDocument"("purchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrderAttempt_purchaseOrderId_key" ON "PurchaseOrderAttempt"("purchaseOrderId");

-- AddForeignKey
ALTER TABLE "LoginAttemptLock" ADD CONSTRAINT "LoginAttemptLock_unlockedBy_fkey" FOREIGN KEY ("unlockedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshTokens" ADD CONSTRAINT "RefreshTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_itemTypeCatalogId_fkey" FOREIGN KEY ("itemTypeCatalogId") REFERENCES "ElectronicInvoiceItemTypeCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_unitOfMeasureCatalogId_fkey" FOREIGN KEY ("unitOfMeasureCatalogId") REFERENCES "ElectronicInvoiceUnitOfMeasureCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tire" ADD CONSTRAINT "Tire_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tire" ADD CONSTRAINT "Tire_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tire" ADD CONSTRAINT "Tire_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVehicleType" ADD CONSTRAINT "ProductVehicleType_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVehicleType" ADD CONSTRAINT "ProductVehicleType_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "VehicleType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductZoneStock" ADD CONSTRAINT "ProductZoneStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductZoneStock" ADD CONSTRAINT "ProductZoneStock_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SaleOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_saleReturnId_fkey" FOREIGN KEY ("saleReturnId") REFERENCES "SaleReturn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_purchaseReturnId_fkey" FOREIGN KEY ("purchaseReturnId") REFERENCES "PurchaseReturn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrder" ADD CONSTRAINT "SaleOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrder" ADD CONSTRAINT "SaleOrder_canceledById_fkey" FOREIGN KEY ("canceledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrder" ADD CONSTRAINT "SaleOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrder" ADD CONSTRAINT "SaleOrder_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrder" ADD CONSTRAINT "SaleOrder_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrder" ADD CONSTRAINT "SaleOrder_rejectedFromId_fkey" FOREIGN KEY ("rejectedFromId") REFERENCES "SaleOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrder" ADD CONSTRAINT "SaleOrder_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "ElectronicInvoiceDocumentTypeCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrderDetail" ADD CONSTRAINT "SaleOrderDetail_itemTypeCatalogId_fkey" FOREIGN KEY ("itemTypeCatalogId") REFERENCES "ElectronicInvoiceItemTypeCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrderDetail" ADD CONSTRAINT "SaleOrderDetail_unitOfMeasureCatalogId_fkey" FOREIGN KEY ("unitOfMeasureCatalogId") REFERENCES "ElectronicInvoiceUnitOfMeasureCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrderDetail" ADD CONSTRAINT "SaleOrderDetail_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrderDetail" ADD CONSTRAINT "SaleOrderDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrderDetail" ADD CONSTRAINT "SaleOrderDetail_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SaleOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_destinationWarehouseId_fkey" FOREIGN KEY ("destinationWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_canceledById_fkey" FOREIGN KEY ("canceledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderDetail" ADD CONSTRAINT "PurchaseOrderDetail_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderDetail" ADD CONSTRAINT "PurchaseOrderDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderDetail" ADD CONSTRAINT "PurchaseOrderDetail_suggestedZoneId_fkey" FOREIGN KEY ("suggestedZoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleReturn" ADD CONSTRAINT "SaleReturn_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleReturn" ADD CONSTRAINT "SaleReturn_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SaleOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleReturnDetail" ADD CONSTRAINT "SaleReturnDetail_saleReturnId_fkey" FOREIGN KEY ("saleReturnId") REFERENCES "SaleReturn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleReturnDetail" ADD CONSTRAINT "SaleReturnDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturnDetail" ADD CONSTRAINT "PurchaseReturnDetail_purchaseReturnId_fkey" FOREIGN KEY ("purchaseReturnId") REFERENCES "PurchaseReturn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturnDetail" ADD CONSTRAINT "PurchaseReturnDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTaxInfo" ADD CONSTRAINT "CustomerTaxInfo_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTaxInfo" ADD CONSTRAINT "CustomerTaxInfo_taxDocumentTypeId_fkey" FOREIGN KEY ("taxDocumentTypeId") REFERENCES "ElectronicInvoiceTaxDocumentTypeCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTaxInfo" ADD CONSTRAINT "CustomerTaxInfo_economicActivityId_fkey" FOREIGN KEY ("economicActivityId") REFERENCES "ElectronicInvoiceEconomicActivityCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySettings" ADD CONSTRAINT "CompanySettings_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySettings" ADD CONSTRAINT "CompanySettings_establishmentTypeCatalogId_fkey" FOREIGN KEY ("establishmentTypeCatalogId") REFERENCES "ElectronicInvoiceEstablishmentTypeCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySettings" ADD CONSTRAINT "CompanySettings_economicActivityId_fkey" FOREIGN KEY ("economicActivityId") REFERENCES "ElectronicInvoiceEconomicActivityCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySettings" ADD CONSTRAINT "CompanySettings_responsableDocTypeId_fkey" FOREIGN KEY ("responsableDocTypeId") REFERENCES "ElectronicInvoiceTaxDocumentTypeCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Municipality" ADD CONSTRAINT "Municipality_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrderRequest" ADD CONSTRAINT "SaleOrderRequest_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SaleOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationDetail" ADD CONSTRAINT "QuotationDetail_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationDetail" ADD CONSTRAINT "QuotationDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_fromZoneId_fkey" FOREIGN KEY ("fromZoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_toZoneId_fkey" FOREIGN KEY ("toZoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferDetail" ADD CONSTRAINT "TransferDetail_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferDetail" ADD CONSTRAINT "TransferDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrderPayment" ADD CONSTRAINT "SaleOrderPayment_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SaleOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrderPayment" ADD CONSTRAINT "SaleOrderPayment_paymentMethodCatalogId_fkey" FOREIGN KEY ("paymentMethodCatalogId") REFERENCES "ElectronicInvoicePaymentMethodCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrderPayment" ADD CONSTRAINT "SaleOrderPayment_paymentTermCatalogId_fkey" FOREIGN KEY ("paymentTermCatalogId") REFERENCES "ElectronicInvoicePaymentTermCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrderDocument" ADD CONSTRAINT "SaleOrderDocument_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SaleOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderDocument" ADD CONSTRAINT "PurchaseOrderDocument_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderAttempt" ADD CONSTRAINT "PurchaseOrderAttempt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
