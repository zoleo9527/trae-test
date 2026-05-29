package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/cultural-store/inspection-service/internal/model"
	"github.com/jmoiron/sqlx"
)

type Repo struct {
	db *sqlx.DB
}

func NewRepo(db *sqlx.DB) *Repo {
	return &Repo{db: db}
}

func (r *Repo) DB() *sqlx.DB {
	return r.db
}

func (r *Repo) GetUserByUsername(username string) (*model.User, error) {
	var u model.User
	err := r.db.Get(&u, "SELECT * FROM users WHERE username = $1 AND is_active = true", username)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repo) GetUserByID(id string) (*model.User, error) {
	var u model.User
	err := r.db.Get(&u, "SELECT * FROM users WHERE id = $1", id)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repo) ListUsers(f model.ListFilter) ([]model.User, int, error) {
	var where []string
	var args []interface{}
	argN := 1
	if f.StoreID != "" {
		where = append(where, fmt.Sprintf("store_id = $%d", argN))
		args = append(args, f.StoreID)
		argN++
	}
	if f.Search != "" {
		where = append(where, fmt.Sprintf("(username ILIKE $%d OR display_name ILIKE $%d)", argN, argN))
		args = append(args, "%"+f.Search+"%")
		argN++
	}
	if f.Status != "" {
		if f.Status == "active" {
			where = append(where, "is_active = true")
		} else {
			where = append(where, "is_active = false")
		}
	}
	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}
	var total int
	countQ := "SELECT COUNT(*) FROM users " + whereClause
	if err := r.db.Get(&total, countQ, args...); err != nil {
		return nil, 0, err
	}
	offset := (f.Page - 1) * f.PageSize
	sortCol := mapSortCol(f.SortBy, map[string]string{
		"username": "username", "display_name": "display_name", "role": "role", "created_at": "created_at",
	})
	sortDir := "DESC"
	if strings.ToLower(f.SortDir) == "asc" {
		sortDir = "ASC"
	}
	q := fmt.Sprintf("SELECT * FROM users %s ORDER BY %s %s LIMIT $%d OFFSET $%d",
		whereClause, sortCol, sortDir, argN, argN+1)
	args = append(args, f.PageSize, offset)
	var users []model.User
	if err := r.db.Select(&users, q, args...); err != nil {
		return nil, 0, err
	}
	return users, total, nil
}

func (r *Repo) ListStores(f model.ListFilter) ([]model.Store, int, error) {
	var where []string
	var args []interface{}
	argN := 1
	if f.Status != "" {
		where = append(where, fmt.Sprintf("status = $%d", argN))
		args = append(args, f.Status)
		argN++
	}
	if f.Search != "" {
		where = append(where, fmt.Sprintf("(name ILIKE $%d OR region ILIKE $%d)", argN, argN))
		args = append(args, "%"+f.Search+"%")
		argN++
	}
	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}
	var total int
	if err := r.db.Get(&total, "SELECT COUNT(*) FROM stores "+whereClause, args...); err != nil {
		return nil, 0, err
	}
	offset := (f.Page - 1) * f.PageSize
	sortCol := mapSortCol(f.SortBy, map[string]string{
		"name": "name", "region": "region", "created_at": "created_at",
	})
	sortDir := "DESC"
	if strings.ToLower(f.SortDir) == "asc" {
		sortDir = "ASC"
	}
	q := fmt.Sprintf("SELECT * FROM stores %s ORDER BY %s %s LIMIT $%d OFFSET $%d",
		whereClause, sortCol, sortDir, argN, argN+1)
	args = append(args, f.PageSize, offset)
	var stores []model.Store
	if err := r.db.Select(&stores, q, args...); err != nil {
		return nil, 0, err
	}
	return stores, total, nil
}

