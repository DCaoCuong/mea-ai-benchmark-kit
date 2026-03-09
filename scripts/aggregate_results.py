import json
import os

files = [
    r"d:\Senlyzer\agent_skill_kits\plan\right_report\stt-benchmark-2026-03-08T11-44-23.json",
    r"d:\Senlyzer\agent_skill_kits\plan\right_report\stt-benchmark-2026-03-08T13-31-30.json",
    r"d:\Senlyzer\agent_skill_kits\plan\right_report\stt-benchmark-2026-03-08T15-00-43.json",
    r"d:\Senlyzer\agent_skill_kits\plan\right_report\stt-benchmark-2026-03-08T16-17-48.json"
]

all_data = []

for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as jf:
            data = json.load(jf)
            for r in data['results']:
                all_data.append({
                    'engine': r['engine'],
                    'variant': r['variant'],
                    'scenario': r['scenarioId'],
                    'wer': r['summary']['avgWer'],
                    'rtf': r['summary']['avgRtf'],
                    'latency': r['summary']['avgLatencyMs'],
                    'med_term': r['summary']['avgMedicalTermAccuracy'],
                    'errors': r['summary']['errorRate']
                })
    except Exception as e:
        print(f"Error reading {f}: {e}")

# Aggregate per engine/variant
aggregated = {}
for entry in all_data:
    key = (entry['engine'], entry['variant'])
    if key not in aggregated:
        aggregated[key] = {
            'wer': [],
            'rtf': [],
            'latency': [],
            'med_term': [],
            'errors': []
        }
    aggregated[key]['wer'].append(entry['wer'])
    aggregated[key]['rtf'].append(entry['rtf'])
    aggregated[key]['latency'].append(entry['latency'])
    aggregated[key]['med_term'].append(entry['med_term'])
    aggregated[key]['errors'].append(entry['errors'])

final_comparison = []
for key, values in aggregated.items():
    n = len(values['wer'])
    final_comparison.append({
        'engine': key[0],
        'variant': key[1],
        'avg_wer': sum(values['wer']) / n if n > 0 else 0,
        'avg_rtf': sum(values['rtf']) / n if n > 0 else 0,
        'avg_latency': sum(values['latency']) / n if n > 0 else 0,
        'avg_med_term': sum(values['med_term']) / n if n > 0 else 0,
        'avg_errors': sum(values['errors']) / n if n > 0 else 0
    })

print(json.dumps(final_comparison, indent=2))
