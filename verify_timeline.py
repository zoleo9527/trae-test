import requests
import json

base = 'http://localhost:8000'
token = requests.post(f'{base}/token', data={'username': 'service', 'password': 'service123'}).json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

rolls = requests.get(f'{base}/api/film-rolls', headers=headers).json()['rolls']
for r in rolls:
    if r['registration_number'] in ['F001002', 'F001004']:
        print(f'=== {r["registration_number"]} {r["customer_name"]} ===')
        for h in r['history']:
            action = h.get('action', '')
            cat = 'process'
            if '异常' in action:
                cat = 'exception'
            elif '返工' in action:
                cat = 'rework'
            elif any(k in action for k in ['备注', '沟通', '事项']):
                cat = 'note'
            has_trans = '✓' if h.get('from_status') and h.get('to_status') else '✗'
            desc = h.get('description', '')[:40]
            print(f'  [{cat}] [{has_trans}] {action}: {desc}')
            if h.get('from_status'):
                print(f'      {h["from_status"]} -> {h["to_status"]}')
        print()
