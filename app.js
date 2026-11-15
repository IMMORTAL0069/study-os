const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const KEY = "study-os-v1-data";
const defaultSubjects = [
  {name:"Mathematics",chapters:["Real Numbers","Polynomials","Pair of Linear Equations in Two Variables","Quadratic Equations","Arithmetic Progressions","Triangles","Coordinate Geometry","Introduction to Trigonometry","Some Applications of Trigonometry","Circles","Areas Related to Circles","Surface Areas and Volumes","Statistics","Probability"]},
  {name:"Science",chapters:["Chemical Reactions and Equations","Acids, Bases and Salts","Metals and Non-Metals","Carbon and its Compounds","Life Processes","Control and Coordination","How do Organisms Reproduce?","Heredity","Light: Reflection and Refraction","The Human Eye and the Colourful World","Electricity","Magnetic Effects of Electric Current","Our Environment"]},
  {name:"Social Science",chapters:["The Rise of Nationalism in Europe","Nationalism in India","Resources and Development","Forest and Wildlife Resources","Water Resources","Agriculture","Power Sharing","Federalism","Gender, Religion and Caste","Development","Sectors of the Indian Economy","Money and Credit","Globalisation and the Indian Economy"]},
  {name:"English",chapters:["Reading","Writing and Grammar","Literature"]},
  {name:"Bengali",chapters:["পাঠ্য সাহিত্য","ব্যাকরণ","রচনা ও নির্মিতি"]},
  {name:"Artificial Intelligence",chapters:["Communication Skills","Self-Management Skills","ICT Skills","AI Project Cycle","Data Literacy","Introduction to Python"]}
];
function freshData(){return {tasks:[],sessions:[],subjects:defaultSubjects.map(s=>({...s,chapters:s.chapters.map(name=>({name,status:"Not started"}))}))};}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY));if(d&&Array.isArray(d.tasks)&&Array.isArray(d.sessions)&&Array.isArray(d.subjects))return d;}catch(e){}return freshData();}
let data=load(), currentFilter="all", selectedMinutes=25, remaining=1500, timerId=null, running=false;
function save(){localStorage.setItem(KEY,JSON.stringify(data));renderAll();}
function todayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function prettyDate(v){return new Date(v).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"});}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2300);}
function minutesToday(){return data.sessions.filter(s=>s.date===todayKey()).reduce((a,s)=>a+s.minutes,0);}
function syllabusStats(){let total=0,done=0;data.subjects.forEach(s=>s.chapters.forEach(c=>{total++;if(c.status==="Completed")done++;}));return {total,done,pct:total?Math.round(done/total*100):0};}
function renderDashboard(){
  const mins=minutesToday(),todayTasks=data.tasks.filter(t=>t.date===todayKey()),done=todayTasks.filter(t=>t.done).length,st=syllabusStats();
  $("#stat-time").textContent=mins>=60?`${Math.floor(mins/60)}h ${mins%60}m`:`${mins}m`;
  $("#stat-tasks").textContent=done;$("#stat-task-sub").textContent=`${todayTasks.length-done} pending today`;
  $("#stat-syllabus").textContent=st.pct+"%";
  const items=todayTasks.slice(0,5);
  $("#dashboard-tasks").innerHTML=items.length?items.map(t=>`<div class="task-item ${t.done?"done":""}"><input class="task-check" type="checkbox" data-task="${t.id}" ${t.done?"checked":""}><div class="task-info"><strong>${escapeHTML(t.title)}</strong><small>${escapeHTML(t.subject)}</small></div><span class="priority ${t.priority}">${t.priority}</span></div>`).join(""):"No tasks for today. Add your first mission.";
}
function renderTasks(){
 const list=data.tasks.filter(t=>currentFilter==="all"||(currentFilter==="done"?t.done:!t.done));
 $("#task-list").innerHTML=list.length?list.map(t=>`<div class="task-item ${t.done?"done":""}"><input class="task-check" type="checkbox" data-task="${t.id}" ${t.done?"checked":""}><div class="task-info"><strong>${escapeHTML(t.title)}</strong><small>${escapeHTML(t.subject)} · Added ${prettyDate(t.created)}</small></div><span class="priority ${t.priority}">${t.priority}</span><button class="delete-btn" data-delete="${t.id}" aria-label="Delete task">×</button></div>`).join(""):"Nothing in this filter yet.";
 $$(".filter").forEach(b=>b.classList.toggle("active",b.dataset.filter===currentFilter));
}
function renderSyllabus(){
 const st=syllabusStats();$("#syllabus-total").textContent=`${st.pct}% complete`;
 $("#subjects-list").innerHTML=data.subjects.map((s,si)=>{const done=s.chapters.filter(c=>c.status==="Completed").length,pct=Math.round(done/s.chapters.length*100);return `<div class="subject-card"><div class="subject-top"><strong>${escapeHTML(s.name)}</strong><span>${done}/${s.chapters.length} · ${pct}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><div class="chapter-list">${s.chapters.map((c,ci)=>`<label class="chapter-row"><span>${escapeHTML(c.name)}</span><select data-chapter="${si}:${ci}" aria-label="Status for ${escapeHTML(c.name)}"><option ${c.status==="Not started"?"selected":""}>Not started</option><option ${c.status==="In progress"?"selected":""}>In progress</option><option ${c.status==="Completed"?"selected":""}>Completed</option></select></label>`).join("")}</div></div>`}).join("");
}
function renderHistory(){
 const total=data.sessions.reduce((a,s)=>a+s.minutes,0);
 $("#history-total").textContent=total>=60?`${Math.floor(total/60)}h ${total%60}m`:`${total}m`;
 $("#history-count").textContent=data.sessions.length;
 const sorted=[...data.sessions].sort((a,b)=>b.timestamp-a.timestamp);
 $("#history-list").innerHTML=sorted.length?sorted.map(s=>`<div class="history-item"><div>${escapeHTML(s.topic||"Study session")}<small>${prettyDate(s.timestamp)}</small></div><b>${s.minutes} min</b></div>`).join(""):"Your completed sessions will appear here.";
}
function renderAll(){renderDashboard();renderTasks();renderSyllabus();renderHistory();}
function addSession(minutes,topic){data.sessions.push({id:Date.now()+Math.random(),minutes,topic:topic||"Study session",timestamp:Date.now(),date:todayKey()});save();toast(`${minutes} minutes added to your study history.`);}
function showView(name){$$(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${name}`));$$(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===name));const labels={dashboard:"Dashboard",tasks:"Tasks",syllabus:"Syllabus",focus:"Focus room",history:"Study history"};$("#page-title").textContent=labels[name]||"Dashboard";window.scrollTo({top:0,behavior:"smooth"});}
$$(".nav-link").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$$("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
$("#today-label").textContent=new Date().toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"});
$("#task-form").addEventListener("submit",e=>{e.preventDefault();const title=$("#task-title").value.trim();if(!title)return;data.tasks.unshift({id:Date.now()+Math.random(),title,subject:$("#task-subject").value,priority:$("#task-priority").value,done:false,date:todayKey(),created:Date.now()});$("#task-title").value="";save();toast("Mission added.");});
document.addEventListener("change",e=>{
 if(e.target.matches("[data-task]")){const t=data.tasks.find(x=>String(x.id)===e.target.dataset.task);if(t){t.done=e.target.checked;save();}}
 if(e.target.matches("[data-chapter]")){const [si,ci]=e.target.dataset.chapter.split(":").map(Number);data.subjects[si].chapters[ci].status=e.target.value;save();toast("Chapter progress saved.");}
});
document.addEventListener("click",e=>{
 const del=e.target.closest("[data-delete]");if(del){data.tasks=data.tasks.filter(t=>String(t.id)!==del.dataset.delete);save();toast("Task deleted.");}
});
$$(".filter").forEach(b=>b.addEventListener("click",()=>{currentFilter=b.dataset.filter;renderTasks();}));
function updateTimer(){const m=Math.floor(remaining/60),s=remaining%60;$("#timer-display").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;}
function stopTimer(){if(timerId)clearInterval(timerId);timerId=null;running=false;$("#timer-start").textContent="Start session";}
function finishTimer(){stopTimer();addSession(selectedMinutes,$("#session-topic").value.trim()||"Focus session");remaining=selectedMinutes*60;updateTimer();$("#timer-status").textContent="Session complete. Nice work!";}
$$(".duration").forEach(b=>b.addEventListener("click",()=>{if(running)return;selectedMinutes=Number(b.dataset.min);remaining=selectedMinutes*60;$$(".duration").forEach(x=>x.classList.toggle("active",x===b));updateTimer();}));
$("#timer-start").addEventListener("click",()=>{if(running){stopTimer();$("#timer-status").textContent="Session paused.";return;}running=true;$("#timer-start").textContent="Pause session";$("#timer-status").textContent="Focus mode active. Keep going.";timerId=setInterval(()=>{remaining--;updateTimer();if(remaining<=0)finishTimer();},1000);});
$("#timer-reset").addEventListener("click",()=>{stopTimer();remaining=selectedMinutes*60;updateTimer();$("#timer-status").textContent="Timer reset.";});
$("#manual-log-form").addEventListener("submit",e=>{e.preventDefault();const n=Number($("#manual-minutes").value);if(!Number.isInteger(n)||n<1||n>600){toast("Enter a number from 1 to 600.");return;}addSession(n,$("#session-topic").value.trim()||"Manual study log");$("#manual-minutes").value="";});
function downloadBackup(){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`study-os-backup-${todayKey()}.json`;a.click();URL.revokeObjectURL(url);toast("Backup downloaded.");}
$("#backup-btn").addEventListener("click",downloadBackup);$("#export-btn").addEventListener("click",downloadBackup);
$("#restore-file").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!Array.isArray(d.tasks)||!Array.isArray(d.sessions)||!Array.isArray(d.subjects))throw new Error("Invalid backup");if(confirm("Restore this backup? Your current local data will be replaced.")){data=d;save();toast("Backup restored.");}}catch(err){toast("That file is not a valid STUDY OS backup.");}e.target.value="";});
if("serviceWorker" in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}
renderAll();updateTimer();
