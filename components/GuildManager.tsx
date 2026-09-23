"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, Users, Swords, CalendarDays, Dices, Menu, X, Plus, Trash2, Search, Pencil, Shield, Target, RefreshCw, Lock } from "lucide-react";
import { supabase } from "../lib/supabase";

type Member = { id: string; name: string; job: string; power: number; defense: number; accuracy: number };
type BossRecord = { id: string; week: number; date: string; boss: string; score: number; participants: string[] };
type AppData = { members: Member[]; records: BossRecord[] };

const menus = [
  { key: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { key: "members", label: "길드원 목록", icon: Users },
  { key: "boss", label: "보스 참여 기록", icon: Swords },
  { key: "stats", label: "참여율 기록", icon: CalendarDays },
  { key: "ladder", label: "사다리 게임", icon: Dices },
] as const;
type MenuKey = typeof menus[number]["key"];

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "CHANGE_ME";

function requireAdmin(): boolean {
  const password = window.prompt("관리자 비밀번호를 입력해주세요.");
  if (password === null) return false;
  if (password !== ADMIN_PASSWORD) {
    window.alert("관리자 비밀번호가 올바르지 않습니다.");
    return false;
  }
  return true;
}

export default function GuildManager() {
  const [active, setActive] = useState<MenuKey>("dashboard");
  const [sidebar, setSidebar] = useState(true);
  const [data, setData] = useState<AppData>({ members: [], records: [] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: members, error: membersError }, { data: records, error: recordsError }] = await Promise.all([
      supabase.from("members").select("*").order("name"),
      supabase.from("boss_records").select("*").order("date", { ascending: false }),
    ]);
    if (membersError || recordsError) {
      window.alert(membersError?.message || recordsError?.message || "데이터를 불러오지 못했습니다.");
    }
    setData({ members: (members || []) as Member[], records: (records || []) as BossRecord[] });
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("guild-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "boss_records" }, load)
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  const title = menus.find((m) => m.key === active)?.label || "대시보드";

  return (
    <div className="app">
      <aside className={`sidebar ${sidebar ? "open" : "closed"}`}>
        <div className="brand">
          <div className="brand-mark">🏰</div>
          <div><strong>레이븐2</strong><span>길드 관리 시스템</span></div>
          <button className="icon-btn mobile-only" onClick={() => setSidebar(false)}><X size={20} /></button>
        </div>
        <nav>
          {menus.map(({ key, label, icon: Icon }) => (
            <button key={key} className={`nav-item ${active === key ? "active" : ""}`} onClick={() => { setActive(key); if (window.innerWidth <= 900) setSidebar(false); }}>
              <Icon size={19} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="side-foot">RAVEN2 GUILD MANAGER</div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="icon-btn menu-toggle" onClick={() => setSidebar(!sidebar)}><Menu size={21} /></button>
          <div><div className="crumb">RAVEN2 / {title}</div><h1>{title}</h1></div>
          <button className="refresh" onClick={load} title="새로고침"><RefreshCw size={17} /></button>
        </header>
        <section className="content">
          {loading ? <div className="loading-page">데이터 불러오는 중...</div> : <>
            {active === "dashboard" && <Dashboard data={data} />}
            {active === "members" && <Members data={data} setData={setData} />}
            {active === "boss" && <BossRecords data={data} setData={setData} />}
            {active === "stats" && <Stats data={data} />}
            {active === "ladder" && <Ladder members={data.members} />}
          </>}
        </section>
      </main>
    </div>
  );
}

function Dashboard({ data }: { data: AppData }) {
  const avg = (key: "power" | "defense" | "accuracy") => data.members.length ? Math.round(data.members.reduce((sum, m) => sum + m[key], 0) / data.members.length) : 0;
  const total = data.records.reduce((sum, r) => sum + r.participants.length, 0);
  return <div className="stack">
    <PageIntro title="🌸 길드 대시보드" desc="모든 길드원이 공유하는 실시간 길드 현황입니다." />
    <div className="cards">
      <StatCard icon={<Users />} label="총 길드원" value={`${data.members.length}명`} />
      <StatCard icon={<Swords />} label="평균 공격력" value={avg("power").toLocaleString()} />
      <StatCard icon={<Shield />} label="평균 방어력" value={avg("defense").toLocaleString()} />
      <StatCard icon={<Target />} label="평균 명중" value={avg("accuracy").toLocaleString()} />
    </div>
    <div className="grid-2">
      <div className="panel"><div className="panel-title"><span>⚔️ 최근 보스 기록</span><span className="muted">총 {data.records.length}건</span></div>
        {data.records.length ? <div className="table-wrap"><table><thead><tr><th>주차</th><th>날짜</th><th>보스</th><th>참여</th></tr></thead><tbody>{data.records.slice(0, 7).map(r => <tr key={r.id}><td>{r.week}주차</td><td>{r.date}</td><td className="strong">{r.boss}</td><td>{r.participants.length}명</td></tr>)}</tbody></table></div> : <Empty text="등록된 보스 기록이 없습니다." />}
      </div>
      <div className="panel"><div className="panel-title"><span>📊 전체 참여 현황</span><b>{total}회</b></div><TopMembers data={data} /></div>
    </div>
  </div>;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>;
}

function TopMembers({ data }: { data: AppData }) {
  const counts: Record<string, number> = {};
  data.records.forEach(r => r.participants.forEach(p => { counts[p] = (counts[p] || 0) + 1; }));
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return rows.length ? <div className="rank-list">{rows.map(([name, count], i) => <div className="rank" key={name}><b>{i + 1}</b><span>{name}</span><em>{count}회</em></div>)}</div> : <Empty text="아직 참여 데이터가 없습니다." />;
}

function Empty({ text }: { text: string }) { return <div className="empty">{text}</div>; }
function PageIntro({ title, desc }: { title: string; desc: string }) { return <div className="page-head"><div><div className="eyebrow">RAVEN2 GUILD</div><h2>{title}</h2><p>{desc}</p></div></div>; }

function Members({ data, setData }: { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>> }) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState({ name: "", job: "", power: "", defense: "", accuracy: "" });
  const [saving, setSaving] = useState(false);
  const list = data.members.filter(m => `${m.name} ${m.job}`.toLowerCase().includes(q.trim().toLowerCase()));
  const reset = () => { setEditing(null); setForm({ name: "", job: "", power: "", defense: "", accuracy: "" }); };
  const startEdit = (m: Member) => {
    setEditing(m);
    setForm({ name: m.name, job: m.job || "", power: String(m.power), defense: String(m.defense), accuracy: String(m.accuracy) });
  };

  const save = async () => {
    if (!form.name.trim()) return window.alert("닉네임을 입력해주세요.");
    if (!editing && !requireAdmin()) return;
    setSaving(true);
    const row = { name: form.name.trim(), job: form.job.trim(), power: Number(form.power) || 0, defense: Number(form.defense) || 0, accuracy: Number(form.accuracy) || 0 };
    const result = editing
      ? await supabase.from("members").update(row).eq("id", editing.id).select().single()
      : await supabase.from("members").insert(row).select().single();
    if (result.error) {
      setSaving(false);
      return window.alert(`저장 실패: ${result.error.message}`);
    }
    const { data: members, error } = await supabase.from("members").select("*").order("name");
    setSaving(false);
    if (error) return window.alert(`목록 새로고침 실패: ${error.message}`);
    setData(d => ({ ...d, members: (members || []) as Member[] }));
    reset();
  };

  const del = async (id: string) => {
    if (!requireAdmin()) return;
    if (!window.confirm("이 길드원을 삭제할까요?")) return;
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) return window.alert(`삭제 실패: ${error.message}`);
    setData(d => ({ ...d, members: d.members.filter(m => m.id !== id) }));
  };

  return <div className="stack">
    <PageIntro title="👥 길드원 목록" desc="길드원 정보를 한눈에 확인하고 검색할 수 있습니다." />
    <div className="members-toolbar">
      <div className="search member-search"><Search size={17} /><input placeholder="닉네임 또는 직업 검색" value={q} onChange={e => setQ(e.target.value)} /></div>
      <span className="muted">검색 결과 {list.length}명 / 전체 {data.members.length}명</span>
      <button className="primary" onClick={() => { reset(); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Plus size={16} /> 길드원 추가</button>
    </div>
    <div className="member-grid">
      {list.map(m => <div className="member-card" key={m.id}>
        <div className="member-card-head"><div><strong>{m.name}</strong><span>{m.job || "직업 미등록"}</span></div><div className="actions"><button title="수정" onClick={() => startEdit(m)}><Pencil size={15} /></button><button title="삭제" className="danger" onClick={() => del(m.id)}><Trash2 size={15} /></button></div></div>
        <div className="member-stats">
          <div><span>공격력</span><b>{m.power.toLocaleString()}</b></div>
          <div><span>방어력</span><b>{m.defense.toLocaleString()}</b></div>
          <div><span>명중</span><b>{m.accuracy.toLocaleString()}</b></div>
        </div>
      </div>)}
    </div>
    {!list.length && <div className="panel"><Empty text={q ? "검색 결과가 없습니다." : "등록된 길드원이 없습니다."} /></div>}

    {editing && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) reset(); }}>
      <div className="member-edit-modal">
        <div className="modal-head"><div><div className="eyebrow">RAVEN2 MEMBER</div><h3>✏️ 길드원 정보 수정</h3></div><button className="icon-btn" onClick={reset}><X size={20} /></button></div>
        <div className="edit-grid">
          <label>닉네임<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label>직업<input value={form.job} onChange={e => setForm({ ...form, job: e.target.value })} /></label>
          <label>공격력<input type="number" value={form.power} onChange={e => setForm({ ...form, power: e.target.value })} /></label>
          <label>방어력<input type="number" value={form.defense} onChange={e => setForm({ ...form, defense: e.target.value })} /></label>
          <label>명중<input type="number" value={form.accuracy} onChange={e => setForm({ ...form, accuracy: e.target.value })} /></label>
        </div>
        <div className="modal-actions"><button className="secondary" onClick={reset}>취소</button><button className="primary" disabled={saving} onClick={save}>{saving ? "저장 중..." : "수정 저장"}</button></div>
      </div>
    </div>}

    {!editing && <div className="panel add-member-panel"><div className="panel-title"><span>➕ 길드원 등록</span><Lock size={16} /></div><div className="form-grid member-add-grid">
      <input placeholder="닉네임" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      <input placeholder="직업" value={form.job} onChange={e => setForm({ ...form, job: e.target.value })} />
      <input type="number" placeholder="공격력" value={form.power} onChange={e => setForm({ ...form, power: e.target.value })} />
      <input type="number" placeholder="방어력" value={form.defense} onChange={e => setForm({ ...form, defense: e.target.value })} />
      <input type="number" placeholder="명중" value={form.accuracy} onChange={e => setForm({ ...form, accuracy: e.target.value })} />
      <button className="primary" disabled={saving} onClick={save}><Plus size={16} /> {saving ? "등록 중..." : "등록"}</button>
    </div></div>}
  </div>;
}
function BossRecords({ data, setData }: { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>> }) {
  const [week, setWeek] = useState("1");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [boss, setBoss] = useState("");
  const [score, setScore] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const add = async () => {
    if (!boss.trim()) return window.alert("보스명을 입력해주세요.");
    if (!requireAdmin()) return;
    const { data: record, error } = await supabase.from("boss_records").insert({ week: Number(week), date, boss: boss.trim(), score: Number(score) || 0, participants: selected }).select().single();
    if (error) return window.alert(error.message);
    setData(d => ({ ...d, records: [record as BossRecord, ...d.records] }));
    setBoss(""); setScore(""); setSelected([]);
  };

  const del = async (id: string) => {
    if (!requireAdmin()) return;
    if (!window.confirm("이 기록을 삭제할까요?")) return;
    const { error } = await supabase.from("boss_records").delete().eq("id", id);
    if (error) return window.alert(error.message);
    setData(d => ({ ...d, records: d.records.filter(r => r.id !== id) }));
  };

  const toggle = (name: string) => setSelected(s => s.includes(name) ? s.filter(x => x !== name) : [...s, name]);

  return <div className="stack">
    <PageIntro title="⚔️ 보스 참여 기록" desc="보스 기록 등록과 삭제는 관리자 비밀번호가 필요합니다." />
    <div className="panel"><div className="panel-title"><span>➕ 참여 기록 추가</span><Lock size={16} /></div>
      <div className="form-grid boss-form"><select value={week} onChange={e => setWeek(e.target.value)}>{[1, 2, 3, 4, 5].map(x => <option key={x} value={x}>{x}주차</option>)}</select><input type="date" value={date} onChange={e => setDate(e.target.value)} /><input placeholder="보스 이름" value={boss} onChange={e => setBoss(e.target.value)} /><input type="number" placeholder="보스 점수" value={score} onChange={e => setScore(e.target.value)} /></div>
      <div className="member-picker">{data.members.map(m => <button key={m.id} className={selected.includes(m.name) ? "selected" : ""} onClick={() => toggle(m.name)}>{m.name}</button>)}</div>
      <button className="primary" onClick={add}><Plus size={16} /> 참여 기록 저장 ({selected.length}명)</button>
    </div>
    <div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>주차</th><th>날짜</th><th>보스</th><th>점수</th><th>참여자</th><th /></tr></thead><tbody>{data.records.map(r => <tr key={r.id}><td>{r.week}주차</td><td>{r.date}</td><td className="strong">{r.boss}</td><td>{r.score.toLocaleString()}</td><td>{r.participants.length ? r.participants.join(", ") : "-"}</td><td><button className="danger-text" onClick={() => del(r.id)}>삭제</button></td></tr>)}</tbody></table></div>{!data.records.length && <Empty text="등록된 기록이 없습니다." />}</div>
  </div>;
}

function Stats({ data }: { data: AppData }) {
  const total = data.records.length;
  const rows = data.members.map(m => ({ name: m.name, count: data.records.filter(r => r.participants.includes(m.name)).length })).sort((a, b) => b.count - a.count);
  return <div className="stack"><PageIntro title="📅 참여율 기록" desc="길드원별 보스 참여 현황을 확인합니다." /><div className="cards"><StatCard icon={<CalendarDays />} label="전체 보스 기록" value={`${total}건`} /><StatCard icon={<Users />} label="전체 참여 횟수" value={`${data.records.reduce((a, r) => a + r.participants.length, 0)}회`} /></div><div className="panel"><div className="panel-title"><span>길드원별 참여 현황</span></div><div className="table-wrap"><table><thead><tr><th>길드원</th><th>참여 횟수</th><th>참여율</th></tr></thead><tbody>{rows.map(r => <tr key={r.name}><td className="strong">{r.name}</td><td>{r.count}회</td><td><div className="mini-rate"><span>{total ? Math.round(r.count / total * 100) : 0}%</span><i style={{ width: `${total ? Math.min(100, r.count / total * 100) : 0}%` }} /></div></td></tr>)}</tbody></table></div>{!rows.length && <Empty text="길드원을 등록하면 참여율이 표시됩니다." />}</div></div>;
}

function Ladder({ members }: { members: Member[] }) {
  const [players, setPlayers] = useState<string[]>([]);
  const [results, setResults] = useState<string[]>(["당첨", "꽝"]);
  const [out, setOut] = useState<Record<string, string> | null>(null);
  const shuffle = () => {
    if (!players.length) return window.alert("참가자를 추가해주세요.");
    if (results.length < players.length) return window.alert("결과 항목을 참가자 수만큼 추가해주세요.");
    const a = [...results].sort(() => Math.random() - 0.5);
    const m = [...players].sort(() => Math.random() - 0.5);
    const map: Record<string, string> = {};
    m.forEach((p, i) => { map[p] = a[i]; });
    setOut(map);
  };
  return <div className="stack"><PageIntro title="🎲 사다리 게임" desc="사다리 게임은 관리자 비밀번호 없이 누구나 사용할 수 있습니다." /><div className="grid-2"><div className="panel"><div className="panel-title"><span>참가자</span><button className="small" onClick={() => { setPlayers([]); setOut(null); }}>초기화</button></div><div className="member-picker">{members.map(m => <button key={m.id} className={players.includes(m.name) ? "selected" : ""} onClick={() => setPlayers(s => s.includes(m.name) ? s.filter(x => x !== m.name) : [...s, m.name])}>{m.name}</button>)}</div></div><div className="panel"><div className="panel-title"><span>결과 항목</span><button className="small" onClick={() => setResults([...results, "새 결과"])}><Plus size={14} /> 추가</button></div><div className="result-list">{results.map((r, i) => <input key={i} value={r} onChange={e => setResults(results.map((x, j) => j === i ? e.target.value : x))} />)}</div><button className="primary full" onClick={shuffle}>🎲 사다리 돌리기</button></div></div>{out && <div className="panel"><div className="panel-title"><span>🎉 결과</span></div><div className="result-grid">{Object.entries(out).map(([p, r]) => <div className="result-card" key={p}><strong>{p}</strong><span>{r}</span></div>)}</div></div>}</div>;
}