func (r *Repo) GetStoreByID(id string) (*model.Store, error) {
	var s model.Store
	if err := r.db.Get(&s, "SELECT * FROM stores WHERE id = $1", id); err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *Repo) ListInspections(f model.ListFilter) ([]model.Inspection, int, error) {
	var where []string
	var args []interface{}
	argN := 1
	if f.StoreID != "" {
		where = append(where, fmt.Sprintf("i.store_id = $%d", argN))
		args = append(args, f.StoreID)
		argN++
	}
	if f.Status != "" {
		where = append(where, fmt.Sprintf("i.status = $%d", argN))
		args = append(args, f.Status)
		argN++
	}
	if f.Search != "" {
		where = append(where, fmt.Sprintf("i.title ILIKE $%d", argN))
		args = append(args, "%"+f.Search+"%")
		argN++
	}
	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}
	var total int
	countQ := "SELECT COUNT(*) FROM inspections i " + whereClause
	if err := r.db.Get(&total, countQ, args...); err != nil {
		return nil, 0, err
	}
	offset := (f.Page - 1) * f.PageSize
	sortDir := "DESC"
	if strings.ToLower(f.SortDir) == "asc" {
		sortDir = "ASC"
	}
	q := fmt.Sprintf(`SELECT i.*, s.name as store_name, u.display_name as inspector_name,
		(SELECT COUNT(*) FROM inspection_items WHERE inspection_id = i.id) as item_count,
		(SELECT COUNT(*) FROM inspection_items WHERE inspection_id = i.id AND status = 'open') as open_item_count
		FROM inspections i
		JOIN stores s ON s.id = i.store_id
		JOIN users u ON u.id = i.inspector_id
		%s ORDER BY i.%s %s LIMIT $%d OFFSET $%d`,
		whereClause, mapSortCol(f.SortBy, map[string]string{
			"title": "i.title", "status": "i.status", "inspected_at": "i.inspected_at", "created_at": "i.created_at",
		}), sortDir, argN, argN+1)
	args = append(args, f.PageSize, offset)
	var inspections []model.Inspection
	if err := r.db.Select(&inspections, q, args...); err != nil {
		return nil, 0, err
	}
	return inspections, total, nil
}

func (r *Repo) GetInspectionByID(id string) (*model.Inspection, error) {
	var ins model.Inspection
	q := `SELECT i.*, s.name as store_name, u.display_name as inspector_name
		FROM inspections i
		JOIN stores s ON s.id = i.store_id
		JOIN users u ON u.id = i.inspector_id
		WHERE i.id = $1`
	if err := r.db.Get(&ins, q, id); err != nil {
		return nil, err
	}
	return &ins, nil
}

func (r *Repo) CreateInspection(ins *model.Inspection) error {
	q := `INSERT INTO inspections (store_id, inspector_id, title, inspection_type, status, notes, inspected_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at, updated_at`
	return r.db.QueryRowx(q,
		ins.StoreID, ins.InspectorID, ins.Title, ins.InspectionType, ins.Status, ins.Notes, ins.InspectedAt,
	).StructScan(ins)
}

func (r *Repo) UpdateInspection(ins *model.Inspection) error {
	q := `UPDATE inspections SET title = $1, inspection_type = $2, status = $3, notes = $4, updated_at = NOW()
		WHERE id = $5 RETURNING updated_at`
	return r.db.QueryRowx(q, ins.Title, ins.InspectionType, ins.Status, ins.Notes, ins.ID).StructScan(ins)
}

func (r *Repo) ListInspectionItems(inspectionID string) ([]model.InspectionItem, error) {
	var items []model.InspectionItem
	q := `SELECT ii.*, u.display_name as assignee_name
		FROM inspection_items ii
		LEFT JOIN users u ON u.id = ii.assignee_id
		WHERE ii.inspection_id = $1 ORDER BY ii.created_at ASC`
	if err := r.db.Select(&items, q, inspectionID); err != nil {
		return nil, err
	}
	return items, nil
}

