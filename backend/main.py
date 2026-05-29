from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

DATA_FILE = 'data.json'

def init_data():
    if not os.path.exists(DATA_FILE):
        data = {
            'workOrders': [
                {
                    'id': 'WO202401001',
                    'customer': '张三汽修',
                    'carModel': '大众帕萨特',
                    'carNumber': '京A12345',
                    'items': [
                        {'name': '前刹车片', 'model': 'FV3456', 'qty': 2, 'price': 280},
                        {'name': '机油滤芯', 'model': 'JX0810', 'qty': 1, 'price': 45}
                    ],
                    'totalAmount': 605,
                    'status': 'pending',
                    'createTime': '2024-01-15 09:30:00',
                    'handler': '李销售',
                    'remark': '客户下午来取'
                },
                {
                    'id': 'WO202401002',
                    'customer': '旺达维修中心',
                    'carModel': '丰田凯美瑞',
                    'carNumber': '京B67890',
                    'items': [
                        {'name': '空气滤芯', 'model': 'LX2841', 'qty': 1, 'price': 65},
                        {'name': '火花塞', 'model': 'SK20R11', 'qty': 4, 'price': 85}
                    ],
                    'totalAmount': 405,
                    'status': 'rejected',
                    'createTime': '2024-01-15 10:15:00',
                    'handler': '王销售',
                    'remark': '型号不符',
                    'rejectReason': '空气滤芯型号不对，需要更换型号为LX2842'
                },
                {
                    'id': 'WO202401003',
                    'customer': '诚信汽修厂',
                    'carModel': '本田雅阁',
                    'carNumber': '京C11111',
                    'items': [
                        {'name': '变速箱油', 'model': 'ATF-DW1', 'qty': 4, 'price': 120}
                    ],
                    'totalAmount': 480,
                    'status': 'review',
                    'createTime': '2024-01-15 14:20:00',
                    'handler': '赵销售',
                    'remark': '需核对库存'
                }
            ],
            'outbounds': [
                {
                    'id': 'OB202401001',
                    'workOrderId': 'WO202401001',
                    'customer': '张三汽修',
                    'items': [
                        {'name': '前刹车片', 'model': 'FV3456', 'qty': 2, 'price': 280, 'actualQty': 2},
                        {'name': '机油滤芯', 'model': 'JX0810', 'qty': 1, 'price': 45, 'actualQty': 1}
                    ],
                    'totalAmount': 605,
                    'actualAmount': 605,
                    'status': 'reconciled',
                    'createTime': '2024-01-15 11:00:00',
                    'warehouse': '主仓库',
                    'operator': '库管A'
                }
            ]
        }
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

def load_data():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.route('/api/stats/dashboard', methods=['GET'])
def get_dashboard_stats():
    data = load_data()
    workOrders = data['workOrders']
    outbounds = data['outbounds']
    
    return jsonify({
        'pendingWorkOrders': len([o for o in workOrders if o['status'] == 'pending']),
        'rejectedWorkOrders': len([o for o in workOrders if o['status'] == 'rejected']),
        'reviewWorkOrders': len([o for o in workOrders if o['status'] == 'review']),
        'pendingOutbounds': len([o for o in outbounds if o['status'] == 'pending'])
    })

@app.route('/api/workorder', methods=['GET'])
def get_workorders():
    data = load_data()
    return jsonify(data['workOrders'])

@app.route('/api/workorder/<id>', methods=['GET'])
def get_workorder(id):
    data = load_data()
    order = next((o for o in data['workOrders'] if o['id'] == id), None)
    if order:
        return jsonify(order)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/workorder', methods=['POST'])
def create_workorder():
    data = load_data()
    order = request.json
    order['id'] = f"WO{datetime.now().strftime('%Y%m%d%H%M%S')}"
    order['createTime'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    order['status'] = 'pending'
    data['workOrders'].append(order)
    save_data(data)
    return jsonify(order)

@app.route('/api/workorder/<id>/approve', methods=['POST'])
def approve_workorder(id):
    data = load_data()
    for order in data['workOrders']:
        if order['id'] == id:
            order['status'] = 'approved'
            save_data(data)
            return jsonify(order)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/workorder/<id>/reject', methods=['POST'])
def reject_workorder(id):
    data = load_data()
    for order in data['workOrders']:
        if order['id'] == id:
            order['status'] = 'rejected'
            order['rejectReason'] = request.json.get('reason', '')
            save_data(data)
            return jsonify(order)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/workorder/<id>/review', methods=['POST'])
def review_workorder(id):
    data = load_data()
    for order in data['workOrders']:
        if order['id'] == id:
            order['status'] = 'review'
            order['reviewNote'] = request.json.get('note', '')
            save_data(data)
            return jsonify(order)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/outbound', methods=['GET'])
def get_outbounds():
    data = load_data()
    return jsonify(data['outbounds'])

@app.route('/api/outbound/<id>', methods=['GET'])
def get_outbound(id):
    data = load_data()
    outbound = next((o for o in data['outbounds'] if o['id'] == id), None)
    if outbound:
        return jsonify(outbound)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/outbound', methods=['POST'])
def create_outbound():
    data = load_data()
    outbound = request.json
    outbound['id'] = f"OB{datetime.now().strftime('%Y%m%d%H%M%S')}"
    outbound['createTime'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    outbound['status'] = 'pending'
    data['outbounds'].append(outbound)
    save_data(data)
    return jsonify(outbound)

@app.route('/api/outbound/<id>/reconcile', methods=['POST'])
def reconcile_outbound(id):
    data = load_data()
    for outbound in data['outbounds']:
        if outbound['id'] == id:
            outbound['status'] = 'reconciled'
            save_data(data)
            return jsonify(outbound)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/outbound/<id>/return', methods=['POST'])
def return_outbound(id):
    data = load_data()
    for outbound in data['outbounds']:
        if outbound['id'] == id:
            outbound['hasReturn'] = True
            if 'returnItems' not in outbound:
                outbound['returnItems'] = []
            outbound['returnItems'].append(request.json)
            save_data(data)
            return jsonify(outbound)
    return jsonify({'error': 'Not found'}), 404

if __name__ == '__main__':
    init_data()
    app.run(host='0.0.0.0', port=8080, debug=True)
