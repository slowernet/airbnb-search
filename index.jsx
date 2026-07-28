import { useState, useMemo, useRef, useEffect } from "react";
import {
  AMENITIES, CATEGORIES, ROOM_TYPES, PROPERTY_TYPES, VISIBLE_IDS,
  CATEGORY_TAGS, UNMAPPED_CATEGORIES, PROPERTY_TYPE_IDS, FAVORITE_AMENITIES,
} from "./amenities.js";
import {
  buildSearchUrl,
  validateSearch,
  parseCodes,
  clampInt,
  todayISO,
  addDays,
  nightsBetween,
  applyStayPreset,
  matchingStayPreset,
  staySummary,
  STAY_PRESETS,
  GUEST_LIMITS,
  ROOM_MAX,
} from "./searchUrl.js";
import { loadForm, saveForm, DEFAULTS } from "./storage.js";

// Read once, before the first render, so every field can initialise from it.
const restored = loadForm();

// Several ids share a display title (Apartment 1 and 47, Room 3/42/51, Tent 16/34).
// Showing two identical pills would be unusable, so duplicates carry their id.
const PROPERTY_TYPE_ITEMS = (() => {
  const seen = {};
  for (const p of PROPERTY_TYPE_IDS) seen[p.name] = (seen[p.name] ?? 0) + 1;
  return PROPERTY_TYPE_IDS.map(p => ({
    value: p.id,
    label: seen[p.name] > 1 ? `${p.name} (${p.id})` : p.name,
    title: `property_type_id[]=${p.id}${p.weak ? ` — weaker reading: ${p.weak}` : ""}`,
  }));
})();

const FAVORITE_ITEMS = FAVORITE_AMENITIES.map(id => {
  const a = AMENITIES.find(x => x.id === id);
  return { value: id, label: a.name, title: `amenities[]=${id} — ${a.cat}` };
});

const UNMAPPED_ITEMS = UNMAPPED_CATEGORIES.map(name => ({
  value: `unmapped:${name}`,
  label: name,
  disabled: true,
  title: "Airbnb lists this category but no tag id could be recovered for it",
}));

const CATEGORY_TAG_ITEMS = CATEGORY_TAGS.map(t => ({
  value: t.id,
  label: t.name,
  title: `kg_and_tags[]=Tag:${t.id} — verified from ${t.source}`,
}));

