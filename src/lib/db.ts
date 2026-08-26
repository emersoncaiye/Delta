import fs from 'node:fs';
import path from 'node:path';

// ============================================================
// Lightweight JSON-file database for THAT Program
// Clean structure, easy to migrate to MySQL/PostgreSQL later
// ============================================================

const DB_DIR = path.join(process.env.COZE_WORKSPACE_PATH || '/workspace/projects', 'data');

function ensureDir(): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function readCollection<T extends { id: string }>(name: string): T[] {
  ensureDir();
  const filePath = path.join(DB_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T[];
}

function writeCollection<T extends { id: string }>(name: string, data: T[]): void {
  ensureDir();
  const filePath = path.join(DB_DIR, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

// ============================================================
// Type Definitions
// ============================================================

export interface InventoryItem {
  id: string;
  code: string;               // 物品编号 (e.g. "THAT-0001")
  name: string;
  description: string;
  photos: string[];           // 照片URL列表
  category: string;           // 分类
  originalPrice: number;      // 原始价格
  sellingPrice: number;       // 售价
  status: 'on_sale' | 'sold' | 'repair' | 'reserved';
  sourceOrigin: string;       // 来源坐标 (提交者信息)
  flowHistory: FlowRecord[];  // 流转履历
  submissionId?: string;      // 关联的闲置提交ID
  createdAt: string;
  updatedAt: string;
}

export interface FlowRecord {
  timestamp: string;
  action: string;             // 'listed' | 'sold' | 'returned' | 'resold'
  from?: string;
  to?: string;
  price?: number;
  note?: string;
}

export interface Order {
  id: string;
  orderNo: string;            // 订单编号
  itemId: string;             // 关联物品ID
  itemName: string;
  buyerName: string;
  buyerContact: string;
  amount: number;             // 订单金额
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'returned';
  returnValue?: ReturnValueDetail;  // 回流金详情
  createdAt: string;
  updatedAt: string;
}

export interface ReturnValueDetail {
  holdDays: number;
  holdTier: string;
  exchangeRate: number;       // 换购比例
  cashRate: number;           // 现金返还比例
  exchangeAmount: number;
  cashAmount: number;
  charityAmount: number;      // 公益金注入
}

export interface Submission {
  id: string;
  submitterName: string;
  submitterContact: string;
  itemName: string;
  description: string;
  photos: string[];
  expectedPrice: number;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote?: string;
  reviewedAt?: string;
  generatedItemId?: string;   // 审核通过后生成的库存ID
  createdAt: string;
  updatedAt: string;
}

export interface CharityRecord {
  id: string;
  orderId: string;
  orderNo: string;
  itemName: string;
  salePrice: number;
  charityAmount: number;      // 售价的10%
  quarter: string;            // 季度标识 (e.g. "2025-Q2")
  sourceUserId?: string;      // 公益金来源用户ID
  sourceItemCode?: string;    // 来源物品编号
  note?: string;              // 备注
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  deviceId?: string;          // 设备ID（用于无邮箱场景）
  createdAt: string;
  updatedAt: string;
}

export interface HoldRecord {
  id: string;
  userId: string;             // 持有者用户ID
  itemId: string;             // 物品ID
  orderId?: string;           // 关联订单ID
  purchasePrice: number;      // 购买价格
  purchaseDate: string;       // 购买日期
  returnDate?: string;        // 退回日期
  returnMode?: 'exchange' | 'cash';  // 退回方式
  returnAmount?: number;      // 回流金额
  returnRate?: number;        // 回流比例
  holdDays?: number;          // 持有天数
  holdTier?: string;          // 持有档位
  status: 'holding' | 'returned';
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Collection Accessors (CRUD)
// ============================================================

const COLLECTIONS = {
  items: 'items',
  orders: 'orders',
  submissions: 'submissions',
  charity: 'charity',
  counters: 'counters',
  users: 'users',
  hold_records: 'hold_records',
} as const;

// --- Items (Inventory) ---
export const ItemsDB = {
  findAll(filters?: { status?: string; category?: string }): InventoryItem[] {
    let items = readCollection<InventoryItem>(COLLECTIONS.items);
    if (filters?.status) items = items.filter(i => i.status === filters.status);
    if (filters?.category) items = items.filter(i => i.category === filters.category);
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  findById(id: string): InventoryItem | undefined {
    return readCollection<InventoryItem>(COLLECTIONS.items).find(i => i.id === id);
  },

  findByCode(code: string): InventoryItem | undefined {
    return readCollection<InventoryItem>(COLLECTIONS.items).find(i => i.code === code);
  },

  create(data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): InventoryItem {
    const items = readCollection<InventoryItem>(COLLECTIONS.items);
    const now = new Date().toISOString();
    const item: InventoryItem = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    items.push(item);
    writeCollection(COLLECTIONS.items, items);
    return item;
  },

  update(id: string, data: Partial<InventoryItem>): InventoryItem | undefined {
    const items = readCollection<InventoryItem>(COLLECTIONS.items);
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return undefined;
    items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
    writeCollection(COLLECTIONS.items, items);
    return items[idx];
  },

  delete(id: string): boolean {
    const items = readCollection<InventoryItem>(COLLECTIONS.items);
    const filtered = items.filter(i => i.id !== id);
    if (filtered.length === items.length) return false;
    writeCollection(COLLECTIONS.items, filtered);
    return true;
  },

  count(): number {
    return readCollection<InventoryItem>(COLLECTIONS.items).length;
  },
};

// --- Orders ---
export const OrdersDB = {
  findAll(filters?: { status?: string }): Order[] {
    let orders = readCollection<Order>(COLLECTIONS.orders);
    if (filters?.status) orders = orders.filter(o => o.status === filters.status);
    return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  findById(id: string): Order | undefined {
    return readCollection<Order>(COLLECTIONS.orders).find(o => o.id === id);
  },

  create(data: Omit<Order, 'id' | 'orderNo' | 'createdAt' | 'updatedAt'>): Order {
    const orders = readCollection<Order>(COLLECTIONS.orders);
    const now = new Date().toISOString();
    const counters = readCollection<{ id: string; orderSeq: number }>(COLLECTIONS.counters);
    let counter = counters.find(c => c.id === 'order');
    if (!counter) {
      counter = { id: 'order', orderSeq: 0 };
      counters.push(counter);
    }
    counter.orderSeq += 1;
    writeCollection(COLLECTIONS.counters, counters);

    const orderNo = `THAT-ORD-${String(counter.orderSeq).padStart(5, '0')}`;
    const order: Order = {
      ...data,
      id: generateId(),
      orderNo,
      createdAt: now,
      updatedAt: now,
    };
    orders.push(order);
    writeCollection(COLLECTIONS.orders, orders);
    return order;
  },

  update(id: string, data: Partial<Order>): Order | undefined {
    const orders = readCollection<Order>(COLLECTIONS.orders);
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) return undefined;
    orders[idx] = { ...orders[idx], ...data, updatedAt: new Date().toISOString() };
    writeCollection(COLLECTIONS.orders, orders);
    return orders[idx];
  },

  count(): number {
    return readCollection<Order>(COLLECTIONS.orders).length;
  },
};

// --- Submissions ---
export const SubmissionsDB = {
  findAll(filters?: { status?: string }): Submission[] {
    let subs = readCollection<Submission>(COLLECTIONS.submissions);
    if (filters?.status) subs = subs.filter(s => s.status === filters.status);
    return subs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  findById(id: string): Submission | undefined {
    return readCollection<Submission>(COLLECTIONS.submissions).find(s => s.id === id);
  },

  create(data: Omit<Submission, 'id' | 'createdAt' | 'updatedAt'>): Submission {
    const subs = readCollection<Submission>(COLLECTIONS.submissions);
    const now = new Date().toISOString();
    const sub: Submission = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    subs.push(sub);
    writeCollection(COLLECTIONS.submissions, subs);
    return sub;
  },

  update(id: string, data: Partial<Submission>): Submission | undefined {
    const subs = readCollection<Submission>(COLLECTIONS.submissions);
    const idx = subs.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    subs[idx] = { ...subs[idx], ...data, updatedAt: new Date().toISOString() };
    writeCollection(COLLECTIONS.submissions, subs);
    return subs[idx];
  },

  count(): number {
    return readCollection<Submission>(COLLECTIONS.submissions).length;
  },
};

// --- Charity Records ---
export const CharityDB = {
  findAll(filters?: { quarter?: string }): CharityRecord[] {
    let records = readCollection<CharityRecord>(COLLECTIONS.charity);
    if (filters?.quarter) records = records.filter(r => r.quarter === filters.quarter);
    return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  create(data: Omit<CharityRecord, 'id' | 'createdAt'>): CharityRecord {
    const records = readCollection<CharityRecord>(COLLECTIONS.charity);
    const record: CharityRecord = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    records.push(record);
    writeCollection(COLLECTIONS.charity, records);
    return record;
  },

  getTotal(): number {
    return readCollection<CharityRecord>(COLLECTIONS.charity)
      .reduce((sum, r) => sum + r.charityAmount, 0);
  },

  getByQuarter(): Record<string, { total: number; count: number; records: CharityRecord[] }> {
    const records = readCollection<CharityRecord>(COLLECTIONS.charity);
    const grouped: Record<string, { total: number; count: number; records: CharityRecord[] }> = {};
    for (const r of records) {
      if (!grouped[r.quarter]) {
        grouped[r.quarter] = { total: 0, count: 0, records: [] };
      }
      grouped[r.quarter].total += r.charityAmount;
      grouped[r.quarter].count += 1;
      grouped[r.quarter].records.push(r);
    }
    return grouped;
  },
};

// --- Users ---
export const UsersDB = {
  findAll(): User[] {
    return readCollection<User>(COLLECTIONS.users)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  findById(id: string): User | undefined {
    return readCollection<User>(COLLECTIONS.users).find(u => u.id === id);
  },

  findByEmail(email: string): User | undefined {
    return readCollection<User>(COLLECTIONS.users).find(u => u.email === email);
  },

  findByDeviceId(deviceId: string): User | undefined {
    return readCollection<User>(COLLECTIONS.users).find(u => u.deviceId === deviceId);
  },

  create(data: { email: string; name: string; deviceId?: string }): User {
    const users = readCollection<User>(COLLECTIONS.users);
    const now = new Date().toISOString();
    const user: User = {
      id: generateId(),
      email: data.email,
      name: data.name,
      deviceId: data.deviceId,
      createdAt: now,
      updatedAt: now,
    };
    users.push(user);
    writeCollection(COLLECTIONS.users, users);
    return user;
  },

  update(id: string, data: Partial<User>): User | undefined {
    const users = readCollection<User>(COLLECTIONS.users);
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    users[idx] = { ...users[idx], ...data, updatedAt: new Date().toISOString() };
    writeCollection(COLLECTIONS.users, users);
    return users[idx];
  },

  count(): number {
    return readCollection<User>(COLLECTIONS.users).length;
  },
};

// --- Hold Records ---
export const HoldRecordsDB = {
  findAll(filters?: { userId?: string; status?: string }): HoldRecord[] {
    let records = readCollection<HoldRecord>(COLLECTIONS.hold_records);
    if (filters?.userId) records = records.filter(r => r.userId === filters.userId);
    if (filters?.status) records = records.filter(r => r.status === filters.status);
    return records.sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate));
  },

  findById(id: string): HoldRecord | undefined {
    return readCollection<HoldRecord>(COLLECTIONS.hold_records).find(r => r.id === id);
  },

  create(data: {
    userId: string;
    itemId: string;
    orderId?: string;
    purchasePrice: number;
    purchaseDate: string;
  }): HoldRecord {
    const records = readCollection<HoldRecord>(COLLECTIONS.hold_records);
    const now = new Date().toISOString();
    const record: HoldRecord = {
      id: generateId(),
      userId: data.userId,
      itemId: data.itemId,
      orderId: data.orderId,
      purchasePrice: data.purchasePrice,
      purchaseDate: data.purchaseDate,
      status: 'holding',
      createdAt: now,
      updatedAt: now,
    };
    records.push(record);
    writeCollection(COLLECTIONS.hold_records, records);
    return record;
  },

  update(id: string, data: Partial<HoldRecord>): HoldRecord | undefined {
    const records = readCollection<HoldRecord>(COLLECTIONS.hold_records);
    const idx = records.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    records[idx] = { ...records[idx], ...data, updatedAt: new Date().toISOString() };
    writeCollection(COLLECTIONS.hold_records, records);
    return records[idx];
  },

  count(): number {
    return readCollection<HoldRecord>(COLLECTIONS.hold_records).length;
  },
};

// --- Item Code Generator ---
export function generateItemCode(): string {
  const items = readCollection<InventoryItem>(COLLECTIONS.items);
  const seq = items.length + 1;
  return `THAT-${String(seq).padStart(4, '0')}`;
}

// --- Seed Data ---
export function seedData(): void {
  const items = readCollection<InventoryItem>(COLLECTIONS.items);
  if (items.length > 0) return; // Already seeded

  const now = new Date();
  const sampleItems: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      code: 'THAT-0001',
      name: 'Herman Miller Aeron 人体工学椅',
      description: '经典款A椅，B size，全功能版，使用约1年，状态良好',
      photos: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400'],
      category: '家具',
      originalPrice: 12800,
      sellingPrice: 7680,
      status: 'on_sale',
      sourceOrigin: '上海-静安',
      flowHistory: [
        { timestamp: now.toISOString(), action: 'listed', note: '从用户提交审核通过，上架代售' }
      ],
    },
    {
      code: 'THAT-0002',
      name: 'Leica Q2 数码相机',
      description: '银色限量版，快门数约3000，含原装皮套',
      photos: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400'],
      category: '数码',
      originalPrice: 38000,
      sellingPrice: 26600,
      status: 'on_sale',
      sourceOrigin: '北京-朝阳',
      flowHistory: [
        { timestamp: now.toISOString(), action: 'listed', note: '用户持有3个月后提交流转' }
      ],
    },
    {
      code: 'THAT-0003',
      name: 'B&O Beoplay A9 音箱',
      description: '第四代，胡桃木色，功能完好，外观轻微使用痕迹',
      photos: ['https://images.unsplash.com/photo-1545454675-35d1c71f3b85?w=400'],
      category: '音频',
      originalPrice: 21900,
      sellingPrice: 13140,
      status: 'reserved',
      sourceOrigin: '深圳-南山',
      flowHistory: [
        { timestamp: now.toISOString(), action: 'listed', note: '上架代售' },
        { timestamp: now.toISOString(), action: 'reserved', note: '买家预定，等待付款' }
      ],
    },
    {
      code: 'THAT-0004',
      name: 'Mid-century 胡桃木书桌',
      description: '丹麦进口胡桃木，140x70cm，有轻微岁月痕迹',
      photos: ['https://images.unsplash.com/photo-1518455027359-3f15356565d8?w=400'],
      category: '家具',
      originalPrice: 8500,
      sellingPrice: 5100,
      status: 'sold',
      sourceOrigin: '杭州-西湖',
      flowHistory: [
        { timestamp: now.toISOString(), action: 'listed', note: '上架代售' },
        { timestamp: now.toISOString(), action: 'sold', price: 5100, note: '已售出' }
      ],
    },
    {
      code: 'THAT-0005',
      name: 'Arc\'teryx Alpha SV 冲锋衣',
      description: '黑色 M码，Gore-Tex Pro，穿过两次户外',
      photos: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400'],
      category: '服饰',
      originalPrice: 6800,
      sellingPrice: 4080,
      status: 'repair',
      sourceOrigin: '成都-锦江',
      flowHistory: [
        { timestamp: now.toISOString(), action: 'listed', note: '上架代售' },
        { timestamp: now.toISOString(), action: 'repair', note: '拉链需修复，送修中' }
      ],
    },
  ];

  for (const item of sampleItems) {
    ItemsDB.create(item);
  }

  // Sample submissions
  const sampleSubmissions: Omit<Submission, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      submitterName: '林小雅',
      submitterContact: 'lin@example.com',
      itemName: 'Muuto Restore 收纳套装',
      description: '全新未拆封，毛毡材质，灰色套装',
      photos: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400'],
      expectedPrice: 1200,
      category: '家居',
      status: 'pending',
    },
    {
      submitterName: '张明远',
      submitterContact: 'zhang@example.com',
      itemName: 'Sony WH-1000XM5 耳机',
      description: '使用半年，银色，含原装收纳盒',
      photos: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
      expectedPrice: 1800,
      category: '数码',
      status: 'approved',
      reviewNote: '品质良好，通过审核',
      reviewedAt: now.toISOString(),
      generatedItemId: 'pending',
    },
  ];

  for (const sub of sampleSubmissions) {
    SubmissionsDB.create(sub);
  }

  // Sample orders
  const sampleOrders: Omit<Order, 'id' | 'orderNo' | 'createdAt' | 'updatedAt'>[] = [
    {
      itemId: 'item-4',
      itemName: 'Mid-century 胡桃木书桌',
      buyerName: '王设计',
      buyerContact: 'wang@example.com',
      amount: 5100,
      status: 'completed',
    },
  ];

  for (const order of sampleOrders) {
    OrdersDB.create(order);
  }

  // Sample users
  const sampleUsers = [
    { email: 'lin@example.com', name: '林小雅', deviceId: 'device-lin-001' },
    { email: 'wang@example.com', name: '王设计', deviceId: 'device-wang-001' },
    { email: 'zhang@example.com', name: '张明远', deviceId: 'device-zhang-001' },
  ];
  for (const u of sampleUsers) {
    UsersDB.create(u);
  }
}

// ============================================================
// Unified DB export for API routes
// ============================================================
export const db = {
  // Items
  getItems: () => ItemsDB.findAll(),
  getItem: (id: string) => ItemsDB.findById(id),
  createItem: (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => ItemsDB.create(data),
  updateItem: (id: string, data: Partial<InventoryItem>) => ItemsDB.update(id, data),
  deleteItem: (id: string) => ItemsDB.delete(id),

  // Orders
  getOrders: () => OrdersDB.findAll(),
  getOrder: (id: string) => OrdersDB.findById(id),
  createOrder: (data: Omit<Order, 'id' | 'orderNo' | 'createdAt' | 'updatedAt'>) => OrdersDB.create(data),
  updateOrder: (id: string, data: Partial<Order>) => OrdersDB.update(id, data),

  // Submissions
  getSubmissions: () => SubmissionsDB.findAll(),
  getSubmission: (id: string) => SubmissionsDB.findById(id),
  createSubmission: (data: Omit<Submission, 'id' | 'createdAt' | 'updatedAt'>) => SubmissionsDB.create(data),
  updateSubmission: (id: string, data: Partial<Submission>) => SubmissionsDB.update(id, data),

  // Charity
  getCharityRecords: () => CharityDB.findAll(),
  getCharityTotal: () => CharityDB.getTotal(),
  getCharityByQuarter: () => CharityDB.getByQuarter(),
  createCharityRecord: (data: Omit<CharityRecord, 'id' | 'createdAt'>) => CharityDB.create(data),

  // Users
  getUsers: () => UsersDB.findAll(),
  getUser: (id: string) => UsersDB.findById(id),
  createUser: (data: { email: string; name: string; deviceId?: string }) => UsersDB.create(data),
  updateUser: (id: string, data: Partial<User>) => UsersDB.update(id, data),

  // Hold Records
  getHoldRecords: () => HoldRecordsDB.findAll(),
  getHoldRecord: (id: string) => HoldRecordsDB.findById(id),
  createHoldRecord: (data: { userId: string; itemId: string; orderId?: string; purchasePrice: number; purchaseDate: string }) => HoldRecordsDB.create(data),
  updateHoldRecord: (id: string, data: Partial<HoldRecord>) => HoldRecordsDB.update(id, data),

  // Utilities
  generateItemCode,
  seedData,
};