func (r *Repo) GetInspectionItemByID(id string) (*model.InspectionItem, error) {
	var item model.InspectionItem
	q := `SELECT ii.*, u.display_name as assignee_name
		FROM inspection_items ii
		LEFT JOIN users u ON u.id = ii.assignee_id
		WHERE ii.id = $1`
	if err := r.db.Get(&item, q, id); err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *Repo) CreateInspectionItem(item *model.InspectionItem) error {
	q := `INSERT INTO inspection_items (inspection_id, category, description, severity, status, assignee_id)
		VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at, updated_at`
	return r.db.QueryRowx(q,
		item.InspectionID, item.Category, item.Description, item.Severity, item.Status, item.AssigneeID,
	).StructScan(item)
}

func (r *Repo) UpdateInspectionItem(item *model.InspectionItem) error {
	q := `UPDATE inspection_items SET category = $1, description = $2, severity = $3, status = $4, assignee_id = $5, updated_at = NOW()
		WHERE id = $6 RETURNING updated_at`
	return r.db.QueryRowx(q,
		item.Category, item.Description, item.Severity, item.Status, item.AssigneeID, item.ID,
	).StructScan(item)
}

func (r *Repo) ListInspectionPhotos(itemID string) ([]model.InspectionPhoto, error) {
	var photos []model.InspectionPhoto
	if err := r.db.Select(&photos, "SELECT * FROM inspection_photos WHERE inspection_item_id = $1 ORDER BY taken_at ASC", itemID); err != nil {
		return nil, err
	}
	return photos, nil
}

func (r *Repo) CreateInspectionPhoto(photo *model.InspectionPhoto) error {
	q := `INSERT INTO inspection_photos (inspection_item_id, url, caption, taken_at)
		VALUES ($1, $2, $3, $4) RETURNING id, created_at`
	return r.db.QueryRowx(q, photo.InspectionItemID, photo.URL, photo.Caption, photo.TakenAt).StructScan(photo)
}

func (r *Repo) ListRectifications(f model.ListFilter) ([]model.Rectification, int, error) {
	var where []string
	var args []interface{}
	argN := 1
	if f.StoreID != "" {
		where = append(where, fmt.Sprintf("r.store_id = $%d", argN))
		args = append(args, f.StoreID)
		argN++
	}
	if f.Status != "" {
		where = append(where, fmt.Sprintf("r.status = $%d", argN))
		args = append(args, f.Status)
		argN++
	}
	if f.Search != "" {
		where = append(where, fmt.Sprintf("r.title ILIKE $%d", argN))
		args = append(args, "%"+f.Search+"%")
		argN++
	}
	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}
	var total int
	if err := r.db.Get(&total, "SELECT COUNT(*) FROM rectifications r "+whereClause, args...); err != nil {
		return nil, 0, err
	}
	offset := (f.Page - 1) * f.PageSize
	sortDir := "DESC"
	if strings.ToLower(f.SortDir) == "asc" {
		sortDir = "ASC"
	}
	q := fmt.Sprintf(`SELECT r.*, ua.display_name as assignee_name, uv.display_name as verifier_name, s.name as store_name
		FROM rectifications r
		LEFT JOIN users ua ON ua.id = r.assignee_id
		LEFT JOIN users uv ON uv.id = r.verifier_id
		JOIN stores s ON s.id = r.store_id
		%s ORDER BY r.%s %s LIMIT $%d OFFSET $%d`,
		whereClause,
		mapSortCol(f.SortBy, map[string]string{
			"title": "r.title", "status": "r.status", "severity": "r.severity", "due_date": "r.due_date", "created_at": "r.created_at",
		}), sortDir, argN, argN+1)
	args = append(args, f.PageSize, offset)
	var rects []model.Rectification
	if err := r.db.Select(&rects, q, args...); err != nil {
		return nil, 0, err
	}
	return rects, total, nil
}

func (r *Repo) GetRectificationByID(id string) (*model.Rectification, error) {
	var rect model.Rectification
	q := `SELECT r.*, ua.display_name as assignee_name, uv.display_name as verifier_name, s.name as store_name
		FROM rectifications r
		LEFT JOIN users ua ON ua.id = r.assignee_id
		LEFT JOIN users uv ON uv.id = r.verifier_id
		JOIN stores s ON s.id = r.store_id
		WHERE r.id = $1`
	if err := r.db.Get(&rect, q, id); err != nil {
		return nil, err
	}
	return &rect, nil
}