export default function AirbnbUrlBuilder() {
const [location, setLocation] = useState(restored.location);
const [checkin, setCheckin] = useState(restored.checkin);
const [checkout, setCheckout] = useState(restored.checkout);
const [adults, setAdults] = useState(restored.adults);
const [children, setChildren] = useState(restored.children);
const [infants, setInfants] = useState(restored.infants);
const [pets, setPets] = useState(restored.pets);
const [roomTypes, setRoomTypes] = useState(restored.roomTypes);
const [l2PropertyTypes, setL2PropertyTypes] = useState(restored.l2PropertyTypes);
const [propertyTypeIds, setPropertyTypeIds] = useState(restored.propertyTypeIds);
const [priceMin, setPriceMin] = useState(restored.priceMin);
const [priceMax, setPriceMax] = useState(restored.priceMax);
const [minBedrooms, setMinBedrooms] = useState(restored.minBedrooms);
const [minBeds, setMinBeds] = useState(restored.minBeds);
const [minBathrooms, setMinBathrooms] = useState(restored.minBathrooms);
const [superhost, setSuperhost] = useState(restored.superhost);
const [selectedAmenities, setSelectedAmenities] = useState(() => new Set(restored.selectedAmenities));
const [amenitySearch, setAmenitySearch] = useState("");
const [copied, setCopied] = useState(false);
const [expandedCats, setExpandedCats] = useState(new Set());
const [customCodes, setCustomCodes] = useState(restored.customCodes);
const [categoryTags, setCategoryTags] = useState(restored.categoryTags);
const [confirmClear, setConfirmClear] = useState(false);
const clearTimer = useRef(null);
const urlRef = useRef(null);
const copyTimer = useRef(null);

useEffect(() => () => {
clearTimeout(copyTimer.current);
clearTimeout(clearTimer.current);
}, []);

// Every setter below is a plain useState, so the persisted fields are gathered here.
const persisted = {
location, checkin, checkout, adults, children, infants, pets,
roomTypes, l2PropertyTypes, propertyTypeIds, priceMin, priceMax,
minBedrooms, minBeds, minBathrooms, superhost,
selectedAmenities: [...selectedAmenities], customCodes, categoryTags,
};

// Deliberately no dependency array. A hand-listed one over nineteen fields is exactly
// how a save silently stops covering a newly added field; running after every render
// cannot drift. A stringify of this object is far cheaper than the render that
// preceded it.
useEffect(() => { saveForm(persisted); });

const resetForm = () => {
setLocation(DEFAULTS.location);
setCheckin(DEFAULTS.checkin);
setCheckout(DEFAULTS.checkout);
setAdults(DEFAULTS.adults);
setChildren(DEFAULTS.children);
setInfants(DEFAULTS.infants);
setPets(DEFAULTS.pets);
setRoomTypes(DEFAULTS.roomTypes);
setL2PropertyTypes(DEFAULTS.l2PropertyTypes);
setPropertyTypeIds(DEFAULTS.propertyTypeIds);
setPriceMin(DEFAULTS.priceMin);
setPriceMax(DEFAULTS.priceMax);
setMinBedrooms(DEFAULTS.minBedrooms);
setMinBeds(DEFAULTS.minBeds);
setMinBathrooms(DEFAULTS.minBathrooms);
setSuperhost(DEFAULTS.superhost);
setSelectedAmenities(new Set(DEFAULTS.selectedAmenities));
setCustomCodes(DEFAULTS.customCodes);
setCategoryTags(DEFAULTS.categoryTags);
setAmenitySearch("");
setExpandedCats(new Set());
};

// Two-step rather than a modal: clearing throws away a filled form with no undo, and
// the button sits next to controls people click often.
const onClearClick = () => {
clearTimeout(clearTimer.current);
if (!confirmClear) {
setConfirmClear(true);
clearTimer.current = setTimeout(() => setConfirmClear(false), 3000);
return;
}
setConfirmClear(false);
resetForm();
};

const toggleAmenity = (id) => {
setSelectedAmenities(prev => {
const next = new Set(prev);
next.has(id) ? next.delete(id) : next.add(id);
return next;
});
};
const toggleSet = (value, current, setter) => {
setter(current.includes(value) ? current.filter(v => v !== value) : [...current, value]);
};
const toggleCategory = (cat) => {
setExpandedCats(prev => {
const next = new Set(prev);
next.has(cat) ? next.delete(cat) : next.add(cat);
return next;
});
};

const filteredAmenities = useMemo(() => {
const q = amenitySearch.trim().toLowerCase();
if (!q) return AMENITIES;
// A bare number is a code lookup, not a substring match: searching "4" must mean
// Wifi, not every id that happens to contain a 4.
if (/^\d+$/.test(q)) return AMENITIES.filter(a => String(a.id) === q);
return AMENITIES.filter(a => a.name.toLowerCase().includes(q) || a.cat.toLowerCase().includes(q));
}, [amenitySearch]);

// Bucket once per search instead of rescanning all 585 rows for every category.
const amenitiesByCategory = useMemo(() => {
const map = new Map();
for (const a of filteredAmenities) {
const list = map.get(a.cat);
if (list) list.push(a);
else map.set(a.cat, [a]);
}
return map;
}, [filteredAmenities]);

const filteredCategories = useMemo(
() => CATEGORIES.filter(c => amenitiesByCategory.has(c)),
[amenitiesByCategory]
);

// Auto-expand categories when searching
const effectiveCats = amenitySearch.trim() ? new Set(CATEGORIES) : expandedCats;

const parsedCustomCodes = useMemo(() => parseCodes(customCodes), [customCodes]);
const parsedCategoryTags = useMemo(() => parseCodes(categoryTags), [categoryTags]);

// One merged set drives both the URL and the counters, so a code entered by hand
// that duplicates a chip is counted once, not twice.
const amenityCodes = useMemo(
() => [...new Set([...selectedAmenities, ...parsedCustomCodes.valid])],
[selectedAmenities, parsedCustomCodes]
);

const form = {
location, checkin, checkout, adults, children, infants, pets,
roomTypes, l2PropertyTypes, propertyTypeIds, priceMin, priceMax, minBedrooms, minBeds, minBathrooms,
superhost, amenityCodes, categoryTags: parsedCategoryTags.valid,
};

// Pills write through the same text field the user can type into, so the field stays
// the single source of truth. Tokens it couldn't parse are preserved rather than
// silently dropped when a pill is clicked.
const toggleCategoryTag = (id) => {
const { valid, invalid } = parsedCategoryTags;
const next = valid.includes(id) ? valid.filter(v => v !== id) : [...valid, id];
setCategoryTags([...next, ...invalid].join(", "));
};

// Cheap enough to run per render; memoizing would need a hand-maintained dep array
// covering every field, which is exactly how these two drift out of sync.
const generatedUrl = buildSearchUrl(form);
// Recomputed per render rather than memoized so a tab left open overnight doesn't
// keep yesterday's floor on the pickers.
const today = todayISO();
const warnings = validateSearch(form, today);

const nights = nightsBetween(checkin, checkout);
const checkoutMin = addDays(checkin || today, 1);
const activePreset = matchingStayPreset(checkin, checkout);
const summary = staySummary(checkin, checkout);

// A preset with no check-in yet anchors to today, so one click gives a usable range.
const applyPreset = (preset) => {
const from = checkin || today;
const next = applyStayPreset(from, preset);
if (!next) return; // outside the representable date range
setCheckin(from);
setCheckout(next);
};

// With a preset active, "1 month" has to keep meaning a month in whichever direction
// check-in moves. Otherwise: moving check-in past check-out would leave an invalid
// range, so shift check-out and keep the trip the same length — moving it earlier
// just extends the stay, which is a legitimate edit, so leave it alone.
const onCheckinChange = (value) => {
setCheckin(value);
if (!value) return;
if (activePreset) {
const next = applyStayPreset(value, activePreset);
if (next) setCheckout(next);
return;
}
if (!checkout || checkout > value) return;
setCheckout(addDays(value, nights ?? 1));
};

const copyUrl = async () => {
if (!generatedUrl) return;
let ok = true;
try { await navigator.clipboard.writeText(generatedUrl); }
catch {
urlRef.current?.select();
try { ok = document.execCommand("copy"); } catch { ok = false; }
}
if (!ok) return; // don't claim success the clipboard didn't deliver
setCopied(true);
clearTimeout(copyTimer.current);
copyTimer.current = setTimeout(() => setCopied(false), 2000);
};

const totalSelected = amenityCodes.length;
const hiddenCount = amenityCodes.filter(id => !VISIBLE_IDS.has(id)).length;

return (
<div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
maxWidth: 720, margin: "0 auto", padding: "24px 16px 120px 16px", color: "#222" }}>

