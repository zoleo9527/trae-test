import urllib.request
import json

def get(url):
    with urllib.request.urlopen(url) as r:
        return json.loads(r.read())

def print_logs(appeal_id, appeal):
    print(f"\n{'='*60}")
    print(f"申诉 {appeal_id} ({appeal['merchant_name']})")
    print(f"  状态: {appeal['status']} | 原因: {appeal['reason']}")
    print(f"  补贴金额: {appeal.get('subsidy_amount')}")
    print(f"{'='*60}")
    
    logs = get(f'http://localhost:8000/api/operation-logs?appeal_id={appeal_id}')
    print(f"  关联操作日志数量: {logs['total']}")
    
    for log in logs['data']:
        time_str = log['created_at'][5:16].replace('T', ' ')
        appeal_checked = "✅" if log.get('appeal_id') else "❌"
        print(f"  {time_str} | {appeal_checked} {log['action']:20s} | {log['description']}")
        if log.get('new_value'):
            print(f"            → {log['new_value']}")
    
    expected_count = 1
    if appeal['status'] == 'approved':
        expected_count = 3
    if logs['total'] == expected_count:
        print(f"\n  ✅ 日志数量正确（预期 {expected_count} 条）")
    else:
        print(f"\n  ❌ 日志数量错误（预期 {expected_count} 条，实际 {logs['total']} 条）")
    
    all_have_appeal_id = all(log.get('appeal_id') == appeal_id for log in logs['data'])
    if all_have_appeal_id:
        print(f"  ✅ 所有日志都关联了正确的 appeal_id")
    else:
        print(f"  ❌ 存在日志未关联 appeal_id")

print("=== 1. 检查各状态申诉数量 ===")
stats = get('http://localhost:8000/api/dashboard/stats')
print(f"待处理: {stats['pending_appeals']}")
print(f"已通过: {stats['pending_appeals'] - stats['pending_appeals'] + len(get('http://localhost:8000/api/appeals?status=approved')['data'])}")
print(f"已驳回: {stats['rejected_appeals']}")
print(f"需回查: {stats['need_review']}")

print("\n=== 2. 检查已通过申诉的完整处理链路 ===")
approved = get('http://localhost:8000/api/appeals?status=approved&page_size=2')
for appeal in approved['data'][:2]:
    print_logs(appeal['id'], appeal)

print("\n=== 3. 检查已驳回申诉的处理链路 ===")
rejected = get('http://localhost:8000/api/appeals?status=rejected&page_size=2')
for appeal in rejected['data'][:2]:
    print_logs(appeal['id'], appeal)

print("\n=== 4. 检查需回查申诉的处理链路 ===")
need_review = get('http://localhost:8000/api/appeals?status=need_review&page_size=2')
for appeal in need_review['data'][:2]:
    print_logs(appeal['id'], appeal)

print("\n=== 5. 检查待处理申诉（应该没有日志） ===")
pending = get('http://localhost:8000/api/appeals?status=pending&page_size=1')
if pending['data']:
    appeal = pending['data'][0]
    logs = get(f'http://localhost:8000/api/operation-logs?appeal_id={appeal["id"]}')
    print(f"申诉 {appeal['id']} ({appeal['merchant_name']})")
    print(f"  关联操作日志数量: {logs['total']}")
    if logs['total'] == 0:
        print(f"  ✅ 待处理申诉没有操作日志（正确）")
    else:
        print(f"  ❌ 待处理申诉不应该有操作日志")

print("\n" + "="*60)
print("验证完成！")
print("="*60)
