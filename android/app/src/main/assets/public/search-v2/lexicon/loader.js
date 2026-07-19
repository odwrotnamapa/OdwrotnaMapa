(function(){"use strict";
const FILES=["categories","brands","modifiers","transport","places"];let data=null;
const normalize=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^\p{L}\p{N}\s'.+/-]/gu," ").replace(/\s+/g," ").trim();
const esc=v=>v.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
const has=(text,phrase)=>new RegExp(`(^|\\s)${esc(normalize(phrase))}($|\\s)`).test(normalize(text));
function best(query,collection){const c=[];for(const [id,e] of Object.entries(collection||{}))for(const alias of e.aliases||[])if(has(query,alias))c.push({id,alias,entry:e,n:normalize(alias)});return c.sort((a,b)=>b.n.length-a.n.length)[0]||null}
async function load(lang="pl"){
  if(data)return data;

  if(
    lang==="pl" &&
    window.OMAP_SEARCH_V2_LEXICON_DATA_PL
  ){
    data=window.OMAP_SEARCH_V2_LEXICON_DATA_PL;
    return data;
  }

  const entries=await Promise.all(
    FILES.map(async name=>{
      const r=await fetch(
        `search-v2/lexicon/${lang}/${name}.json`
      );
      if(!r.ok){
        throw new Error(
          `Lexicon ${name}: HTTP ${r.status}`
        );
      }
      return [name,await r.json()];
    })
  );

  data=Object.fromEntries(entries);
  return data
}
const ready=load();
window.OMAP_SEARCH_V2_LEXICON=Object.freeze({ready,load,normalize,get data(){return data},matchCategory:q=>best(q,data?.categories),matchBrand:q=>best(q,data?.brands),matchPlaceConcept:q=>best(q,data?.places),matchModifiers(q){return Object.entries(data?.modifiers||{}).map(([id,e])=>best(q,{[id]:e})).filter(Boolean).sort((a,b)=>b.n.length-a.n.length)}});
})();