<div style={{ marginBottom: 28 }}>
<div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:12}}>
<h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px 0", letterSpacing: "-0.3px" }}>
Airbnb Advanced Search Builder
</h1>
<button onClick={onClearClick}
title="Reset every field and forget the saved form"
style={{background:"none",border:"none",color:confirmClear?"#B3261E":"#999",fontSize:12,
fontWeight:confirmClear?600:400,cursor:"pointer",whiteSpace:"nowrap",padding:"4px 0"}}>
{confirmClear ? "Confirm clear" : "Clear form"}
</button>
</div>
<p style={{ fontSize: 13, color: "#717171", margin: 0, lineHeight: 1.5 }}>
{AMENITIES.length} amenity codes, plus property types, superhost, and other params Airbnb doesn't fully expose.
</p>
</div>

<Section title="Location">
<input type="text" placeholder="e.g. Catskills--New-York or United-States"
value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} />
<p style={hintStyle}>Match the format Airbnb uses in its URLs. Dashes for spaces, double dashes for commas. Pasting a full Airbnb search URL works too.</p>
</Section>

<Section title={<span>Dates{summary && <span style={{fontWeight:400,fontSize:13,color:"#717171",marginLeft:8}}>{summary}</span>}</span>}>
<div style={{ display: "flex", gap: 12 }}>
<Labeled label="Check-in">
<input type="date" min={today} value={checkin}
onChange={e => onCheckinChange(e.target.value)} style={inputStyle} />
</Labeled>
<Labeled label="Check-out">
<input type="date" min={checkoutMin} value={checkout}
onChange={e => setCheckout(e.target.value)} style={inputStyle} />
</Labeled>
</div>
<div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center",marginTop:10}}>
{STAY_PRESETS.map(p => (
<button key={p.label} onClick={() => applyPreset(p)}
title={checkin ? `Check-out ${applyStayPreset(checkin, p)}` : `From today`}
style={activePreset === p ? chipOnStyle : chipOffStyle}>
{p.label}
</button>
))}
{(checkin || checkout) && (
<button onClick={() => { setCheckin(""); setCheckout(""); }}
style={{background:"none",border:"none",color:"#FF5A5F",fontSize:12,cursor:"pointer",padding:"4px 0",marginLeft:4}}>
Clear dates
</button>
)}
</div>
</Section>

