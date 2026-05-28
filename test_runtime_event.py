import requests, json

base = 'http://localhost:8000'

token_resp = requests.post(f'{base}/token', data={'username': 'tech', 'password': 'tech123'})
token = token_resp.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

rolls = requests.get(f'{base}/api/film-rolls', headers=headers).json()['rolls']
zhou = [r for r in rolls if r['registration_number'] == 'F001005'][0]
print(f"Before: {zhou['registration_number']} {zhou['customer_name']}, step={zhou['current_step']}, status={zhou['status']}")
print(f"  History count: {len(zhou['history'])}")
for h in zhou['history']:
    print(f"    [{h['action']}] {h['description'][:50]}")

resp = requests.patch(
    f"{base}/api/film-rolls/{zhou['id']}/status",
    headers=headers,
    json={
        'status': 'developing',
        'current_step': 1,
        'note': '推进到冲洗',
        'operator': '冲印师李四'
    }
)
updated = resp.json()
print(f"\nAfter step 1: step={updated['current_step']}, status={updated['status']}")
last = updated['history'][-1]
print(f"  action={last['action']}")
print(f"  description={last['description']}")
print(f"  from_status={last.get('from_status')}")
print(f"  to_status={last.get('to_status')}")

resp2 = requests.patch(
    f"{base}/api/film-rolls/{zhou['id']}/status",
    headers=headers,
    json={
        'status': 'scanning',
        'current_step': 2,
        'note': '推进到扫描',
        'operator': '冲印师李四'
    }
)
updated2 = resp2.json()
last2 = updated2['history'][-1]
print(f"\nAfter step 2:")
print(f"  action={last2['action']}")
print(f"  description={last2['description']}")
print(f"  from_status={last2.get('from_status')}")
print(f"  to_status={last2.get('to_status')}")
