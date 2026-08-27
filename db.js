import fs from 'node:fs';
import path from 'node:path';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'termux-db.json');

const initialState = {
  reminders: [],
  reminder_notifications: [],
  edlink_notifications: [],
  notes: [],
  scheduled_messages: [],
  uploads: [],
  leaderboard: [],
};

let state = loadState();

function loadState() {
  fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    saveState(initialState);
    return structuredClone(initialState);
  }

  try {
    const loaded = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return { ...structuredClone(initialState), ...loaded };
  } catch (error) {
    const backup = `${DB_FILE}.broken-${Date.now()}`;
    fs.copyFileSync(DB_FILE, backup);
    console.error(`Database JSON rusak. Backup dibuat: ${backup}`);
    saveState(initialState);
    return structuredClone(initialState);
  }
}

function saveState(nextState = state) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, `${JSON.stringify(nextState, null, 2)}\n`);
}

function ensureTable(name) {
  if (!Array.isArray(state[name])) {
    state[name] = [];
    saveState();
  }
  return state[name];
}

function nextId(rows) {
  return rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;
}

function normalizeComparable(value) {
  if (value == null) return '';
  return String(value);
}

function matches(row, condition) {
  const actual = row[condition.column];
  const expected = condition.value;

  switch (condition.operator) {
    case '=':
    case '==':
    case '===':
      return normalizeComparable(actual) === normalizeComparable(expected);
    case '<=':
      return normalizeComparable(actual) <= normalizeComparable(expected);
    case '<':
      return normalizeComparable(actual) < normalizeComparable(expected);
    case '>=':
      return normalizeComparable(actual) >= normalizeComparable(expected);
    case '>':
      return normalizeComparable(actual) > normalizeComparable(expected);
    case '!=':
    case '<>':
      return normalizeComparable(actual) !== normalizeComparable(expected);
    default:
      return normalizeComparable(actual) === normalizeComparable(expected);
  }
}

function project(row, columns) {
  if (!columns.length || columns.includes('*')) return { ...row };
  return Object.fromEntries(columns.map((column) => [column, row[column]]));
}

class QueryBuilder {
  constructor(tableName = null, selectedColumns = []) {
    this.tableName = tableName;
    this.selectedColumns = selectedColumns;
    this.conditions = [];
    this.order = null;
    this.maxRows = null;
  }

  from(tableName) {
    this.tableName = tableName;
    return this;
  }

  select(...columns) {
    this.selectedColumns = columns.flat();
    return this;
  }

  where(column, operator, value) {
    if (typeof column === 'object' && column !== null) {
      for (const [key, itemValue] of Object.entries(column)) {
        this.conditions.push({ column: key, operator: '=', value: itemValue });
      }
      return this;
    }

    if (arguments.length === 2) {
      this.conditions.push({ column, operator: '=', value: operator });
      return this;
    }

    this.conditions.push({ column, operator, value });
    return this;
  }

  andWhere(...args) {
    return this.where(...args);
  }

  orderBy(column, direction = 'asc') {
    this.order = { column, direction: String(direction).toLowerCase() };
    return this;
  }

  limit(count) {
    this.maxRows = Number(count);
    return this;
  }

  rows() {
    if (!this.tableName) throw new Error('Nama tabel belum ditentukan.');
    let rows = ensureTable(this.tableName).filter((row) => this.conditions.every((condition) => matches(row, condition)));

    if (this.order) {
      const multiplier = this.order.direction === 'desc' ? -1 : 1;
      rows = rows.toSorted((left, right) => {
        const leftValue = left[this.order.column];
        const rightValue = right[this.order.column];
        if (leftValue === rightValue) return 0;

        const leftNumber = Number(leftValue);
        const rightNumber = Number(rightValue);
        const bothNumeric = !Number.isNaN(leftNumber) && !Number.isNaN(rightNumber);

        if (bothNumeric) return leftNumber > rightNumber ? multiplier : -multiplier;
        return normalizeComparable(leftValue) > normalizeComparable(rightValue) ? multiplier : -multiplier;
      });
    }

    if (Number.isFinite(this.maxRows)) rows = rows.slice(0, this.maxRows);
    return rows.map((row) => project(row, this.selectedColumns));
  }

  async first() {
    return this.rows()[0];
  }

  async insert(data) {
    const rows = ensureTable(this.tableName);
    const items = Array.isArray(data) ? data : [data];
    const ids = [];

    for (const item of items) {
      const row = { ...item };
      if (row.id == null) row.id = nextId(rows);
      if (row.created_at == null) row.created_at = new Date().toISOString();
      if (this.tableName.endsWith('_notifications') && row.sent_at == null) row.sent_at = new Date().toISOString();
      rows.push(row);
      ids.push(row.id);
    }

    saveState();
    return ids;
  }

  async update(data) {
    const rows = ensureTable(this.tableName);
    let count = 0;

    for (const row of rows) {
      if (!this.conditions.every((condition) => matches(row, condition))) continue;
      Object.assign(row, data);
      count += 1;
    }

    if (count > 0) saveState();
    return count;
  }

  async del() {
    const rows = ensureTable(this.tableName);
    const kept = [];
    let count = 0;

    for (const row of rows) {
      if (this.conditions.every((condition) => matches(row, condition))) {
        count += 1;
      } else {
        kept.push(row);
      }
    }

    state[this.tableName] = kept;
    if (count > 0) saveState();
    return count;
  }

  then(resolve, reject) {
    return Promise.resolve().then(() => this.rows()).then(resolve, reject);
  }
}

function db(tableName) {
  return new QueryBuilder(tableName);
}

db.select = (...columns) => new QueryBuilder(null, columns.flat());
db.schema = {
  async hasTable(tableName) {
    ensureTable(tableName);
    return true;
  },
  async createTable(tableName) {
    ensureTable(tableName);
    saveState();
  },
  async dropTableIfExists(tableName) {
    state[tableName] = [];
    saveState();
  },
  async alterTable(tableName) {
    ensureTable(tableName);
    saveState();
  },
};
db.fn = {
  now() {
    return new Date().toISOString();
  },
};
db._save = saveState;
db._state = state;

export default db;