<Section title="Guests">
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
{[["Adults",adults,setAdults,GUEST_LIMITS.adults],["Children",children,setChildren,GUEST_LIMITS.children],["Infants",infants,setInfants,GUEST_LIMITS.infants],["Pets",pets,setPets,GUEST_LIMITS.pets]].map(([l,v,s,m])=>(
<Labeled key={l} label={l}><input type="number" min={0} max={m} value={v} onChange={e=>s(clampInt(e.target.value,0,m))} style={inputStyle}/></Labeled>
))}
</div>
</Section>

<Section title="Room type">
<ChipRow items={ROOM_TYPES} selected={roomTypes} toggle={v => toggleSet(v, roomTypes, setRoomTypes)} />
</Section>

<Section title="Property type">
<ChipRow items={PROPERTY_TYPES} selected={l2PropertyTypes} toggle={v => toggleSet(v, l2PropertyTypes, setL2PropertyTypes)} />
<details style={{marginTop:12}}>
<summary style={{fontSize:12,color:"#717171",cursor:"pointer",userSelect:"none"}}>
{PROPERTY_TYPE_ITEMS.length} other specific property types
{propertyTypeIds.length > 0 && ` — ${propertyTypeIds.length} selected`}
</summary>
<p style={{...hintStyle, marginBottom: 8}}>
A separate parameter with its own numbering — combinable with the four above, but an
id means different things in each.
</p>
<PillGrid items={PROPERTY_TYPE_ITEMS} selected={propertyTypeIds}
toggle={v => toggleSet(v, propertyTypeIds, setPropertyTypeIds)} />
</details>
</Section>

<Section title="Price & rooms">
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
<Labeled label="Min $/night"><input type="number" min={0} placeholder="$" value={priceMin} onChange={e=>setPriceMin(e.target.value)} style={inputStyle}/></Labeled>
<Labeled label="Max $/night"><input type="number" min={priceMin || 0} placeholder="$" value={priceMax} onChange={e=>setPriceMax(e.target.value)} style={inputStyle}/></Labeled>
</div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
<Labeled label="Min bedrooms"><input type="number" min={0} max={ROOM_MAX} value={minBedrooms} onChange={e=>setMinBedrooms(e.target.value)} style={inputStyle}/></Labeled>
<Labeled label="Min beds"><input type="number" min={0} max={ROOM_MAX} value={minBeds} onChange={e=>setMinBeds(e.target.value)} style={inputStyle}/></Labeled>
<Labeled label="Min bathrooms"><input type="number" min={0} max={ROOM_MAX} step={0.5} value={minBathrooms} onChange={e=>setMinBathrooms(e.target.value)} style={inputStyle}/></Labeled>
</div>
</Section>

<Section title="Host">
<label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontSize:14 }}>
<input type="checkbox" checked={superhost} onChange={e=>setSuperhost(e.target.checked)}
style={{ width:18, height:18, accentColor:"#FF5A5F", cursor:"pointer" }} />
Superhosts only
</label>
</Section>

<Section title="Category tags">
<p style={{fontSize:12,color:"#717171",margin:"0 0 10px 0"}}>
Airbnb's knowledge graph categories (removed from UI in 2025, but the URL parameter <code style={{fontSize:11,background:"#f0f0f0",padding:"1px 4px",borderRadius:3}}>kg_and_tags[]=Tag:ID</code> still works). {CATEGORY_TAGS.length} IDs verified against Airbnb's own pages — hover a pill for its source.
</p>
<PillGrid items={CATEGORY_TAG_ITEMS} selected={parsedCategoryTags.valid} toggle={toggleCategoryTag} />
<div style={{marginTop:12}}>
<label style={labelStyle}>Tag IDs</label>
<input type="text" placeholder="Enter tag IDs separated by commas, e.g. 8175"
value={categoryTags} onChange={e => setCategoryTags(e.target.value)} style={inputStyle} />
<RejectedTokens tokens={parsedCategoryTags.invalid} />
<p style={hintStyle}>
Airbnb ignores an ID it doesn't recognise — the search runs unfiltered rather than
failing, so a wrong ID looks the same as no filter at all.
</p>
</div>
<details style={{marginTop:14}}>
<summary style={{fontSize:12,color:"#717171",cursor:"pointer",userSelect:"none"}}>
{UNMAPPED_CATEGORIES.length} categories with unknown ID
</summary>
<p style={{...hintStyle, marginBottom: 8}}>
Airbnb names these but exposes no tag ID, so there is nothing to put in the URL.
Cabins, Chalets and Dammusos are reachable under Property type, Shepherd's Huts as “Hut”.
</p>
<PillGrid items={UNMAPPED_ITEMS} selected={[]} toggle={() => {}} />
</details>
</Section>

