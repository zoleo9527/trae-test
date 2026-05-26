#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::{DateTime, Local};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};

struct AppState {
    db: Mutex<Option<Connection>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct OptometryRecord {
    id: String,
    customer_name: String,
    customer_phone: String,
    store: String,
    optometrist: String,
    created_at: String,
    status: String,
    left_sph: f32,
    left_cyl: f32,
    left_axis: i32,
    left_add: Option<f32>,
    right_sph: f32,
    right_cyl: f32,
    right_axis: i32,
    right_add: Option<f32>,
    pd: f32,
    lens_type: String,
    lens_brand: String,
    remarks: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct LensInventory {
    id: String,
    sku: String,
    name: String,
    brand: String,
    sph: f32,
    cyl: f32,
    axis: i32,
    add_power: Option<f32>,
    quantity: i32,
    min_stock: i32,
    store: String,
    location: String,
    last_updated: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct TransferOrder {
    id: String,
    optometry_id: Option<String>,
    from_store: String,
    to_store: String,
    lens_sku: String,
    lens_name: String,
    quantity: i32,
    status: String,
    created_by: String,
    created_at: String,
    shipped_at: Option<String>,
    received_at: Option<String>,
    lost_at: Option<String>,
    tracking_no: Option<String>,
    remarks: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ProcessingRecord {
    id: String,
    optometry_id: String,
    processor: String,
    status: String,
    created_at: String,
    started_at: Option<String>,
    completed_at: Option<String>,
    lens_installed: Option<String>,
    quality_check: Option<String>,
    remarks: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct RepairRecord {
    id: String,
    optometry_id: String,
    repair_type: String,
    reason: String,
    status: String,
    created_by: String,
    created_at: String,
    completed_at: Option<String>,
    lens_replaced: Option<String>,
    cost: Option<f32>,
    remarks: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct RefundRecord {
    id: String,
    optometry_id: String,
    amount: f32,
    reason: String,
    status: String,
    created_by: String,
    approved_by: Option<String>,
    created_at: String,
    approved_at: Option<String>,
    remarks: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct StockAlert {
    id: String,
    lens_id: String,
    sku: String,
    lens_name: String,
    store: String,
    current_quantity: i32,
    min_stock: i32,
    alert_type: String,
    created_at: String,
    acknowledged: bool,
}

fn init_database(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS optometry_records (
            id TEXT PRIMARY KEY,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            store TEXT NOT NULL,
            optometrist TEXT NOT NULL,
            created_at TEXT NOT NULL,
            status TEXT NOT NULL,
            left_sph REAL NOT NULL,
            left_cyl REAL NOT NULL,
            left_axis INTEGER NOT NULL,
            left_add REAL,
            right_sph REAL NOT NULL,
            right_cyl REAL NOT NULL,
            right_axis INTEGER NOT NULL,
            right_add REAL,
            pd REAL NOT NULL,
            lens_type TEXT NOT NULL,
            lens_brand TEXT NOT NULL,
            remarks TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS lens_inventory (
            id TEXT PRIMARY KEY,
            sku TEXT NOT NULL,
            name TEXT NOT NULL,
            brand TEXT NOT NULL,
            sph REAL NOT NULL,
            cyl REAL NOT NULL,
            axis INTEGER NOT NULL,
            add_power REAL,
            quantity INTEGER NOT NULL,
            min_stock INTEGER NOT NULL,
            store TEXT NOT NULL,
            location TEXT NOT NULL,
            last_updated TEXT NOT NULL,
            UNIQUE(sku, store)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS transfer_orders (
            id TEXT PRIMARY KEY,
            optometry_id TEXT,
            from_store TEXT NOT NULL,
            to_store TEXT NOT NULL,
            lens_sku TEXT NOT NULL,
            lens_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            status TEXT NOT NULL,
            created_by TEXT NOT NULL,
            created_at TEXT NOT NULL,
            shipped_at TEXT,
            received_at TEXT,
            lost_at TEXT,
            tracking_no TEXT,
            remarks TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS processing_records (
            id TEXT PRIMARY KEY,
            optometry_id TEXT NOT NULL,
            processor TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            started_at TEXT,
            completed_at TEXT,
            lens_installed TEXT,
            quality_check TEXT,
            remarks TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS repair_records (
            id TEXT PRIMARY KEY,
            optometry_id TEXT NOT NULL,
            repair_type TEXT NOT NULL,
            reason TEXT NOT NULL,
            status TEXT NOT NULL,
            created_by TEXT NOT NULL,
            created_at TEXT NOT NULL,
            completed_at TEXT,
            lens_replaced TEXT,
            cost REAL,
            remarks TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS refund_records (
            id TEXT PRIMARY KEY,
            optometry_id TEXT NOT NULL,
            amount REAL NOT NULL,
            reason TEXT NOT NULL,
            status TEXT NOT NULL,
            created_by TEXT NOT NULL,
            approved_by TEXT,
            created_at TEXT NOT NULL,
            approved_at TEXT,
            remarks TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS stock_alerts (
            id TEXT PRIMARY KEY,
            lens_id TEXT NOT NULL,
            sku TEXT NOT NULL,
            lens_name TEXT NOT NULL,
            store TEXT NOT NULL,
            current_quantity INTEGER NOT NULL,
            min_stock INTEGER NOT NULL,
            alert_type TEXT NOT NULL,
            created_at TEXT NOT NULL,
            acknowledged BOOLEAN NOT NULL DEFAULT 0
        )",
        [],
    )?;

    Ok(())
}

fn migrate_database(conn: &Connection) -> rusqlite::Result<()> {
    let table_sql: String = conn.prepare(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='lens_inventory'"
    )?
    .query_row([], |row| row.get::<_, String>(0))
    .unwrap_or_default();

    if table_sql.contains("sku TEXT NOT NULL UNIQUE") {
        conn.execute("PRAGMA foreign_keys = OFF", [])?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS lens_inventory_new (
                id TEXT PRIMARY KEY,
                sku TEXT NOT NULL,
                name TEXT NOT NULL,
                brand TEXT NOT NULL,
                sph REAL NOT NULL,
                cyl REAL NOT NULL,
                axis INTEGER NOT NULL,
                add_power REAL,
                quantity INTEGER NOT NULL,
                min_stock INTEGER NOT NULL,
                store TEXT NOT NULL,
                location TEXT NOT NULL,
                last_updated TEXT NOT NULL,
                UNIQUE(sku, store)
            )",
            [],
        )?;

        conn.execute(
            "INSERT INTO lens_inventory_new SELECT * FROM lens_inventory",
            [],
        )?;

        conn.execute("DROP TABLE lens_inventory", [])?;
        conn.execute("ALTER TABLE lens_inventory_new RENAME TO lens_inventory", [])?;
        conn.execute("PRAGMA foreign_keys = ON", [])?;
    }

    Ok(())
}

fn seed_sample_data(conn: &Connection) -> rusqlite::Result<()> {
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM lens_inventory", [], |row| row.get(0))?;
    if count > 0 {
        return Ok(());
    }

    let lenses = vec![
        ("L001", "依视路钻晶A+ 1.56", "依视路", -2.00, -0.50, 180, None, 50, 10, "总店", "A-01"),
        ("L002", "依视路钻晶A+ 1.56", "依视路", -3.00, -0.75, 90, None, 35, 10, "总店", "A-02"),
        ("L003", "依视路钻晶A4 1.61", "依视路", -4.00, -1.00, 180, None, 20, 8, "总店", "B-01"),
        ("L004", "蔡司成长乐 1.50", "蔡司", -1.50, 0.00, 0, None, 15, 5, "总店", "C-01"),
        ("L005", "豪雅锐美3S 1.67", "豪雅", -6.00, -0.50, 170, None, 5, 5, "总店", "D-01"),
        ("L006", "依视路钻晶A+ 1.56", "依视路", -2.00, -0.50, 180, None, 25, 10, "分店A", "A-01"),
        ("L007", "依视路钻晶A+ 1.56", "依视路", -3.00, -0.75, 90, None, 12, 10, "分店A", "A-02"),
        ("L008", "依视路钻晶A4 1.61", "依视路", -4.00, -1.00, 180, None, 3, 8, "分店A", "B-01"),
        ("L009", "依视路钻晶A+ 1.56", "依视路", -2.50, -0.50, 180, None, 30, 10, "分店B", "A-01"),
        ("L010", "蔡司成长乐 1.50", "蔡司", -2.00, 0.00, 0, None, 2, 5, "分店B", "C-01"),
    ];

    for (id, name, brand, sph, cyl, axis, add, qty, min, store, loc) in lenses {
        conn.execute(
            "INSERT INTO lens_inventory (id, sku, name, brand, sph, cyl, axis, add_power, quantity, min_stock, store, location, last_updated)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                id, id, name, brand, sph, cyl, axis, add, qty, min, store, loc,
                Local::now().to_rfc3339()
            ],
        )?;
    }

    let optometries = vec![
        ("OPT001", "张三", "13800138001", "总店", "王验光师", "pending", -2.00, -0.50, 180, None, -2.25, -0.50, 170, None, 62.0, "单光", "依视路"),
        ("OPT002", "李四", "13800138002", "分店A", "李验光师", "processing", -3.00, -0.75, 90, None, -3.25, -0.75, 85, None, 64.0, "单光", "依视路"),
        ("OPT003", "王五", "13800138003", "分店B", "赵验光师", "completed", -1.50, 0.00, 0, None, -1.75, 0.00, 0, None, 60.0, "单光", "蔡司"),
        ("OPT004", "赵六", "13800138004", "总店", "王验光师", "repair", -4.00, -1.00, 180, None, -4.50, -1.00, 175, None, 63.0, "单光", "依视路"),
        ("OPT005", "孙七", "13800138005", "分店A", "李验光师", "refund_pending", -2.50, -0.50, 180, None, -2.75, -0.50, 180, None, 61.0, "单光", "豪雅"),
    ];

    for (id, name, phone, store, opto, status, lsph, lcyl, laxis, ladd, rsph, rcyl, raxis, radd, pd, ltype, brand) in optometries {
        conn.execute(
            "INSERT INTO optometry_records (id, customer_name, customer_phone, store, optometrist, created_at, status, left_sph, left_cyl, left_axis, left_add, right_sph, right_cyl, right_axis, right_add, pd, lens_type, lens_brand)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)",
            params![
                id, name, phone, store, opto,
                Local::now().to_rfc3339(),
                status, lsph, lcyl, laxis, ladd, rsph, rcyl, raxis, radd, pd, ltype, brand
            ],
        )?;
    }

    let transfers = vec![
        ("TR001", Some("OPT002"), "总店", "分店A", "L003", "依视路钻晶A4 1.61", 1, "shipped", "张经理", None, None, Some("SF123456789")),
        ("TR002", None, "分店A", "分店B", "L009", "依视路钻晶A+ 1.56", 5, "lost", "李经理", None, Some(Local::now().to_rfc3339()), None),
        ("TR003", Some("OPT001"), "分店A", "总店", "L006", "依视路钻晶A+ 1.56", 1, "pending", "王店长", None, None, None),
    ];

    for (id, opto_id, from, to, sku, name, qty, status, creator, shipped, lost, track) in transfers {
        conn.execute(
            "INSERT INTO transfer_orders (id, optometry_id, from_store, to_store, lens_sku, lens_name, quantity, status, created_by, created_at, shipped_at, lost_at, tracking_no)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                id, opto_id, from, to, sku, name, qty, status, creator,
                Local::now().to_rfc3339(), shipped, lost, track
            ],
        )?;
    }

    let processings = vec![
        ("PROC001", "OPT002", "陈加工", "processing", Some(Local::now().to_rfc3339()), None, None),
        ("PROC002", "OPT003", "陈加工", "completed", Some(Local::now().to_rfc3339()), Some(Local::now().to_rfc3339()), Some("L004")),
    ];

    for (id, opto_id, proc, status, started, completed, lens) in processings {
        conn.execute(
            "INSERT INTO processing_records (id, optometry_id, processor, status, created_at, started_at, completed_at, lens_installed)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                id, opto_id, proc, status, Local::now().to_rfc3339(), started, completed, lens
            ],
        )?;
    }

    conn.execute(
        "INSERT INTO repair_records (id, optometry_id, repair_type, reason, status, created_by, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            "REP001", "OPT004", "镜片更换", "镜片划痕严重", "in_progress", "王店长",
            Local::now().to_rfc3339()
        ],
    )?;

    conn.execute(
        "INSERT INTO refund_records (id, optometry_id, amount, reason, status, created_by, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            "REF001", "OPT005", 680.00, "度数不符，客户要求退款", "pending", "李店长",
            Local::now().to_rfc3339()
        ],
    )?;

    Ok(())
}

fn check_and_create_alerts(conn: &Connection) -> rusqlite::Result<()> {
    let mut stmt = conn.prepare(
        "SELECT id, sku, name, store, quantity, min_stock 
         FROM lens_inventory"
    )?;
    
    let inventory_items = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, String>(3)?,
            row.get::<_, i32>(4)?,
            row.get::<_, i32>(5)?,
        ))
    })?;

    for item in inventory_items {
        let (lens_id, sku, name, store, qty, min) = item?;
        let alert_id = format!("ALERT_{}_{}", sku, store);
        
        let existing_alert: Option<(i32, bool)> = conn.query_row(
            "SELECT current_quantity, acknowledged FROM stock_alerts WHERE id = ?",
            params![alert_id],
            |row| Ok((row.get::<_, i32>(0)?, row.get::<_, bool>(1)?)),
        ).optional()?;

        if qty <= min {
            let alert_type = if qty == 0 { "out_of_stock" } else { "low_stock" };
            
            match existing_alert {
                None => {
                    conn.execute(
                        "INSERT INTO stock_alerts (id, lens_id, sku, lens_name, store, current_quantity, min_stock, alert_type, created_at, acknowledged)
                         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 0)",
                        params![
                            alert_id,
                            lens_id, sku, name, store, qty, min, alert_type,
                            Local::now().to_rfc3339()
                        ],
                    )?;
                }
                Some((prev_qty, acknowledged)) => {
                    if prev_qty != qty {
                        conn.execute(
                            "UPDATE stock_alerts 
                             SET current_quantity = ?, min_stock = ?, alert_type = ?, created_at = ?
                             WHERE id = ?",
                            params![qty, min, alert_type, Local::now().to_rfc3339(), alert_id],
                        )?;
                    }
                    if !acknowledged && qty == 0 && prev_qty > 0 {
                        conn.execute(
                            "UPDATE stock_alerts SET acknowledged = 0 WHERE id = ?",
                            params![alert_id],
                        )?;
                    }
                }
            }
        } else {
            if existing_alert.is_some() {
                conn.execute("DELETE FROM stock_alerts WHERE id = ?", params![alert_id])?;
            }
        }
    }

    Ok(())
}

fn update_inventory_quantity(conn: &Connection, sku: &str, store: &str, quantity_change: i32) -> rusqlite::Result<()> {
    let existing_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM lens_inventory WHERE sku = ? AND store = ?",
        params![sku, store],
        |row| row.get(0),
    )?;