func (r *Repo) CreateRectification(rect *model.Rectification) error {
	q := `INSERT INTO rectifications (inspection_item_id, store_id, title, description, severity, status, assignee_id, verifier_id, due_date)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, created_at, updated_at`
	return r.db.QueryRowx(q,
		rect.InspectionItemID, rect.StoreID, rect.Title, rect.Description, rect.Severity, rect.Status,
		rect.AssigneeID, rect.VerifierID, rect.DueDate,
	).StructScan(rect)
}

func (r *Repo) UpdateRectification(rect *model.Rectification) error {
	q := `UPDATE rectifications SET title = $1, description = $2, severity = $3, status = $4,
		assignee_id = $5, verifier_id = $6, due_date = $7, resolved_at = $8, updated_at = NOW()
		WHERE id = $9 RETURNING updated_at`
	return r.db.QueryRowx(q,
		rect.Title, rect.Description, rect.Severity, rect.Status, rect.AssigneeID, rect.VerifierID,
		rect.DueDate, rect.ResolvedAt, rect.ID,
	).StructScan(rect)
}

func (r *Repo) ListRectificationPhotos(rectID string) ([]model.RectificationPhoto, error) {
	var photos []model.RectificationPhoto
	q := `SELECT rp.*, u.display_name as taken_by_name
		FROM rectification_photos rp
		LEFT JOIN users u ON u.id = rp.taken_by_id
		WHERE rp.rectification_id = $1 ORDER BY rp.taken_at ASC`
	if err := r.db.Select(&photos, q, rectID); err != nil {
		return nil, err
	}
	return photos, nil
}

func (r *Repo) CreateRectificationPhoto(photo *model.RectificationPhoto) error {
	q := `INSERT INTO rectification_photos (rectification_id, photo_type, url, caption, taken_by_id, taken_at)
		VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`
	return r.db.QueryRowx(q,
		photo.RectificationID, photo.PhotoType, photo.URL, photo.Caption, photo.TakenByID, photo.TakenAt,
	).StructScan(photo)
}

func (r *Repo) ListRectificationComments(rectID string) ([]model.RectificationComment, error) {
	var comments []model.RectificationComment
	q := `SELECT rc.*, u.display_name as author_name
		FROM rectification_comments rc
		JOIN users u ON u.id = rc.author_id
		WHERE rc.rectification_id = $1 ORDER BY rc.created_at ASC`
	if err := r.db.Select(&comments, q, rectID); err != nil {
		return nil, err
	}
	return comments, nil
}

func (r *Repo) CreateRectificationComment(comment *model.RectificationComment) error {
	q := `INSERT INTO rectification_comments (rectification_id, author_id, content)
		VALUES ($1, $2, $3) RETURNING id, created_at`
	return r.db.QueryRowx(q, comment.RectificationID, comment.AuthorID, comment.Content).StructScan(comment)
}

func (r *Repo) ListProducts(f model.ListFilter) ([]model.Product, int, error) {
	var where []string
	var args []interface{}
	argN := 1
	if f.Status != "" {
		where = append(where, fmt.Sprintf("status = $%d", argN))
		args = append(args, f.Status)
		argN++
	}
	if f.StoreID != "" {
		where = append(where, fmt.Sprintf("(store_id = $%d OR store_id IS NULL)", argN))
		args = append(args, f.StoreID)
		argN++
	}
	if f.Search != "" {
		where = append(where, fmt.Sprintf("(name ILIKE $%d OR sku ILIKE $%d)", argN, argN))
		args = append(args, "%"+f.Search+"%")
		argN++
	}
	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}
	var total int
	if err := r.db.Get(&total, "SELECT COUNT(*) FROM products "+whereClause, args...); err != nil {
		return nil, 0, err
	}
	offset := (f.Page - 1) * f.PageSize
	sortDir := "DESC"
	if strings.ToLower(f.SortDir) == "asc" {
		sortDir = "ASC"
	}
	q := fmt.Sprintf("SELECT * FROM products %s ORDER BY %s %s LIMIT $%d OFFSET $%d",
		whereClause,
		mapSortCol(f.SortBy, map[string]string{
			"name": "name", "sku": "sku", "status": "status", "created_at": "created_at",
		}), sortDir, argN, argN+1)
	args = append(args, f.PageSize, offset)
	var products []model.Product
	if err := r.db.Select(&products, q, args...); err != nil {
		return nil, 0, err
	}
	return products, total, nil
}