<Section title={<span>Amenity filters{totalSelected > 0 && <span style={{fontWeight:400,fontSize:13,color:"#717171",marginLeft:8}}>{totalSelected} selected{hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ""}</span>}</span>}>
<p style={{fontSize:12,color:"#717171",margin:"0 0 10px 0"}}><strong>All</strong> selected filters must be present on a listing for it to appear in results.</p>
<PillGrid items={FAVORITE_ITEMS} selected={[...selectedAmenities]}
toggle={toggleAmenity} />
<div style={{height:12}} />
<div style={{ display:"flex", gap:8, marginBottom:12, alignItems:"center" }}>
<input type="text" placeholder="Search amenities or enter a code..."
value={amenitySearch} onChange={e => setAmenitySearch(e.target.value)}
style={{ ...inputStyle, flex:1, marginBottom:0 }} />
{totalSelected > 0 && (
<button onClick={()=>{setSelectedAmenities(new Set());setCustomCodes("");setAmenitySearch("");}}
style={{background:"none",border:"none",color:"#FF5A5F",fontSize:13,cursor:"pointer",whiteSpace:"nowrap",padding:"4px 0"}}>
Clear selections
</button>
)}
</div>

<div style={{ maxHeight:440, overflowY:"auto", border:"1px solid #e8e8e8", borderRadius:8, background:"#fafafa" }}>
{filteredCategories.length === 0 ? (
<p style={{fontSize:13,color:"#999",textAlign:"center",padding:"24px 14px",margin:0}}>
No amenity matches “{amenitySearch.trim()}”. Unlisted codes still work — enter them below.
</p>
) : filteredCategories.map(cat => {
const items = amenitiesByCategory.get(cat);
const open = effectiveCats.has(cat);
const sel = items.filter(a => selectedAmenities.has(a.id)).length;
return (
<div key={cat}>
<button onClick={() => toggleCategory(cat)} style={catButtonStyle}>
<span>{open?"▾":"▸"} {cat}
{sel > 0 && <span style={{background:"#FF5A5F",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:600,marginLeft:8}}>{sel}</span>}
</span>
<span style={{fontSize:12,color:"#999",fontWeight:400}}>{items.length}</span>
</button>
{open && (
<div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"10px 14px",borderBottom:"1px solid #eee"}}>
{items.map(a => {
const on = selectedAmenities.has(a.id);
const hidden = !VISIBLE_IDS.has(a.id);
return (
<button key={a.id} onClick={() => toggleAmenity(a.id)}
title={`amenities[]=${a.id}${hidden ? " (hidden)" : " (in UI)"}`}
style={on ? chipOnStyle : chipOffStyle}>
{hidden && !on && <span style={dotStyle}/>}
{a.name}
<span style={{fontSize:10,opacity:on?0.7:0.4}}>{a.id}</span>
</button>
);
})}
</div>
)}
</div>
);
})}
</div>

<div style={{marginTop:12}}>
<label style={labelStyle}>Custom amenity codes</label>
<input type="text" placeholder="Enter additional codes separated by commas"
value={customCodes} onChange={e => setCustomCodes(e.target.value)} style={inputStyle} />
<RejectedTokens tokens={parsedCustomCodes.invalid} />
<p style={hintStyle}>
<span style={{display:"inline-block",width:6,height:6,borderRadius:3,background:"#FF5A5F",marginRight:4,verticalAlign:"middle"}}/>
= hidden filter. Hover chips for the URL param.
</p>
</div>
</Section>

