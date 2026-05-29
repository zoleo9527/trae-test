import urllib.request
import json

def get(url):
    with urllib.request.urlopen(url) as r:
        return json.loads(r.read())

def post(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

print("="*70)
print("验证历史申诉抽屉内完整回查上下文")
print("="*70)

# 1. 测试需回查申诉
print("\n" + "="*70)
print("1. 检查需回查申诉")
print("="*70)
need_review = get('http://localhost:8000/api/appeals?status=need_review&page_size=1')
if need_review['data']:
    appeal = need_review['data'][0]
    appeal_id = appeal['id']
    print(f"\n申诉 ID: {appeal_id}")
    print(f"商家: {appeal['merchant_name']}")
    print(f"原因: {appeal['reason']}")
    print(f"状态: {appeal['status']}")
    print(f"处理人: {appeal['processor']}")
    print(f"处理时间: {appeal['processed_at']}")
    print(f"处理备注: {appeal['process_note']}")
    
    if appeal['process_note']:
        print("  ✅ 处理备注已补齐")
    else:
        print("  ❌ 处理备注为空")
    
    print(f"\n--- 操作留痕 ---")
    logs = get(f'http://localhost:8000/api/operation-logs?appeal_id={appeal_id}')
    print(f"关联日志数量: {logs['total']}")
    for log in logs['data']:
        time_str = log['created_at'][5:16].replace('T', ' ')
        print(f"  {time_str} | {log['action']}")
        print(f"         {log['description']}")
        if '处理结论' in log['description']:
            print("         ✅ 包含处理结论")
        else:
            print("         ❌ 缺少处理结论")

# 2. 测试已驳回申诉
print("\n" + "="*70)
print("2. 检查已驳回申诉")
print("="*70)
rejected = get('http://localhost:8000/api/appeals?status=rejected&page_size=1')
if rejected['data']:
    appeal = rejected['data'][0]
    appeal_id = appeal['id']
    print(f"\n申诉 ID: {appeal_id}")
    print(f"商家: {appeal['merchant_name']}")
    print(f"原因: {appeal['reason']}")
    print(f"状态: {appeal['status']}")
    print(f"处理人: {appeal['processor']}")
    print(f"处理时间: {appeal['processed_at']}")
    print(f"处理备注: {appeal['process_note']}")
    
    if appeal['process_note']:
        print("  ✅ 处理备注已补齐")
    else:
        print("  ❌ 处理备注为空")
    
    print(f"\n--- 操作留痕 ---")
    logs = get(f'http://localhost:8000/api/operation-logs?appeal_id={appeal_id}')
    print(f"关联日志数量: {logs['total']}")
    for log in logs['data']:
        time_str = log['created_at'][5:16].replace('T', ' ')
        print(f"  {time_str} | {log['action']}")
        print(f"         {log['description']}")
        if '处理结论' in log['description']:
            print("         ✅ 包含处理结论")
        else:
            print("         ❌ 缺少处理结论")

# 3. 测试已通过申诉
print("\n" + "="*70)
print("3. 检查已通过申诉（完整链路）")
print("="*70)
approved = get('http://localhost:8000/api/appeals?status=approved&page_size=1')
if approved['data']:
    appeal = approved['data'][0]
    appeal_id = appeal['id']
    print(f"\n申诉 ID: {appeal_id}")
    print(f"商家: {appeal['merchant_name']}")
    print(f"原因: {appeal['reason']}")
    print(f"状态: {appeal['status']}")
    print(f"处理人: {appeal['processor']}")
    print(f"处理时间: {appeal['processed_at']}")
    print(f"处理备注: {appeal['process_note']}")
    print(f"补贴金额: {appeal['subsidy_amount']}")
    
    if appeal['process_note']:
        print("  ✅ 处理备注已补齐")
    else:
        print("  ❌ 处理备注为空")
    
    print(f"\n--- 操作留痕 ---")
    logs = get(f'http://localhost:8000/api/operation-logs?appeal_id={appeal_id}')
    print(f"关联日志数量: {logs['total']}")
    for log in logs['data']:
        time_str = log['created_at'][5:16].replace('T', ' ')
        print(f"  {time_str} | {log['action']}")
        print(f"         {log['description']}")
        if '处理结论' in log['description']:
            print("         ✅ 包含处理结论")
        else:
            print("         ❌ 缺少处理结论")
    
    # 验证三者一致性
    print(f"\n--- 一致性验证 ---")
    status_map = {
        'approved': '已通过',
        'rejected': '已驳回',
        'need_review': '需回查',
        'pending': '待处理'
    }
    
    # 1. 申诉状态
    appeal_status_text = status_map.get(appeal['status'], appeal['status'])
    print(f"申诉状态: {appeal['status']} ({appeal_status_text})")
    
    # 2. 处理记录
    has_process_note = bool(appeal['process_note'])
    has_processor = bool(appeal['processor'])
    has_processed_at = bool(appeal['processed_at'])
    print(f"处理记录: 备注={'✅' if has_process_note else '❌'}, 处理人={'✅' if has_processor else '❌'}, 时间={'✅' if has_processed_at else '❌'}")
    
    # 3. 操作日志
    has_logs = logs['total'] > 0
    logs_match_status = all(log.get('appeal_id') == appeal_id for log in logs['data'])
    print(f"操作日志: 存在={'✅' if has_logs else '❌'}, 关联正确={'✅' if logs_match_status else '❌'}")
    
    if has_process_note and has_processor and has_processed_at and has_logs and logs_match_status:
        print("\n  ✅ 三者（申诉状态、处理记录、操作日志）一致，回查上下文完整！")
    else:
        print("\n  ❌ 存在不一致问题")

# 4. 测试新处理一个申诉，验证实时处理日志
print("\n" + "="*70)
print("4. 测试实时处理申诉（验证操作日志包含结论）")
print("="*70)
pending = get('http://localhost:8000/api/appeals?status=pending&page_size=1')
if pending['data']:
    appeal = pending['data'][0]
    appeal_id = appeal['id']
    print(f"\n处理申诉: {appeal_id} ({appeal['merchant_name']})")
    print(f"原状态: {appeal['status']}")
    
    result = post(f'http://localhost:8000/api/appeals/{appeal_id}/process', {
        'status': 'approved',
        'process_note': '实时测试：情况属实，同意补贴25元',
        'subsidy_amount': 25.0
    })
    
    print(f"\n处理结果: 状态={result['status']}, 补贴={result['subsidy_amount']}")
    print(f"处理备注: {result['process_note']}")
    
    print(f"\n--- 新生成的操作留痕 ---")
    logs = get(f'http://localhost:8000/api/operation-logs?appeal_id={appeal_id}')
    print(f"关联日志数量: {logs['total']}")
    for log in logs['data']:
        time_str = log['created_at'][5:16].replace('T', ' ')
        print(f"  {time_str} | {log['action']}")
        print(f"         {log['description']}")
        if '处理结论' in log['description'] and '实时测试' in log['description']:
            print("         ✅ 包含处理结论，与处理备注一致")
        elif '处理结论' in log['description']:
            print("         ✅ 包含处理结论")
        else:
            print("         ❌ 缺少处理结论")

print("\n" + "="*70)
print("验证完成！")
print("="*70)