    if existing_count > 0 {
        conn.execute(
            "UPDATE lens_inventory 
             SET quantity = quantity + ?, last_updated = ? 
             WHERE sku = ? AND store = ?",
            params![quantity_change, Local::now().to_rfc3339(), sku, store],
        )?;
    } else if quantity_change > 0 {
        let source_lens: Option<(String, String, f32, f32, i32, Option<f32>)> = conn.query_row(
            "SELECT name, brand, sph, cyl, axis, add_power FROM lens_inventory WHERE sku = ? LIMIT 1",
            params![sku],
            |row| Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
                row.get(5)?,
            )),
        ).optional()?;

        if let Some((name, brand, sph, cyl, axis, add_power)) = source_lens {
            let new_id = format!("{}_{}", sku, store);
            conn.execute(
                "INSERT INTO lens_inventory (id, sku, name, brand, sph, cyl, axis, add_power, quantity, min_stock, store, location, last_updated)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 0, ?10, 'AUTO', ?11)",
                params![
                    new_id, sku, name, brand, sph, cyl, axis, add_power,
                    quantity_change, store, Local::now().to_rfc3339()
                ],
            )?;
        } else {
            return Err(rusqlite::Error::QueryReturnedNoRows);
        }
    }

    check_and_create_alerts(conn)?;
    Ok(())
}