<div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"2px solid #e8e8e8",padding:"12px 16px",zIndex:100,boxShadow:"0 -2px 12px rgba(0,0,0,0.06)"}}>
<div style={{maxWidth:720,margin:"0 auto"}}>
{warnings.map(w => (
<p key={w} style={{fontSize:12,color:"#B3261E",background:"#FDECEA",borderRadius:6,padding:"6px 10px",margin:"0 0 8px 0"}}>{w}</p>
))}
{generatedUrl ? (
<div style={{display:"flex",gap:8}}>
<input ref={urlRef} type="text" value={generatedUrl} readOnly onClick={e=>e.target.select()}
style={{...inputStyle,flex:1,marginBottom:0,fontSize:12,fontFamily:"'SF Mono',Menlo,Monaco,monospace",background:"#f7f7f7"}}/>
<button onClick={copyUrl} style={{background:copied?"#222":"#FF5A5F",color:"#fff",border:"none",borderRadius:8,padding:"0 18px",fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",transition:"background 0.2s",minWidth:72}}>
{copied?"Copied":"Copy"}
</button>
<a href={generatedUrl} target="_blank" rel="noopener noreferrer"
style={{display:"flex",alignItems:"center",background:"#222",color:"#fff",border:"none",borderRadius:8,padding:"0 18px",fontSize:13,fontWeight:600,cursor:"pointer",textDecoration:"none",whiteSpace:"nowrap"}}>
Open
</a>
</div>
) : (
<div style={{padding:"10px 14px",background:"#f7f7f7",borderRadius:8,color:"#999",fontSize:13,textAlign:"center"}}>
Enter a location above to generate the search URL.
</div>
)}
</div>
</div>
</div>
);
}

function Section({title,children}) {
return <div style={{marginBottom:20}}><h2 style={{fontSize:14,fontWeight:600,color:"#222",margin:"0 0 10px 0"}}>{title}</h2>{children}</div>;
}
function Labeled({label,children}) {
return <div style={{flex:1}}><label style={labelStyle}>{label}</label>{children}</div>;
}
function RejectedTokens({tokens}) {
if (tokens.length === 0) return null;
return <p style={{...hintStyle,color:"#B3261E"}}>Ignored (not a positive whole number): {tokens.join(", ")}</p>;
}
// Dense variant of ChipRow for the long lists, matching the amenity chips. Disabled
// items render as inert rather than being hidden, so the UI shows what exists without
// offering a control that would silently do nothing.
function PillGrid({items,selected,toggle}) {
return <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
{items.map(i => {
const on = selected.includes(i.value);
return <button key={i.value} onClick={() => toggle(i.value)} disabled={i.disabled} title={i.title}
style={i.disabled ? chipDisabledStyle : on ? chipOnStyle : chipOffStyle}>
{i.label}
</button>;
})}
</div>;
}
function ChipRow({items,selected,toggle}) {
return <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
{items.map(i=><button key={i.value} onClick={()=>toggle(i.value)} style={{
padding:"6px 14px",borderRadius:20,border:`1px solid ${selected.includes(i.value)?"#222":"#ddd"}`,
background:selected.includes(i.value)?"#222":"#fff",color:selected.includes(i.value)?"#fff":"#222",
cursor:"pointer",fontSize:13,fontWeight:500,transition:"all 0.15s",lineHeight:1.3
}}>{i.label}</button>)}
</div>;
}

const inputStyle = {width:"100%",padding:"10px 12px",border:"1px solid #ddd",borderRadius:8,fontSize:14,color:"#222",background:"#fff",outline:"none",boxSizing:"border-box"};
const labelStyle = {display:"block",fontSize:12,fontWeight:500,color:"#717171",marginBottom:4};
const hintStyle = {fontSize:12,color:"#999",margin:"6px 0 0 0",lineHeight:1.4};
const catButtonStyle = {display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",
padding:"10px 14px",background:"none",border:"none",borderBottom:"1px solid #eee",
cursor:"pointer",fontSize:13,fontWeight:600,color:"#222",textAlign:"left"};
// Hoisted: these were rebuilt for all 585 chips on every keystroke.
const chipBaseStyle = {padding:"5px 10px",borderRadius:20,cursor:"pointer",fontSize:12,fontWeight:500,
transition:"all 0.15s",lineHeight:1.3,display:"inline-flex",alignItems:"center",gap:4};
const chipOnStyle = {...chipBaseStyle,border:"1px solid #222",background:"#222",color:"#fff"};
const chipOffStyle = {...chipBaseStyle,border:"1px solid #ddd",background:"#fff",color:"#484848"};
const dotStyle = {display:"inline-block",width:6,height:6,borderRadius:3,background:"#FF5A5F",flexShrink:0};
const chipDisabledStyle = {...chipBaseStyle,border:"1px dashed #ddd",background:"#fafafa",color:"#bbb",cursor:"not-allowed"};
