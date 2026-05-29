#!/usr/bin/env python3
import urllib.request
import json

def api(path, token=None):
    req = urllib.request.Request(f'http://localhost:9000/api{path}')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())

def post(path, data, token=None):
    req = urllib.request.Request(
        f'http://localhost:9000/api{path}',
        data=json.dumps(data).encode(),
        headers={'Content-Type': 'application/json'}
    )
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())

token = post('/login/', {'username': 'boss', 'password': '123456'})['access']

orders = api('/orders/', token)

def analyze_order(order_id, expected_status, scenario_name):
    detail = api(f'/orders/{order_id}/', token)
    print(f'\n{"=" * 60}')
    print(f'  {scenario_name}: {detail["order_no"]} | {detail["customer_name"]}')
    print(f'  当前状态: {detail["status_display"]}')
    print(f'{"=" * 60}')

    print(f'  状态日志链:')
    for log in reversed(detail['status_logs']):
        from_s = log['from_status_display'] or '创建'
        print(f'    {from_s:8s} → {log["to_status_display"]:8s} | {log["operator_name"]} | {log["remark"]}')

    print(f'\n  预期步骤序列:')

    expected = []
    status_logs = detail['status_logs']
    current_status = detail['status']
    has_payment = any(l['to_status'] in ['PAID_PARTIAL', 'PAID'] for l in status_logs)
    is_return_flow = current_status in ['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_REJECTED']

    return_request_log = next((l for l in status_logs if l['to_status'] == 'RETURN_REQUESTED'), None)
    return_from_status = return_request_log['from_status'] if return_request_log else None

    return_approved_log = next((l for l in status_logs if l['to_status'] == 'RETURN_APPROVED'), None)
    return_rejected_log = next((l for l in status_logs if l['to_status'] == 'RETURN_REJECTED'), None)

    normal_steps = [
        ('INQUIRY', '创建询价'),
        ('INQUIRY_APPROVED', '确认询价'),
        ('LOCKED', '锁库'),
        ('DELIVERED', '出库'),
        ('SETTLED', '结算'),
    ]

    steps = []
    active_idx = -1

    status_order = ['INQUIRY', 'INQUIRY_APPROVED', 'LOCKED', 'DELIVERED', 'SETTLED']

    for i, (match_status, title) in enumerate(normal_steps):
        log = next((l for l in status_logs if l['to_status'] == match_status), None)
        if is_return_flow:
            if not log:
                continue
            return_from_idx = status_order.index(return_from_status) if return_from_status else 999
            def_idx = status_order.index(match_status)
            is_completed = def_idx <= return_from_idx
            steps.append({
                'title': title,
                'statusText': '完成' if is_completed else '待处理',
                'type': 'success' if is_completed else 'info',
                'from_status': log.get('from_status_display') if log else None,
                'operator': log.get('operator_name') if log else None,
                'remark': log.get('remark') if log else None,
            })
        else:
            def_idx = status_order.index(match_status)
            current_idx = status_order.index(current_status) if current_status in status_order else 999
            is_completed = log is not None and (
                current_idx > def_idx
                or (current_idx == def_idx and current_status == 'SETTLED')
                or current_status in ['PAID_PARTIAL', 'PAID']
            )
            is_current = match_status == current_status and match_status in ['INQUIRY', 'INQUIRY_APPROVED', 'LOCKED', 'DELIVERED']
            steps.append({
                'title': title,
                'statusText': '完成' if is_completed else '进行中' if is_current else '待处理',
                'type': 'success' if is_completed else 'warning' if is_current else 'info',
                'from_status': log.get('from_status_display') if log else None,
                'operator': log.get('operator_name') if log else None,
                'remark': log.get('remark') if log else None,
            })
            if is_current and active_idx == -1:
                active_idx = len(steps) - 1

    payment_log = next((l for l in status_logs if l['to_status'] in ['PAID_PARTIAL', 'PAID']), None)
    if payment_log:
        is_completed = payment_log['to_status'] == 'PAID'
        is_current = payment_log['to_status'] == 'PAID_PARTIAL'
        title = '已结清' if is_completed else '部分回款'
        steps.append({
            'title': title,
            'statusText': '完成' if is_completed else '进行中',
            'type': 'success' if is_completed else 'warning',
            'from_status': payment_log.get('from_status_display'),
            'operator': payment_log.get('operator_name'),
            'remark': payment_log.get('remark'),
        })
        if is_current and active_idx == -1:
            active_idx = len(steps) - 1
    elif not is_return_flow:
        is_completed = current_status == 'PAID'
        is_current = current_status in ['SETTLED', 'PAID_PARTIAL']
        steps.append({
            'title': '回款确认',
            'statusText': '完成' if is_completed else '进行中' if is_current else '待处理',
            'type': 'success' if is_completed else 'warning' if is_current else 'info',
            'from_status': None,
            'operator': None,
            'remark': None,
        })
        if is_current and active_idx == -1:
            active_idx = len(steps) - 1

    if is_return_flow:
        steps.append({
            'title': '退货申请',
            'statusText': '进行中' if current_status == 'RETURN_REQUESTED' else '完成',
            'type': 'warning' if current_status == 'RETURN_REQUESTED' else 'success',
            'from_status': return_request_log.get('from_status_display') if return_request_log else None,
            'operator': return_request_log.get('operator_name') if return_request_log else None,
            'remark': return_request_log.get('remark') if return_request_log else None,
        })
        if current_status == 'RETURN_REQUESTED' and active_idx == -1:
            active_idx = len(steps) - 1

        if current_status in ['RETURN_APPROVED', 'RETURN_REJECTED']:
            log = return_approved_log if current_status == 'RETURN_APPROVED' else return_rejected_log
            title = '退货已批准' if current_status == 'RETURN_APPROVED' else '退货已驳回'
            steps.append({
                'title': title,
                'statusText': '完成',
                'type': 'success',
                'from_status': log.get('from_status_display') if log else None,
                'operator': log.get('operator_name') if log else None,
                'remark': log.get('remark') if log else None,
            })

    if active_idx == -1:
        active_idx = len(steps) - 1

    for i, step in enumerate(steps):
        marker = ' 🔴' if i == active_idx else ''
        status_icon = '✅' if step['type'] == 'success' else '🟡' if step['type'] == 'warning' else '⚪'
        print(f'  {status_icon} Step {i+1}: {step["title"]:10s} | {step["statusText"]:4s} | {step["type"]:7s}{marker}')
        if step['operator']:
            from_s = f"  ← {step['from_status']}" if step['from_status'] else '  ← 创建'
            print(f'       {from_s} | {step["operator"]} | {step["remark"]}')

    print(f'\n  currentStep(高亮索引): {active_idx + 1}')

    all_ok = True
    for i, step in enumerate(steps):
        if i < active_idx and step['type'] != 'success':
            print(f'  ❌ 错误: 步骤{i+1}({step["title"]})应该已完成但显示为{step["statusText"]}')
            all_ok = False
        if i == active_idx and step['type'] not in ['warning', 'success']:
            print(f'  ❌ 错误: 当前步骤{i+1}({step["title"]})应该高亮但显示为{step["type"]}')
            all_ok = False
        if i > active_idx and step['type'] == 'success':
            print(f'  ❌ 错误: 步骤{i+1}({step["title"]})应该未完成但显示为{step["statusText"]}')
            all_ok = False

    if is_return_flow and has_payment and current_status in ['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_REJECTED']:
        payment_step = next((s for s in steps if s['title'] in ['部分回款', '已结清', '回款确认']), None)
        if payment_step and payment_step['type'] != 'success':
            print(f'  ❌ 错误: 回款节点应该显示为完成但显示为{payment_step["statusText"]}')
            all_ok = False

    if all_ok:
        print(f'\n  ✅ 流程追踪正确!')
    else:
        print(f'\n  ❌ 流程追踪存在错误!')

    return all_ok

