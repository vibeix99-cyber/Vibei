import json,sys,collections
for f in sys.argv[1:]:
    rows=[json.loads(l) for l in open(f) if l.strip()]
    fail=0; fails=[]
    revs=set(r['rev'] for r in rows)
    for r in rows:
        bad=[]
        for c,v in r['controls'].items():
            for how,res in v.items():
                if isinstance(res,dict) and 'reached' in res and not res['reached']:
                    bad.append(f"{c}/{how}")
        if r.get('tap'):
            t=r['tap']
            for k,vv in t.items():
                if isinstance(vv,dict) and vv.get('ok') is False: bad.append('tap:'+k)
                if vv is False: bad.append('tap:'+k)
        if r.get('errors'): bad.append('ERR:'+str(r['errors'])[:80])
        if bad: fail+=1; fails.append((r['size'],r['theme'],r['state'],bad))
    print(f, 'revs',revs,'rows',len(rows),'failing',fail)
    for x in fails: print('   ',x)