#[tauri::command]
fn get_optometry_records(state: tauri::State<AppState>) -> Result<Vec<OptometryRecord>, String> {
    let db_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let mut stmt = conn.prepare("SELECT * FROM optometry_records ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    
    let records = stmt.query_map([], |row| {
        Ok(OptometryRecord {
            id: row.get(0)?,
            customer_name: row.get(1)?,
            customer_phone: row.get(2)?,
            store: row.get(3)?,
            optometrist: row.get(4)?,
            created_at: row.get(5)?,
            status: row.get(6)?,
            left_sph: row.get(7)?,
            left_cyl: row.get(8)?,
            left_axis: row.get(9)?,
            left_add: row.get(10)?,
            right_sph: row.get(11)?,
            right_cyl: row.get(12)?,
            right_axis: row.get(13)?,
            right_add: row.get(14)?,
            pd: row.get(15)?,
            lens_type: row.get(16)?,
            lens_brand: row.get(17)?,
            remarks: row.get(18)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let mut result = Vec::new();
    for record in records {
        result.push(record.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
fn get_lens_inventory(state: tauri::State<AppState>) -> Result<Vec<LensInventory>, String> {
    let db_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let mut stmt = conn.prepare("SELECT * FROM lens_inventory ORDER BY store, sku")
        .map_err(|e| e.to_string())?;
    
    let inventory = stmt.query_map([], |row| {
        Ok(LensInventory {
            id: row.get(0)?,
            sku: row.get(1)?,
            name: row.get(2)?,
            brand: row.get(3)?,
            sph: row.get(4)?,
            cyl: row.get(5)?,
            axis: row.get(6)?,
            add_power: row.get(7)?,
            quantity: row.get(8)?,
            min_stock: row.get(9)?,
            store: row.get(10)?,
            location: row.get(11)?,
            last_updated: row.get(12)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let mut result = Vec::new();
    for item in inventory {
        result.push(item.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
fn get_transfer_orders(state: tauri::State<AppState>) -> Result<Vec<TransferOrder>, String> {
    let db_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let mut stmt = conn.prepare("SELECT * FROM transfer_orders ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    
    let orders = stmt.query_map([], |row| {
        Ok(TransferOrder {
            id: row.get(0)?,
            optometry_id: row.get(1)?,
            from_store: row.get(2)?,
            to_store: row.get(3)?,
            lens_sku: row.get(4)?,
            lens_name: row.get(5)?,
            quantity: row.get(6)?,
            status: row.get(7)?,
            created_by: row.get(8)?,
            created_at: row.get(9)?,
            shipped_at: row.get(10)?,
            received_at: row.get(11)?,
            lost_at: row.get(12)?,
            tracking_no: row.get(13)?,
            remarks: row.get(14)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let mut result = Vec::new();
    for order in orders {
        result.push(order.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
fn get_processing_records(state: tauri::State<AppState>) -> Result<Vec<ProcessingRecord>, String> {
    let db_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let mut stmt = conn.prepare("SELECT * FROM processing_records ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    
    let records = stmt.query_map([], |row| {
        Ok(ProcessingRecord {
            id: row.get(0)?,
            optometry_id: row.get(1)?,
            processor: row.get(2)?,
            status: row.get(3)?,
            created_at: row.get(4)?,
            started_at: row.get(5)?,
            completed_at: row.get(6)?,
            lens_installed: row.get(7)?,
            quality_check: row.get(8)?,
            remarks: row.get(9)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let mut result = Vec::new();
    for record in records {
        result.push(record.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
fn get_repair_records(state: tauri::State<AppState>) -> Result<Vec<RepairRecord>, String> {
    let db_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let mut stmt = conn.prepare("SELECT * FROM repair_records ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    
    let records = stmt.query_map([], |row| {
        Ok(RepairRecord {
            id: row.get(0)?,
            optometry_id: row.get(1)?,
            repair_type: row.get(2)?,
            reason: row.get(3)?,
            status: row.get(4)?,
            created_by: row.get(5)?,
            created_at: row.get(6)?,
            completed_at: row.get(7)?,
            lens_replaced: row.get(8)?,
            cost: row.get(9)?,
            remarks: row.get(10)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let mut result = Vec::new();
    for record in records {
        result.push(record.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
fn get_refund_records(state: tauri::State<AppState>) -> Result<Vec<RefundRecord>, String> {
    let db_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let mut stmt = conn.prepare("SELECT * FROM refund_records ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    
    let records = stmt.query_map([], |row| {
        Ok(RefundRecord {
            id: row.get(0)?,
            optometry_id: row.get(1)?,
            amount: row.get(2)?,
            reason: row.get(3)?,
            status: row.get(4)?,
            created_by: row.get(5)?,
            approved_by: row.get(6)?,
            created_at: row.get(7)?,
            approved_at: row.get(8)?,
            remarks: row.get(9)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let mut result = Vec::new();
    for record in records {
        result.push(record.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
fn get_stock_alerts(state: tauri::State<AppState>) -> Result<Vec<StockAlert>, String> {
    let db_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_guard.as_ref().ok_or("Database not initialized")?;
    
    check_and_create_alerts(conn).map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare("SELECT * FROM stock_alerts ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    
    let alerts = stmt.query_map([], |row| {
        Ok(StockAlert {
            id: row.get(0)?,
            lens_id: row.get(1)?,
            sku: row.get(2)?,
            lens_name: row.get(3)?,
            store: row.get(4)?,
            current_quantity: row.get(5)?,
            min_stock: row.get(6)?,
            alert_type: row.get(7)?,
            created_at: row.get(8)?,
            acknowledged: row.get(9)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let mut result = Vec::new();
    for alert in alerts {
        result.push(alert.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
fn create_transfer_order(
    state: tauri::State<AppState>,
    optometry_id: Option<String>,
    from_store: String,
    to_store: String,
    lens_sku: String,
    lens_name: String,
    quantity: i32,
    created_by: String,
    remarks: Option<String>,
) -> Result<String, String> {
    let db_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let current_qty: i32 = conn.query_row(
        "SELECT quantity FROM lens_inventory WHERE sku = ? AND store = ?",
        params![lens_sku, from_store],
        |row| row.get(0),
    ).map_err(|_| "调出店库存不足或镜片不存在")?;
    
    if current_qty < quantity {
        return Err(format!("调出店库存不足，当前库存: {}", current_qty));
    }
    
    let id = format!("TR{}", Local::now().format("%Y%m%d%H%M%S"));
    
    conn.execute(
        "INSERT INTO transfer_orders (id, optometry_id, from_store, to_store, lens_sku, lens_name, quantity, status, created_by, created_at, remarks)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'pending', ?8, ?9, ?10)",
        params![
            id, optometry_id, from_store, to_store, lens_sku, lens_name, quantity, created_by,
            Local::now().to_rfc3339(), remarks
        ],
    ).map_err(|e| e.to_string())?;
    
    Ok(id)
}

#[tauri::command]
fn update_transfer_status(
    state: tauri::State<AppState>,
    id: String,
    status: String,
) -> Result<(), String> {
    let db_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let (lens_sku, lens_name, from_store, to_store, quantity, current_status, optometry_id, created_by): 
        (String, String, String, String, i32, String, Option<String>, String) = conn.query_row(
        "SELECT lens_sku, lens_name, from_store, to_store, quantity, status, optometry_id, created_by FROM transfer_orders WHERE id = ?",
        params![id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?, row.get(5)?, row.get(6)?, row.get(7)?)),
    ).map_err(|_| "调拨单不存在")?;
    
    if current_status == status {
        return Ok(());
    }
    
    let now = Local::now().to_rfc3339();
    
    match status.as_str() {
        "shipped" => {
            update_inventory_quantity(conn, &lens_sku, &from_store, -quantity)
                .map_err(|e| format!("扣减调出店库存失败: {}", e))?;
            conn.execute("UPDATE transfer_orders SET status = ?, shipped_at = ? WHERE id = ?",
                params![status, now, id]).map_err(|e| e.to_string())?;
        }
        "received" => {
            update_inventory_quantity(conn, &lens_sku, &to_store, quantity)
                .map_err(|e| format!("增加调入店库存失败: {}", e))?;
            conn.execute("UPDATE transfer_orders SET status = ?, received_at = ? WHERE id = ?",
                params![status, now, id]).map_err(|e| e.to_string())?;
        }
        "lost" => {
            if current_status == "shipped" {
                update_inventory_quantity(conn, &lens_sku, &from_store, quantity)
                    .map_err(|e| format!("恢复调出店库存失败: {}", e))?;
            }
            conn.execute("UPDATE transfer_orders SET status = ?, lost_at = ? WHERE id = ?",
                params![status, now, id]).map_err(|e| e.to_string())?;

            if let Some(opto_id) = optometry_id {
                let existing_repair: Option<String> = conn.query_row(
                    "SELECT id FROM repair_records WHERE optometry_id = ?",
                    params![opto_id],
                    |row| row.get::<_, String>(0),
                ).optional().map_err(|e| e.to_string())?;

                let existing_refund: Option<String> = conn.query_row(
                    "SELECT id FROM refund_records WHERE optometry_id = ?",
                    params![opto_id],
                    |row| row.get::<_, String>(0),
                ).optional().map_err(|e| e.to_string())?;

                if existing_repair.is_none() && existing_refund.is_none() {
                    let repair_id = format!("REP{}", Local::now().format("%Y%m%d%H%M%S"));
                    let reason = format!("调拨单{}丢失: {} x{}，{}→{}", 
                        id, lens_name, quantity, from_store, to_store);
                    
                    conn.execute(
                        "INSERT INTO repair_records (id, optometry_id, repair_type, reason, status, created_by, created_at, remarks)
                         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                        params![
                            repair_id,
                            opto_id,
                            "镜片补发",
                            reason,
                            "in_progress",
                            created_by,
                            now,
                            Some(format!("关联调拨单: {}", id))
                        ],
                    ).map_err(|e| format!("创建返修单失败: {}", e))?;

                    conn.execute(
                        "UPDATE optometry_records SET status = 'repair' WHERE id = ?",
                        params![opto_id],
                    ).map_err(|e| e.to_string())?;
                }
            }
        }
        _ => {
            conn.execute("UPDATE transfer_orders SET status = ? WHERE id = ?",
                params![status, id]).map_err(|e| e.to_string())?;
        }
    }
    
    Ok(())
}

#[tauri::command]
fn acknowledge_alert(state: tauri::State<AppState>, alert_id: String) -> Result<(), String> {
    let db_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_guard.as_ref().ok_or("Database not initialized")?;
    
    conn.execute("UPDATE stock_alerts SET acknowledged = 1 WHERE id = ?", params![alert_id])
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
fn export_all_data(state: tauri::State<AppState>) -> Result<String, String> {
    let db_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let optometries = get_optometry_records(state.inner())?;
    let inventory = get_lens_inventory(state.inner())?;
    let transfers = get_transfer_orders(state.inner())?;
    let processings = get_processing_records(state.inner())?;
    let repairs = get_repair_records(state.inner())?;
    let refunds = get_refund_records(state.inner())?;
    
    let export_data = serde_json::json!({
        "exported_at": Local::now().to_rfc3339(),
        "optometry_records": optometries,
        "lens_inventory": inventory,
        "transfer_orders": transfers,
        "processing_records": processings,
        "repair_records": repairs,
        "refund_records": refunds,
    });
    
    Ok(serde_json::to_string_pretty(&export_data).map_err(|e| e.to_string())?)
}

#[tauri::command]
fn update_optometry_status(
    state: tauri::State<AppState>,
    id: String,
    status: String,
) -> Result<(), String> {
    let db_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_guard.as_ref().ok_or("Database not initialized")?;
    
    conn.execute("UPDATE optometry_records SET status = ? WHERE id = ?", params![status, id])
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
fn approve_refund(
    state: tauri::State<AppState>,
    id: String,
    approved_by: String,
) -> Result<(), String> {
    let db_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_guard.as_ref().ok_or("Database not initialized")?;
    
    conn.execute(
        "UPDATE refund_records SET status = 'approved', approved_by = ?, approved_at = ? WHERE id = ?",
        params![approved_by, Local::now().to_rfc3339(), id],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

fn main() {
    let app_dir = tauri::api::path::app_data_dir(&tauri::Config::default())
        .unwrap_or_else(|| std::path::PathBuf::from("."));
    
    std::fs::create_dir_all(&app_dir).ok();
    let db_path = app_dir.join("lens_inventory.db");
    
    let conn = Connection::open(&db_path).expect("Failed to open database");
    init_database(&conn).expect("Failed to initialize database");
    migrate_database(&conn).expect("Failed to migrate database");
    seed_sample_data(&conn).expect("Failed to seed sample data");
    
    let state = AppState {
        db: Mutex::new(Some(conn)),
    };
    
    let tray_menu = SystemTrayMenu::new();
    let system_tray = SystemTray::new().with_menu(tray_menu);
    
    tauri::Builder::default()
        .manage(state)
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick { .. } => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            get_optometry_records,
            get_lens_inventory,
            get_transfer_orders,
            get_processing_records,
            get_repair_records,
            get_refund_records,
            get_stock_alerts,
            create_transfer_order,
            update_transfer_status,
            acknowledge_alert,
            export_all_data,
            update_optometry_status,
            approve_refund,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
