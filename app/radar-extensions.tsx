'use client';
import {useState,useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {ExternalLink,RefreshCw} from 'lucide-react';
import {toast} from 'sonner';
import type {Item,State,Prefs} from '@/lib/radar/types';

const labels:Record<string,string>={publisher:'出版社',brand:'品牌',manufacturer:'厂家',characters:'角色',circle:'社团',artists:'画师 / 作者',releaseDate:'发售 / 发行时间',year:'年份',jan:'JAN',isbn:'ISBN',series:'系列',msrp:'参考定价（JPY）',origin:'来源类型',category:'类别'};
export function SourceFacts({item,act,busy}:{item:Item;act:(body:unknown)=>Promise<any>;busy:boolean}){
 const [url,setUrl]=useState(item.offers[0]?.url||''),[candidate,setCandidate]=useState<any>(null);
 return <section className="source-facts"><h3>从商品页补充资料</h3><p className="muted">粘贴 AmiAmi、Aniplex、Bandai 等来源的具体商品页。先核对商品、版本和特典，再确认写入。只读取明确字段，不把商店当厂家，不把售价当发售价。</p><label>资料来源网址<Input type="url" value={url} onChange={e=>{setUrl(e.target.value);setCandidate(null);}} placeholder="https://…"/></label><Button variant="outline" disabled={busy||!url} onClick={async()=>{const d=await act({action:'source-preview',id:item.id,url});if(d?.candidate)setCandidate(d.candidate);}}>预览来源资料</Button>{item.bucket==='junk'&&<p className="help">这件商品在“小垃圾”里，默认不做深入补全。你仍可主动读取资料。</p>}{candidate&&<div className="source-preview"><strong>{candidate.title||'来源未提供标题，请打开原站核对'}</strong><a href={candidate.url} target="_blank" rel="noreferrer">打开来源核对 <ExternalLink size={14}/></a><dl>{Object.entries(candidate.facts).map(([key,value])=><div key={key}><dt>{labels[key]||key}</dt><dd>{Array.isArray(value)?value.join('、'):String(value)}</dd></div>)}</dl><p className="help">确认后，以上字段会替换当前条目对应字段，并保存来源记录。请确认这确实是同一商品与版本。</p><Button disabled={busy} onClick={async()=>{const d=await act({action:'apply-source',id:item.id,url,fingerprint:candidate.fingerprint});if(d)setCandidate(null);}}>是同一商品，确认写入</Button></div>}</section>;
}

export function MonitorSettings({state,save,busy}:{state:State;save:(prefs:Prefs)=>Promise<any>;busy:boolean}){
 const [enabled,setEnabled]=useState(state.prefs.monitor.enabled),[minutes,setMinutes]=useState(state.prefs.monitor.intervalMinutes),[urls,setUrls]=useState(state.prefs.monitor.urls.join('\n')),[jobs,setJobs]=useState<any[]>([]);
 const background=state.runtime?.background===true;
 const refresh=async()=>{try{const r=await fetch('/api/monitor');if(r.ok){const data=await r.json() as {jobs?:any[]};setJobs(data.jobs||[]);}}catch{}};
 useEffect(()=>{if(background)void refresh();},[background]);
 return <section className="panel"><div className="section-line"><h2>关闭页面后继续监控</h2><span className="pill">{background?'独立后台已连接':'此试用站未启用后台'}</span></div>{!background?<p>独立运行版本包含后台任务与持久数据库，部署在常开的服务器上后可全天运行。当前试用站提供手动采集和页面打开时检查，不能当作全天监控。</p>:<><p>任务按保存的间隔执行，进度会在服务器重启后恢复。遇到年龄确认、登录或人机验证会暂停该来源，不连续重试。</p><div className="form-grid"><label>后台任务<Select value={enabled?'on':'off'} onValueChange={v=>setEnabled(v==='on')}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="on">开启</SelectItem><SelectItem value="off">关闭</SelectItem></SelectContent></Select></label><label>间隔（分钟，至少 15）<Input type="number" min={15} max={1440} value={minutes} onChange={e=>setMinutes(Number(e.target.value))}/></label></div><label>监控网址，每行一个；留空使用已保存的搜索网址<Textarea value={urls} onChange={e=>setUrls(e.target.value)} rows={3}/></label><div className="button-row"><Button disabled={busy} onClick={()=>save({...state.prefs,monitor:{enabled,intervalMinutes:minutes,urls:urls.split('\n').map(x=>x.trim()).filter(Boolean)}})}>保存后台任务</Button><Button variant="outline" onClick={refresh}><RefreshCw size={16}/>刷新状态</Button></div>{jobs.map(job=><div className="monitor-job" key={job.url}><a href={job.url} target="_blank" rel="noreferrer">{job.url}</a><p>{job.paused?`需要处理：${job.paused}`:`下次检查：${new Date(job.next_at).toLocaleString('zh-CN')}`} · 失败 {job.failures} 次</p>{job.paused&&<Button variant="outline" onClick={async()=>{const r=await fetch('/api/monitor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:job.url})});if(r.ok){toast.success('已恢复任务，若验证仍存在会再次暂停');await refresh();}else toast.error('恢复失败');}}>恢复检查</Button>}</div>)}</>}</section>;
}