func (r *Repo) GetProductByID(id string) (*model.Product, error) {
	var p model.Product
	if err := r.db.Get(&p, "SELECT * FROM products WHERE id = $1", id); err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repo) CreateProduct(p *model.Product) error {
	q := `INSERT INTO products (name, sku, category, is_cobranded, cobrand_partner, status, store_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at, updated_at`
	return r.db.QueryRowx(q,
		p.Name, p.SKU, p.Category, p.IsCobranded, p.CobrandPartner, p.Status, p.StoreID,
	).StructScan(p)
}

func (r *Repo) UpdateProduct(p *model.Product) error {
	q := `UPDATE products SET name = $1, category = $2, is_cobranded = $3, cobrand_partner = $4, status = $5, store_id = $6, updated_at = NOW()
		WHERE id = $7 RETURNING updated_at`
	return r.db.QueryRowx(q,
		p.Name, p.Category, p.IsCobranded, p.CobrandPartner, p.Status, p.StoreID, p.ID,
	).StructScan(p)
}

func (r *Repo) GetInventory(storeID, productID string) (*model.InventoryRecord, error) {
	var inv model.InventoryRecord
	if err := r.db.Get(&inv, "SELECT * FROM inventory_records WHERE store_id = $1 AND product_id = $2", storeID, productID); err != nil {
		return nil, err
	}
	return &inv, nil
}

func (r *Repo) ListInventory(f model.ListFilter) ([]model.InventoryRecord, int, error) {
	var where []string
	var args []interface{}
	argN := 1
	if f.StoreID != "" {
		where = append(where, fmt.Sprintf("ir.store_id = $%d", argN))
		args = append(args, f.StoreID)
		argN++
	}
	if f.Search != "" {
		where = append(where, fmt.Sprintf("(p.name ILIKE $%d OR p.sku ILIKE $%d)", argN, argN))
		args = append(args, "%"+f.Search+"%")
		argN++
	}
	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}
	var total int
	if err := r.db.Get(&total, "SELECT COUNT(*) FROM inventory_records ir JOIN products p ON p.id = ir.product_id "+whereClause, args...); err != nil {
		return nil, 0, err
	}
	offset := (f.Page - 1) * f.PageSize
	q := fmt.Sprintf(`SELECT ir.* FROM inventory_records ir
		JOIN products p ON p.id = ir.product_id
		%s ORDER BY ir.updated_at DESC LIMIT $%d OFFSET $%d`,
		whereClause, argN, argN+1)
	args = append(args, f.PageSize, offset)
	var records []model.InventoryRecord
	if err := r.db.Select(&records, q, args...); err != nil {
		return nil, 0, err
	}
	return records, total, nil
}

func (r *Repo) UpsertInventory(inv *model.InventoryRecord) error {
	q := `INSERT INTO inventory_records (store_id, product_id, quantity, system_quantity, last_checked_at)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (store_id, product_id) DO UPDATE
		SET quantity = $3, system_quantity = $4, last_checked_at = $5, updated_at = NOW()
		RETURNING id, created_at, updated_at`
	return r.db.QueryRowx(q,
		inv.StoreID, inv.ProductID, inv.Quantity, inv.SystemQty, inv.LastCheckedAt,
	).StructScan(inv)
}