print('\n' + '=' * 60)
print('场景1: 正常流程 - 部分回款')
print('=' * 60)
partial = [o for o in orders if o['status'] == 'PAID_PARTIAL'][0]
analyze_order(partial['id'], 'PAID_PARTIAL', '正常流程-部分回款')

print('\n' + '=' * 60)
print('场景2: 正常流程 - 已结清')
print('=' * 60)
paid = [o for o in orders if o['status'] == 'PAID'][0]
analyze_order(paid['id'], 'PAID', '正常流程-已结清')

print('\n' + '=' * 60)
print('场景3: 退货流程 - 退货申请中(从已结算发起)')
print('=' * 60)
return_req = [o for o in orders if o['status'] == 'RETURN_REQUESTED'][0]
analyze_order(return_req['id'], 'RETURN_REQUESTED', '退货流程-申请中')

print('\n' + '=' * 60)
print('场景4: 退货流程 - 退货已批准(从已结算发起)')
print('=' * 60)
return_app = [o for o in orders if o['status'] == 'RETURN_APPROVED'][0]
analyze_order(return_app['id'], 'RETURN_APPROVED', '退货流程-已批准')

print('\n' + '=' * 60)
print('场景5: 退货流程 - 退货已驳回(从已出库发起)')
print('=' * 60)
return_rej = [o for o in orders if o['status'] == 'RETURN_REJECTED'][0]
analyze_order(return_rej['id'], 'RETURN_REJECTED', '退货流程-已驳回')

print('\n' + '=' * 60)
print('场景6: 正常流程 - 已结算')
print('=' * 60)
settled = [o for o in orders if o['status'] == 'SETTLED' and float(o['unpaid_amount']) > 0 and not o.get('is_overdue')][0]
analyze_order(settled['id'], 'SETTLED', '正常流程-已结算')

print('\n' + '=' * 60)
print('场景7: 正常流程 - 已锁库')
print('=' * 60)
locked = [o for o in orders if o['status'] == 'LOCKED'][0]
analyze_order(locked['id'], 'LOCKED', '正常流程-已锁库')

print('\n\n' + '=' * 60)
print('✅ 所有场景验证完成!')
print('=' * 60)
