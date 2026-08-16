(()=>{
  const dates=["12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27"];
  const params=new URLSearchParams(location.search);
  const key=params.get("date")||"26-06-12";
  const day=window.JOURS?.[key];
  const page=document.getElementById("day-page");
  const timeline=document.getElementById("timeline-dates");

  dates.forEach(d=>{
    const e=document.createElement("span");
    e.className="timeline-date"+(key===`26-06-${d}`?" active":"");
    e.textContent=d;
    timeline.appendChild(e);
  });

  if(!day){
    page.innerHTML='<section class="day-heading"><p class="day-kicker">Prototype</p><h1 class="day-title">Journée non renseignée</h1></section>';
    return;
  }

  document.title=`${day.dateLabel} — ${day.title}`;

  const all=[];
  day.blocks.forEach(b=>{
    if(b.type==="sequence") b.photos.forEach(p=>all.push(p));
  });

  page.insertAdjacentHTML("beforeend",
    `<section class="day-heading">
      <p class="day-kicker">${esc(day.chapter)} · ${esc(day.dateLabel)}</p>
      <h1 class="day-title">${esc(day.title)}</h1>
      <p class="day-subtitle">${esc(day.subtitle)}</p>
    </section>`
  );

  let n=0;

  day.blocks.forEach(b=>{
    if(b.type==="route"){
      page.insertAdjacentHTML("beforeend",
        `<section class="route">
          <strong>✈ ${esc(b.from)} → ${esc(b.to)}</strong>
          <span>${esc(b.note)}</span>
        </section>`
      );
      return;
    }

    n++;
    const photos=b.photos.map(p=>{
      const i=all.findIndex(x=>x.src===p.src);
      return `<button class="photo-button" type="button" data-photo-index="${i}" aria-label="Ouvrir la photo ${i+1}">
        <img src="${p.src}" alt="${esc(p.alt)}" loading="lazy">
      </button>`;
    }).join("");

    page.insertAdjacentHTML("beforeend",
      `<section class="sequence">
        <p class="sequence-number">Séquence ${n}</p>
        <h2>${esc(b.title)}</h2>
        <p class="sequence-text">${esc(b.text)}</p>
        <div class="photo-grid">${photos}</div>
      </section>`
    );
  });

  page.insertAdjacentHTML("beforeend",
    `<section class="day-next">
      <p class="next-label">Prochaine étape</p>
      <p class="next-title">${esc(day.next.label)}</p>
      <p class="next-note">Le lien sera activé lorsque la page du 13 juin sera construite.</p>
    </section>`
  );

  const lb=document.getElementById("lightbox");
  const img=document.getElementById("lightbox-image");
  const count=document.getElementById("lightbox-counter");
  let cur=0;

  document.querySelectorAll(".photo-button").forEach(b=>{
    b.onclick=()=>{
      cur=+b.dataset.photoIndex;
      open();
    };
  });

  lb.querySelector(".lightbox-close").onclick=close;
  lb.querySelector(".lightbox-prev").onclick=()=>move(-1);
  lb.querySelector(".lightbox-next").onclick=()=>move(1);

  document.addEventListener("keydown",e=>{
    if(lb.hidden) return;
    if(e.key==="Escape") close();
    if(e.key==="ArrowLeft") move(-1);
    if(e.key==="ArrowRight") move(1);
  });

  function open(){
    lb.hidden=false;
    document.body.style.overflow="hidden";
    render();
  }
  function close(){
    lb.hidden=true;
    document.body.style.overflow="";
  }
  function move(d){
    cur=(cur+d+all.length)%all.length;
    render();
  }
  function render(){
    img.src=all[cur].src;
    img.alt=all[cur].alt;
    count.textContent=`${cur+1} / ${all.length}`;
  }
  function esc(v){
    return String(v)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }
})();