func (r *Repo) ListReplenishmentOrders(f model.ListFilter) ([]model.ReplenishmentOrder, int, error) {
	var where []string
	var args []interface{}
	argN := 1
	if f.StoreID != "" {
		where = append(where, fmt.Sprintf("ro.store_id = $%d", argN))
		args = append(args, f.StoreID)
		argN++
	}
	if f.Status != "" {
		where = append(where, fmt.Sprintf("ro.status = $%d", argN))
		args = append(args, f.Status)
		argN++
	}
	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}
	var total int
	if err := r.db.Get(&total, "SELECT COUNT(*) FROM replenishment_orders ro "+whereClause, args...); err != nil {
		return nil, 0, err
	}
	offset := (f.Page - 1) * f.PageSize
	q := fmt.Sprintf(`SELECT ro.*, s.name as store_name, u.display_name as creator_name
		FROM replenishment_orders ro
		JOIN stores s ON s.id = ro.store_id
		JOIN users u ON u.id = ro.created_by_id
		%s ORDER BY ro.created_at DESC LIMIT $%d OFFSET $%d`,
		whereClause, argN, argN+1)
	args = append(args, f.PageSize, offset)
	var orders []model.ReplenishmentOrder
	if err := r.db.Select(&orders, q, args...); err != nil {
		return nil, 0, err
	}
	return orders, total, nil
}

func (r *Repo) GetReplenishmentOrderByID(id string) (*model.ReplenishmentOrder, error) {
	var o model.ReplenishmentOrder
	q := `SELECT ro.*, s.name as store_name, u.display_name as creator_name
		FROM replenishment_orders ro
		JOIN stores s ON s.id = ro.store_id
		JOIN users u ON u.id = ro.created_by_id
		WHERE ro.id = $1`
	if err := r.db.Get(&o, q, id); err != nil {
		return nil, err
	}
	return &o, nil
}

func (r *Repo) CreateReplenishmentOrder(o *model.ReplenishmentOrder) error {
	q := `INSERT INTO replenishment_orders (store_id, created_by_id, status, notes)
		VALUES ($1, $2, $3, $4) RETURNING id, created_at, updated_at`
	return r.db.QueryRowx(q, o.StoreID, o.CreatedByID, o.Status, o.Notes).StructScan(o)
}

func (r *Repo) UpdateReplenishmentOrderStatus(id, status string) error {
	_, err := r.db.Exec("UPDATE replenishment_orders SET status = $1, updated_at = NOW() WHERE id = $2", status, id)
	return err
}

func (r *Repo) CreateReplenishmentItem(item *model.ReplenishmentItem) error {
	q := `INSERT INTO replenishment_items (order_id, product_id, requested_qty, approved_qty, received_qty)
		VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`
	return r.db.QueryRowx(q,
		item.OrderID, item.ProductID, item.RequestedQty, item.ApprovedQty, item.ReceivedQty,
	).StructScan(item)
}

func (r *Repo) ListReplenishmentItems(orderID string) ([]model.ReplenishmentItem, error) {
	var items []model.ReplenishmentItem
	q := `SELECT ri.*, p.name as product_name, p.sku as product_sku
		FROM replenishment_items ri
		JOIN products p ON p.id = ri.product_id
		WHERE ri.order_id = $1 ORDER BY ri.created_at ASC`
	if err := r.db.Select(&items, q, orderID); err != nil {
		return nil, err
	}
	return items, nil
}

