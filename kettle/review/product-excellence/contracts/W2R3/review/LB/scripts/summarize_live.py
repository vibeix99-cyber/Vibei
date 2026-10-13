import json,sys,os
OUT='/home/user/Vibei/kettle/review/product-excellence/contracts/W2R3/review/LB'
def load(label,vp):
    p=f'{OUT}/live-{label}-{vp}.json'
    return json.load(open(p)) if os.path.exists(p) else None
def pill(s):
    r=[x for x in s['rewards'] if 'Badge:' in x['text'] and 'Warm' in x['text']]
    return r
def get(d):
    s=d['summary']
    pr=pill(s)
    pilltext=[l['text'] for l in s['leafText'] if l['text'].startswith('Badge:') and 'Warm' in l['text']]
    pillaria=[a['aria'] for a in s['ariaLabels'] if a['aria'].startswith('Warm')]
    live=[l['text'] for l in s['live'] if 'badge' in l['text'].lower()]
    liveEarly=[l['text'] for l in d['summaryEarly']['live']]
    statsname=[l['text'] for l in d['stats']['leafText'] if l['cls'].startswith('_badgeName') and 'Warm' in l['text']] if 'cls' in (d['stats']['leafText'][0] if d['stats']['leafText'] else {}) else None
    sb=d.get('statsButton') or {}
    sheet=[x['heading'] for x in d['statsSheet']['dialogs']] if d.get('statsSheet') else None
    sheetdesc=[l['text'] for l in d['statsSheet']['leafText'] if l.get('tag')=='h2'] if d.get('statsSheet') else None
    return dict(pill_text=pilltext, pill_li=[x['text'] for x in pr], pill_aria=pillaria, live_announce=live, live_early=liveEarly,
      stats_button_name=sb.get('name'), stats_button_aria=sb.get('aria'), stats_sheet_heading=sheet,
      toasts_summary=s['toasts'], toasts_stats=d['stats']['toasts'], toasts_final=d.get('finalToasts'),
      bodyLines_summary=s['bodyLines'], bodyLines_stats=d['stats']['bodyLines'], errors=d['errors'], console=d['console'])
for vp in ['390x844','1440x900']:
    for label in ['base','trial']:
        d=load(label,vp)
        if not d: print(vp,label,'MISSING'); continue
        print('=====',vp,label)
        for k,v in get(d).items(): print(' ',k,':',json.dumps(v,ensure_ascii=False))
