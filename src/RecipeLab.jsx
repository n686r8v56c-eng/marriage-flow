import React,{useEffect,useState} from 'react';
import {RECIPE_SOURCES,RECIPE_KINDS,RECIPE_DETAIL_GROUPS} from './recipeLabData.js';
import './RecipeLab.css';

const arr=x=>Array.isArray(x)?x:[];
const safe=x=>String(x??'').trim();
const today=()=>new Date().toISOString().slice(0,10);
const keyFor=id=>'recipe-lab-v1:'+id;
const newId=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'recipe-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const empty=()=>({cards:[],annotations:{}});
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open('marriage-flow-recipe-lab-v1',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('records'))req.result.createObjectStore('records')};req.onerror=()=>reject(req.error);req.onsuccess=()=>resolve(req.result)})}
async function load(k){const db=await openDB();try{return await new Promise((r,j)=>{const tx=db.transaction('records','readonly');const q=tx.objectStore('records').get(k);q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)})}finally{db.close()}}
async function store(k,v){const db=await openDB();try{await new Promise((r,j)=>{const tx=db.transaction('records','readwrite');tx.objectStore('records').put(v,k);tx.oncomplete=r;tx.onerror=()=>j(tx.error)})}finally{db.close()}}
function fileExport(filename,value){const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function urlOK(x){try{const a=new URL(x);return ['https:','http:'].includes(a.protocol)?a.href:''}catch{return ''}}
const defaultForm=()=>({name:'',person:'',episode:'',date:'',kind:'메인',url:'',story:'',ingredients:'',steps:'',detail:'',group:'조리 기법',note:''});
export default function RecipeLab({userId}){
 const [data,setData]=useState(empty),[ready,setReady]=useState(false),[message,setMessage]=useState('');
 const [tab,setTab]=useState('요리카드'),[query,setQuery]=useState(''),[person,setPerson]=useState('전체'),[kind,setKind]=useState('전체'),[selectedDetail,setSelectedDetail]=useState(''),[selectedId,setSelectedId]=useState('');
 const [form,setForm]=useState(defaultForm),[editId,setEditId]=useState(''),[addDetail,setAddDetail]=useState({name:'',group:'조리 기법',note:''});
 const key=keyFor(userId);
 useEffect(()=>{let active=true;setReady(false);load(key).then(saved=>{if(active){setData(saved&&typeof saved==='object'?{...empty(),...saved}:empty());setReady(true)}}).catch(e=>{if(active){setMessage('로컬 저장 데이터를 열지 못했어: '+e.message);setReady(true)}});return()=>{active=false}},[key]);
 const cards=[...RECIPE_SOURCES,...arr(data.cards).filter(c=>!RECIPE_SOURCES.some(s=>s.id===c.id))].map(c=>({...c,...(data.annotations?.[c.id]||{}),id:c.id}));
 const people=['전체',...Array.from(new Set(cards.map(c=>safe(c.person)||'미확인'))).sort((a,b)=>a.localeCompare(b,'ko'))];
 const save=fn=>{if(!ready){setMessage('데이터 준비 중이야.');return}const next=fn(data);store(key,next).then(()=>{setData(next);setMessage('이 기기에 저장했어. 기기 변경 전 JSON 백업을 권장해.')}).catch(e=>setMessage('저장 실패: '+e.message))};
 const filtered=cards.filter(c=>(person==='전체'||c.person===person)&&(kind==='전체'||c.kind===kind)&&[c.name,c.person,c.story,c.episode].some(x=>String(x||'').toLowerCase().includes(query.toLowerCase())));
 const details=Array.from(new Map(cards.flatMap(c=>arr(c.details).map(d=>[safe(d.name),{name:safe(d.name),group:d.group||'기타'}])).filter(([name])=>name)).values()).sort((a,b)=>a.name.localeCompare(b.name,'ko'));
 const detailMatches=cards.filter(c=>arr(c.details).some(d=>d.name===selectedDetail)&&(person==='전체'||c.person===person)&&(kind==='전체'||c.kind===kind));
 const selection=cards.find(c=>c.id===selectedId);
 const pick=c=>{setSelectedId(c.id);setEditId(c.id);setForm({...defaultForm(),...c,ingredients:c.ingredients||'',steps:c.steps||'',detail:'',note:''});setTab('레시피 분석')};
 const submit=e=>{e.preventDefault();const name=safe(form.name),url=safe(form.url);if(!name){setMessage('요리 이름을 입력해 줘.');return}if(url&&!urlOK(url)){setMessage('공식 출처 URL 형식을 확인해 줘.');return}
  const card={id:editId||newId(),name,person:safe(form.person)||'미확인',episode:safe(form.episode),date:safe(form.date),kind:form.kind,url:url?urlOK(url):'',story:safe(form.story),ingredients:safe(form.ingredients),steps:safe(form.steps),status:'사용자 입력·검증 필요'};
  if(!editId){save(d=>({...d,cards:[...arr(d.cards),card]}));setSelectedId(card.id);setEditId(card.id)}
  else if(RECIPE_SOURCES.some(c=>c.id===editId)){save(d=>({...d,annotations:{...d.annotations,[editId]:{...(d.annotations?.[editId]||{}),...card}}}))}
  else save(d=>({...d,cards:arr(d.cards).map(c=>c.id===editId?{...c,...card}:c)}));
 };
 const addTag=e=>{e.preventDefault();if(!selectedId||!safe(addDetail.name)){setMessage('요리카드를 선택하고 디테일 이름을 입력해 줘.');return}
  const annotation=data.annotations?.[selectedId]||{};
  const current=arr(cards.find(c=>c.id===selectedId)?.details);
  const updated=[...current,{name:safe(addDetail.name),group:addDetail.group,note:safe(addDetail.note)}];
  if(RECIPE_SOURCES.some(c=>c.id===selectedId))save(d=>({...d,annotations:{...d.annotations,[selectedId]:{...annotation,details:updated}}}));
  else save(d=>({...d,cards:arr(d.cards).map(c=>c.id===selectedId?{...c,details:updated}:c)}));
  setAddDetail({name:'',group:'조리 기법',note:''});
 };
 const download=()=>fileExport('recipe-lab-'+today()+'.json',{format:'marriage-flow-recipe-lab-v1',exportedAt:new Date().toISOString(),payload:data});
 const importFile=async e=>{const f=e.target.files?.[0];if(!f)return;try{const raw=JSON.parse(await f.text());if(raw.format!=='marriage-flow-recipe-lab-v1'||!raw.payload||!Array.isArray(raw.payload.cards)){throw Error('RECIPE LAB 백업 JSON 형식이 아니야')}
  save(d=>({...d,cards:[...arr(d.cards),...arr(raw.payload.cards).filter(x=>!arr(d.cards).some(y=>x.id===y.id))],annotations:{...raw.payload.annotations,...d.annotations}}));setMessage('기존 카드와 메모를 유지하며 ID 기준으로 병합했어.');
 }catch(err){setMessage('가져오기 실패: '+err.message)}e.target.value=''};
 return <section className="rl-root">
 <div className="rl-top"><div><h2>RECIPE LAB</h2><p>편스토랑 · 요리카드 × 레시피 분석 × 이야기 구조</p></div><span>공식 출처 연결형 연구</span></div>
 <nav className="rl-tabs">{['요리카드','레시피 분석','디테일 사전','콘텐츠 구조'].map(t=><button key={t} className={tab===t?'on':''} onClick={()=>setTab(t)}>{t}</button>)}</nav>
 {tab==='요리카드'&&<><div className="rl-filter"><input placeholder="요리·출연자·회차 검색" value={query} onChange={e=>setQuery(e.target.value)}/><select value={person} onChange={e=>setPerson(e.target.value)}>{people.map(x=><option key={x}>{x}</option>)}</select><select value={kind} onChange={e=>setKind(e.target.value)}>{RECIPE_KINDS.map(x=><option key={x}>{x}</option>)}</select></div>
 <p className="rl-help">공식 회차 소개에서 확인된 메뉴만 초기 색인에 등록했어. 실제 재료·분량·조리 순서는 아직 가져오지 않았어. 출처 페이지에서 직접 확인한 뒤 카드에 기록해.</p>
 <div className="rl-list">{filtered.map(c=><article key={c.id} className="rl-card"><div className="rl-between"><strong>{c.name}</strong><span>{c.kind||'기타'}</span></div><small>{c.person} · {c.episode?c.episode+'회':''} {c.date||''}</small><p>{c.story||'콘텐츠 맥락 미기록'}</p><p className="rl-help">{c.status}</p><div className="rl-actions"><button onClick={()=>pick(c)}>요리카드 열기</button>{c.url&&<a href={c.url} target="_blank" rel="noopener noreferrer">KBS 출처 ↗</a>}</div></article>)}</div>
 {filtered.length===0&&<p className="rl-help">검색 결과가 없어.</p>}
 <button onClick={()=>{setEditId('');setSelectedId('');setForm(defaultForm());setTab('레시피 분석')}}>+ 새 요리카드</button></>}
 {tab==='레시피 분석'&&<><div className="rl-filter"><select value={selectedId} onChange={e=>{const c=cards.find(x=>x.id===e.target.value);if(c)pick(c);else{setSelectedId('');setEditId('');setForm(defaultForm())}}}><option value="">새 요리카드</option>{cards.map(c=><option key={c.id} value={c.id}>{c.name} · {c.person}</option>)}</select></div>
 <form className="rl-form" onSubmit={submit}><h3>{editId?'요리카드 정보 보완':'새 요리카드 추가'}</h3><label>요리 이름<input required value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))}/></label><label>출연자<input value={form.person} onChange={e=>setForm(v=>({...v,person:e.target.value}))}/></label><label>회차<input value={form.episode} onChange={e=>setForm(v=>({...v,episode:e.target.value}))}/></label><label>요리 분류<select value={form.kind} onChange={e=>setForm(v=>({...v,kind:e.target.value}))}>{RECIPE_KINDS.filter(x=>x!=='전체').map(x=><option key={x}>{x}</option>)}</select></label><label>KBS 공식 출처 링크<input type="url" value={form.url} onChange={e=>setForm(v=>({...v,url:e.target.value}))}/></label><label>인물·상황·요리 목적<textarea rows={2} value={form.story} onChange={e=>setForm(v=>({...v,story:e.target.value}))}/></label><label>직접 정리한 재료·분량 메모<textarea rows={3} value={form.ingredients} onChange={e=>setForm(v=>({...v,ingredients:e.target.value}))} placeholder="공식 페이지를 확인해 직접 작성한 작업 메모"/></label><label>직접 정리한 조리 메모<textarea rows={3} value={form.steps} onChange={e=>setForm(v=>({...v,steps:e.target.value}))} placeholder="단계·주의사항·실험 결과 등을 자신의 말로 정리"/></label><button type="submit">요리카드 저장</button></form>
 {selection&&<form className="rl-form" onSubmit={addTag}><h3>+ 이 요리에 디테일 연결</h3><label>디테일 분류<select value={addDetail.group} onChange={e=>setAddDetail(v=>({...v,group:e.target.value}))}>{RECIPE_DETAIL_GROUPS.map(x=><option key={x}>{x}</option>)}</select></label><label>디테일<input value={addDetail.name} onChange={e=>setAddDetail(v=>({...v,name:e.target.value}))} placeholder="예: 원팬·우엉·특제 소스"/></label><label>관찰·검증 메모<input value={addDetail.note} onChange={e=>setAddDetail(v=>({...v,note:e.target.value}))}/></label><button type="submit">디테일 추가</button></form>}</>}
 {tab==='디테일 사전'&&<><h3>요리 디테일 · 크로스 레시피 검색</h3><p className="rl-help">재료·조리기법·맛·시간 등 기록된 디테일을 클릭하면 해당 요리카드만 필터링해. 공식 페이지에 없는 정보는 자동 생성하지 않아.</p><div className="rl-filter"><select value={person} onChange={e=>setPerson(e.target.value)}>{people.map(x=><option key={x}>{x}</option>)}</select><select value={kind} onChange={e=>setKind(e.target.value)}>{RECIPE_KINDS.map(x=><option key={x}>{x}</option>)}</select></div><div className="rl-tags">{details.map(d=><button key={d.name} className={selectedDetail===d.name?'on':''} onClick={()=>setSelectedDetail(v=>v===d.name?'':d.name)}>{d.name} · {d.group}</button>)}</div>{!details.length&&<p className="rl-help">아직 상품별 분석 디테일이 없어. 요리카드에서 디테일을 추가해 줘.</p>}{selectedDetail&&<div className="rl-list">{detailMatches.map(c=><article className="rl-card" key={c.id}><strong>{c.name}</strong><small>{c.person} · {c.episode}회</small><p>{arr(c.details).filter(d=>d.name===selectedDetail).map(d=>d.note).join('; ')}</p><button onClick={()=>pick(c)}>레시피 분석 보기</button></article>)}{!detailMatches.length&&<p>일치하는 카드가 없어.</p>}</div>}</>}
 {tab==='콘텐츠 구조'&&<><h3>편스토랑 · STORY × ANALYSIS</h3><p className="rl-help">레시피 지식과 인물의 이야기를 같은 회차·출연자·요리카드에 연결하는 1차 분석 도구야. 서사 원문 전수 분석은 아직 진행 전이야.</p><div className="rl-list">{cards.map(c=><article key={c.id} className="rl-card"><div className="rl-between"><strong>{c.name}</strong><span>{c.episode}회</span></div><small>{c.person}</small><p>이야기 출발점: {c.story||'미기록'}</p><p>분석 질문: 누구를 위해 이 요리를 만들고, 어떤 문제·비법·시식·관계 변화가 있었나?</p>{c.url&&<a href={c.url} target="_blank" rel="noopener noreferrer">방송 근거 확인 ↗</a>}</article>)}</div></>}
 <footer className="rl-backup"><button onClick={download}>JSON 백업</button><label>JSON 병합 복구<input type="file" accept=".json,application/json" onChange={importFile}/></label><small>기존 Marriage Flow 데이터베이스와 완전히 분리된 IndexedDB에 저장 · 자동 클라우드 백업 미연결</small></footer>
 {message&&<p className="rl-message" role="status">{message}</p>}</section>;
}