func (r *Repo) ListTransferOrders(f model.ListFilter) ([]model.TransferOrder, int, error) {
	var where []string
	var args []interface{}
	argN := 1
	if f.StoreID != "" {
		where = append(where, fmt.Sprintf("(to.from_store_id = $%d OR to.to_store_id = $%d)", argN, argN))
		args = append(args, f.StoreID)
		argN++
	}
	if f.Status != "" {
		where = append(where, fmt.Sprintf("to.status = $%d", argN))
		args = append(args, f.Status)
		argN++
	}
	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}
	var total int
	if err := r.db.Get(&total, "SELECT COUNT(*) FROM transfer_orders to "+whereClause, args...); err != nil {
		return nil, 0, err
	}
	offset := (f.Page - 1) * f.PageSize
	q := fmt.Sprintf(`SELECT to.*, sf.name as from_store_name, st.name as to_store_name, u.display_name as creator_name
		FROM transfer_orders to
		JOIN stores sf ON sf.id = to.from_store_id
		JOIN stores st ON st.id = to.to_store_id
		JOIN users u ON u.id = to.created_by_id
		%s ORDER BY to.created_at DESC LIMIT $%d OFFSET $%d`,
		whereClause, argN, argN+1)
	args = append(args, f.PageSize, offset)
	var orders []model.TransferOrder
	if err := r.db.Select(&orders, q, args...); err != nil {
		return nil, 0, err
	}
	return orders, total, nil
}

func (r *Repo) GetTransferOrderByID(id string) (*model.TransferOrder, error) {
	var o model.TransferOrder
	q := `SELECT to.*, sf.name as from_store_name, st.name as to_store_name, u.display_name as creator_name
		FROM transfer_orders to
		JOIN stores sf ON sf.id = to.from_store_id
		JOIN stores st ON st.id = to.to_store_id
		JOIN users u ON u.id = to.created_by_id
		WHERE to.id = $1`
	if err := r.db.Get(&o, q, id); err != nil {
		return nil, err
	}
	return &o, nil
}

func (r *Repo) CreateTransferOrder(o *model.TransferOrder) error {
	q := `INSERT INTO transfer_orders (from_store_id, to_store_id, created_by_id, status, notes)
		VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at, updated_at`
	return r.db.QueryRowx(q, o.FromStoreID, o.ToStoreID, o.CreatedByID, o.Status, o.Notes).StructScan(o)
}

func (r *Repo) UpdateTransferOrderStatus(id, status string) error {
	_, err := r.db.Exec("UPDATE transfer_orders SET status = $1, updated_at = NOW() WHERE id = $2", status, id)
	return err
}

func (r *Repo) CreateTransferItem(item *model.TransferItem) error {
	q := `INSERT INTO transfer_items (order_id, product_id, quantity)
		VALUES ($1, $2, $3) RETURNING id, created_at`
	return r.db.QueryRowx(q, item.OrderID, item.ProductID, item.Quantity).StructScan(item)
}

func (r *Repo) ListTransferItems(orderID string) ([]model.TransferItem, error) {
	var items []model.TransferItem
	q := `SELECT ti.*, p.name as product_name, p.sku as product_sku
		FROM transfer_items ti
		JOIN products p ON p.id = ti.product_id
		WHERE ti.order_id = $1 ORDER BY ti.created_at ASC`
	if err := r.db.Select(&items, q, orderID); err != nil {
		return nil, err
	}
	return items, nil
}

func (r *Repo) ListMemberRedemptions(f model.ListFilter) ([]model.MemberRedemption, int, error) {
	var where []string
	var args []interface{}
	argN := 1
	if f.StoreID != "" {
		where = append(where, fmt.Sprintf("mr.store_id = $%d", argN))
		args = append(args, f.StoreID)
		argN++
	}
	if f.Status != "" {
		where = append(where, fmt.Sprintf("mr.status = $%d", argN))
		args = append(args, f.Status)
		argN++
	}
	if f.Search != "" {
		where = append(where, fmt.Sprintf("mr.member_phone ILIKE $%d", argN))
		args = append(args, "%"+f.Search+"%")
		argN++
	}
	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}
	var total int
	if err := r.db.Get(&total, "SELECT COUNT(*) FROM member_redemptions mr "+whereClause, args...); err != nil {
		return nil, 0, err
	}
	offset := (f.Page - 1) * f.PageSize
	q := fmt.Sprintf(`SELECT mr.*, p.name as product_name, s.name as store_name, u.display_name as fulfilled_by_name
		FROM member_redemptions mr
		JOIN products p ON p.id = mr.product_id
		JOIN stores s ON s.id = mr.store_id
		LEFT JOIN users u ON u.id = mr.fulfilled_by_id
		%s ORDER BY mr.created_at DESC LIMIT $%d OFFSET $%d`,
		whereClause, argN, argN+1)
	args = append(args, f.PageSize, offset)
	var redemptions []model.MemberRedemption
	if err := r.db.Select(&redemptions, q, args...); err != nil {
		return nil, 0, err
	}
	return redemptions, total, nil
}

func (r *Repo) CreateMemberRedemption(mr *model.MemberRedemption) error {
	q := `INSERT INTO member_redemptions (member_phone, product_id, store_id, quantity, status)
		VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at, updated_at`
	return r.db.QueryRowx(q, mr.MemberPhone, mr.ProductID, mr.StoreID, mr.Quantity, mr.Status).StructScan(mr)
}

func (r *Repo) FulfillMemberRedemption(id, fulfilledBy, status string) error {
	q := `UPDATE member_redemptions SET status = $1, fulfilled_by_id = $2, fulfilled_at = NOW(), updated_at = NOW()
		WHERE id = $3`
	_, err := r.db.Exec(q, status, fulfilledBy, id)
	return err
}

func (r *Repo) CreateAuditLog(log *model.AuditLog) error {
	q := `INSERT INTO audit_logs (entity_type, entity_id, action, old_value, new_value, operator_id, operator_name, note)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, created_at`
	return r.db.QueryRowx(q,
		log.EntityType, log.EntityID, log.Action, log.OldValue, log.NewValue, log.OperatorID, log.OperatorName, log.Note,
	).StructScan(log)
}

func (r *Repo) ListAuditLogs(entityType, entityID string, f model.ListFilter) ([]model.AuditLog, int, error) {
	var where []string
	var args []interface{}
	argN := 1
	if entityType != "" {
		where = append(where, fmt.Sprintf("entity_type = $%d", argN))
		args = append(args, entityType)
		argN++
	}
	if entityID != "" {
		where = append(where, fmt.Sprintf("entity_id = $%d", argN))
		args = append(args, entityID)
		argN++
	}
	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}
	var total int
	if err := r.db.Get(&total, "SELECT COUNT(*) FROM audit_logs "+whereClause, args...); err != nil {
		return nil, 0, err
	}
	offset := (f.Page - 1) * f.PageSize
	q := fmt.Sprintf("SELECT * FROM audit_logs %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d",
		whereClause, argN, argN+1)
	args = append(args, f.PageSize, offset)
	var logs []model.AuditLog
	if err := r.db.Select(&logs, q, args...); err != nil {
		return nil, 0, err
	}
	return logs, total, nil
}

func (r *Repo) GetInspectionItemCountByStatus(inspectionID string) (open int, total int, err error) {
	q := `SELECT COUNT(*) as total,
		COUNT(*) FILTER (WHERE status = 'open') as open
		FROM inspection_items WHERE inspection_id = $1`
	err = r.db.QueryRowx(q, inspectionID).Scan(&total, &open)
	return
}

func toJSONString(v interface{}) *string {
	if v == nil {
		return nil
	}
	b, err := json.Marshal(v)
	if err != nil {
		return nil
	}
	s := string(b)
	return &s
}

func mapSortCol(sortBy string, allowed map[string]string) string {
	if col, ok := allowed[sortBy]; ok {
		return col
	}
	return allowed["created_at"]
}

func (r *Repo) GetRectificationByInspectionItem(itemID string) (*model.Rectification, error) {
	var rect model.Rectification
	q := `SELECT r.*, ua.display_name as assignee_name, uv.display_name as verifier_name, s.name as store_name
		FROM rectifications r
		LEFT JOIN users ua ON ua.id = r.assignee_id
		LEFT JOIN users uv ON uv.id = r.verifier_id
		JOIN stores s ON s.id = r.store_id
		WHERE r.inspection_item_id = $1`
	if err := r.db.Get(&rect, q, itemID); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &rect, nil
}
