import React, { useEffect, useMemo, useState } from 'react';
import { Search, Heart, ShoppingCart, Star, Trash2, Plus, Minus, X, Eye, Truck, ShieldCheck, RotateCcw, Wallet, Package, ChevronRight, Menu, User, MapPin, Phone, CheckCircle2, AlertCircle, Settings as SettingsIcon, LayoutDashboard, Tag, ClipboardList, RefreshCcw, ArrowLeft, Zap, BadgePercent, CreditCard, Banknote, Smartphone, Lock, LogOut, Store } from 'lucide-react';
import auraImg from 'container:///mnt/data/src/assets/e6d22020ace3fdf4-image_20261113_180234_1.webp';
import novaImg from 'container:///mnt/data/src/assets/d0647f2834d8badb-image_20261113_180234.webp';
import pulseImg from 'container:///mnt/data/src/assets/adedc53295a69900-image_20261113_180240_1.webp';
import aeroImg from 'container:///mnt/data/src/assets/76edebf9a4a41975-image_20261113_180243.webp';
import echoImg from 'container:///mnt/data/src/assets/67e818a8c2284c1a-image_20261113_180239.webp';
import boomImg from 'container:///mnt/data/src/assets/40f2155f966a8ceb-image_20261113_180244.webp';
import proshotImg from 'container:///mnt/data/src/assets/3403dd61c6c6fc1b-image_20261113_180240.webp';
import tabmaxImg from 'container:///mnt/data/src/assets/f06fc45098b9fe2a-image_20261113_180238.webp';

const IMAGE_MAP: Record<string,string> = { aura:auraImg, nova:novaImg, pulse:pulseImg, aero:aeroImg, echo:echoImg, boom:boomImg, proshot:proshotImg, tabmax:tabmaxImg };
const IMAGE_LABELS: Record<string,string> = { aura:'Aura Wireless Headphones', nova:'Nova X5 Smartphone', pulse:'Pulse Fit Smartwatch', aero:'AeroBook 14 Laptop', echo:'Echo Buds Pro', boom:'Boom Mini Speaker', proshot:'ProShot DSLR Camera', tabmax:'TabMax 11 Tablet' };

type Product = { id:string; name:string; category:string; price:number; mrp:number; stock:number; rating:number; description:string; specs:string[]; image:string; active:boolean; recordId?:string };
type Coupon = { id:string; code:string; type:'percent'|'flat'; value:number; minOrder:number; expiry:string; active:boolean; recordId?:string };
type CartItem = { productId:string; qty:number };
type OrderItem = { productId:string; name:string; price:number; qty:number; image:string };
type Order = { id:string; orderId:string; customer:{name:string;phone:string;pincode:string;address:string;city:string}; payment:string; items:OrderItem[]; subtotal:number; discount:number; delivery:number; total:number; couponCode:string; status:string; createdAt:string; deliveryDate:string; recordId?:string };
type ReturnReq = { id:string; orderId:string; productName:string; type:'Return'|'Replace'; reason:string; description:string; status:string; createdAt:string; recordId?:string };
type SettingsData = { storeName:string; deliveryCharge:number; freeThreshold:number; adminPassword:string; recordId?:string };

const CATEGORIES = ['All','Audio','Phones','Wearables','Computers','Cameras','Tablets'];
const ORDER_STEPS = ['Placed','Packed','Shipped','Out for Delivery','Delivered'];
const RETURN_STEPS = ['Requested','Approved','Pickup Scheduled','Completed'];

async function callApi(action:string, args:any){
  const res = await fetch("actions", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ action, args }) });
  const json = await res.json().catch(()=>({}));
  if(!res.ok || json.error) throw new Error(json.error || `Request failed (${res.status})`);
  return json.data;
}
async function listRecords(collection:string){
  const data = await callApi("records.list", { collection });
  return data.records as {id:string; value:any}[];
}
async function createRecord(collection:string, value:any, key:string){
  return await callApi("records.create", { collection, value, idempotency_key:key });
}
async function replaceRecord(collection:string, id:string, value:any){
  return await callApi("records.replace", { collection, id, value });
}
async function deleteRecord(collection:string, id:string){
  return await callApi("records.delete", { collection, id });
}

const seedProducts: Product[] = [
  { id:'p-aura', name:'Aura Wireless Headphones', category:'Audio', price:2999, mrp:4999, stock:25, rating:4.6, description:'Immersive sound with plush comfort, deep bass and all-day battery for work, travel and play.', specs:['40mm drivers with deep bass','30-hour battery life','Bluetooth 5.3 + wired mode','Built-in mic & foldable design'], image:'aura', active:true },
  { id:'p-nova', name:'Nova X5 Smartphone', category:'Phones', price:19999, mrp:24999, stock:18, rating:4.7, description:'A fast, camera-first smartphone with a bright AMOLED display and a battery that keeps up.', specs:['6.7-inch AMOLED 120Hz display','108MP triple camera','8GB RAM + 128GB storage','5000mAh battery, 67W charging'], image:'nova', active:true },
  { id:'p-pulse', name:'Pulse Fit Smartwatch', category:'Wearables', price:3499, mrp:5999, stock:32, rating:4.4, description:'Track fitness, sleep and calls from your wrist with a bright always-on style display.', specs:['1.85-inch HD display','Heart rate + SpO2 + sleep tracking','Bluetooth calling','7-day battery life'], image:'pulse', active:true },
  { id:'p-aero', name:'AeroBook 14 Laptop', category:'Computers', price:54999, mrp:69999, stock:8, rating:4.8, description:'Lightweight power for work and study — fast boot, crisp display and all-day battery.', specs:['14-inch FHD display','16GB RAM + 512GB SSD','Backlit keyboard + fingerprint','1.4kg metal body'], image:'aero', active:true },
  { id:'p-echo', name:'Echo Buds Pro', category:'Audio', price:1999, mrp:3499, stock:45, rating:4.5, description:'Pocket-sized earbuds with punchy sound, clear calls and noise cancelling for everyday use.', specs:['Active noise cancelling','32-hour total playtime','IPX5 sweat resistant','Wireless charging case'], image:'echo', active:true },
  { id:'p-boom', name:'Boom Mini Speaker', category:'Audio', price:1499, mrp:2499, stock:40, rating:4.3, description:'Big sound in a small speaker — perfect for rooms, balconies and weekend get-togethers.', specs:['16W stereo output','18-hour playtime','Bluetooth 5.3 + AUX','IPX7 water resistant'], image:'boom', active:true },
  { id:'p-proshot', name:'ProShot DSLR Camera', category:'Cameras', price:42999, mrp:54999, stock:6, rating:4.9, description:'Capture sharp photos and smooth video with a versatile kit lens for creators and families.', specs:['24.2MP APS-C sensor','18-55mm kit lens','Full HD video','Wi-Fi + Bluetooth sharing'], image:'proshot', active:true },
  { id:'p-tabmax', name:'TabMax 11 Tablet', category:'Tablets', price:22999, mrp:29999, stock:14, rating:4.6, description:'A bright 11-inch tablet for classes, movies, reading and light work on the go.', specs:['11-inch 2K display','8GB RAM + 128GB storage','Quad speakers','8000mAh battery'], image:'tabmax', active:true },
];
const seedCoupons: Coupon[] = [
  { id:'c-welcome', code:'WELCOME10', type:'percent', value:10, minOrder:0, expiry:'2027-12-31', active:true },
  { id:'c-electro', code:'ELECTRO500', type:'flat', value:500, minOrder:10000, expiry:'2027-12-31', active:true },
  { id:'c-student', code:'STUDENT15', type:'percent', value:15, minOrder:0, expiry:'2027-12-31', active:true },
];
const defaultSettings: SettingsData = { storeName:'ElectroHub', deliveryCharge:49, freeThreshold:999, adminPassword:'admin123' };

function inr(n:number){ return '₹' + Math.round(n).toLocaleString('en-IN'); }
function imgFor(p:Product|OrderItem){ if(!p.image) return auraImg; if(p.image.startsWith('http')) return p.image; return IMAGE_MAP[p.image] || auraImg; }
function discountPct(p:Product){ return Math.round((1 - p.price/p.mrp)*100); }
function Stars({v}:{v:number}){ return <span className="flex items-center gap-0.5">{[1,2,3,4,5].map(i=><Star key={i} size={13} className={i<=Math.round(v)?'fill-amber-400 text-amber-400':'fill-slate-200 text-slate-200'} />)}<span className="text-[11px] font-bold ml-1">{v}</span></span> }

export default function App(){
  const [products,setProducts]=useState<Product[]>([]);
  const [coupons,setCoupons]=useState<Coupon[]>([]);
  const [orders,setOrders]=useState<Order[]>([]);
  const [returnsList,setReturnsList]=useState<ReturnReq[]>([]);
  const [settings,setSettings]=useState<SettingsData>(defaultSettings);
  const [loading,setLoading]=useState(true);
  const [apiError,setApiError]=useState('');
  const [view,setView]=useState<'store'|'orders'|'wishlist'>('store');
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState('All');
  const [sort,setSort]=useState('Featured');
  const [priceFilter,setPriceFilter]=useState('All');
  const [cart,setCart]=useState<CartItem[]>([]);
  const [wishlist,setWishlist]=useState<string[]>([]);
  const [quick,setQuick]=useState<Product|null>(null);
  const [quickQty,setQuickQty]=useState(1);
  const [cartOpen,setCartOpen]=useState(false);
  const [checkoutOpen,setCheckoutOpen]=useState(false);
  const [checkoutSuccess,setCheckoutSuccess]=useState<Order|null>(null);
  const [couponInput,setCouponInput]=useState('');
  const [appliedCoupon,setAppliedCoupon]=useState<Coupon|null>(null);
  const [couponMsg,setCouponMsg]=useState('');
  const [toasts,setToasts]=useState<{id:number;msg:string}[]>([]);
  const [showAdminPass,setShowAdminPass]=useState(false);
  const [adminPassInput,setAdminPassInput]=useState('');
  const [adminPassError,setAdminPassError]=useState('');
  const [adminOpen,setAdminOpen]=useState(false);
  const [adminTab,setAdminTab]=useState<'overview'|'products'|'coupons'|'orders'|'returns'|'settings'>('overview');
  const [mobileNav,setMobileNav]=useState(false);
  const [form,setForm]=useState({name:'',phone:'',pincode:'',address:'',city:'',payment:'Cash on Delivery'});
  const [formError,setFormError]=useState('');
  const [placing,setPlacing]=useState(false);
  const [returnModal,setReturnModal]=useState<Order|null>(null);
  const [returnForm,setReturnForm]=useState({type:'Return' as 'Return'|'Replace', reason:'Damaged', description:'', productName:''});
  const [adminOrderSearch,setAdminOrderSearch]=useState('');
  const [adminOrderFilter,setAdminOrderFilter]=useState('All');
  const [editingProduct,setEditingProduct]=useState<Product|null>(null);
  const [productForm,setProductForm]=useState({name:'',category:'Audio',price:'',mrp:'',stock:'',description:'',specs:'',image:'aura',imageUrl:''});
  const [showProductForm,setShowProductForm]=useState(false);
  const [couponForm,setCouponForm]=useState({code:'',type:'percent' as 'percent'|'flat',value:'',minOrder:'',expiry:'2027-12-31',active:true});
  const [showCouponForm,setShowCouponForm]=useState(false);
  const [settingsForm,setSettingsForm]=useState({storeName:'ElectroHub',deliveryCharge:'49',freeThreshold:'999',newPassword:'',confirmPassword:''});
  const [savingAdmin,setSavingAdmin]=useState(false);

  const toast=(msg:string)=>{ const id=Date.now()+Math.random(); setToasts(t=>[...t,{id,msg}]); setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3200); };

  async function reloadRecords(){
    const [p,c,o,r,s] = await Promise.all([listRecords("electrohub_products"), listRecords("electrohub_coupons"), listRecords("electrohub_orders"), listRecords("electrohub_returns"), listRecords("electrohub_settings")]);
    setProducts(p.map(x=>({...x.value, recordId:x.id})));
    setCoupons(c.map(x=>({...x.value, recordId:x.id})));
    setOrders(o.map(x=>({...x.value, recordId:x.id})).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));
    setReturnsList(r.map(x=>({...x.value, recordId:x.id})).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));
    if(s.length>0) { setSettings({...s[0].value, recordId:s[0].id}); setSettingsForm({storeName:s[0].value.storeName,deliveryCharge:String(s[0].value.deliveryCharge),freeThreshold:String(s[0].value.freeThreshold),newPassword:'',confirmPassword:''}); }
    return {p,c,o,r,s};
  }

  useEffect(()=>{ (async()=>{
    try{
      const data = await reloadRecords();
      if(data.p.length===0){
        for(const row of seedProducts){ await createRecord("electrohub_products", row, `seed-product-${row.id}`); }
        for(const row of seedCoupons){ await createRecord("electrohub_coupons", row, `seed-coupon-${row.id}`); }
        await createRecord("electrohub_settings", defaultSettings, `seed-settings-v1`);
        await reloadRecords();
      }
    }catch(e:any){ setApiError('Saved data could not be loaded. Showing the demo catalogue — your changes will be retried when the service is available.'); setProducts(seedProducts); setCoupons(seedCoupons); setSettings(defaultSettings); setSettingsForm({storeName:'ElectroHub',deliveryCharge:'49',freeThreshold:'999',newPassword:'',confirmPassword:''}); }
    finally{ setLoading(false); }
  })(); },[]);

  const visibleProducts = useMemo(()=>{
    let list = products.filter(p=>p.active);
    if(category!=='All') list=list.filter(p=>p.category===category);
    if(search.trim()) list=list.filter(p=> (p.name+' '+p.category+' '+p.description).toLowerCase().includes(search.toLowerCase()));
    if(priceFilter==='Under 5000') list=list.filter(p=>p.price<5000);
    if(priceFilter==='5000 - 20000') list=list.filter(p=>p.price>=5000 && p.price<=20000);
    if(priceFilter==='Above 20000') list=list.filter(p=>p.price>20000);
    if(sort==='Price Low to High') list=[...list].sort((a,b)=>a.price-b.price);
    if(sort==='Price High to Low') list=[...list].sort((a,b)=>b.price-a.price);
    if(sort==='Rating') list=[...list].sort((a,b)=>b.rating-a.rating);
    return list;
  },[products,category,search,sort,priceFilter]);

  const cartDetailed = cart.map(ci=>{ const p=products.find(x=>x.id===ci.productId); return p?{product:p,qty:ci.qty}:null; }).filter(Boolean) as {product:Product;qty:number}[];
  const subtotal = cartDetailed.reduce((s,x)=>s+x.product.price*x.qty,0);
  const discount = appliedCoupon ? (appliedCoupon.type==='percent'? Math.round(subtotal*appliedCoupon.value/100) : Math.min(appliedCoupon.value, subtotal)) : 0;
  const delivery = cart.length===0?0: (subtotal-discount >= settings.freeThreshold ? 0 : settings.deliveryCharge);
  const grandTotal = Math.max(0, subtotal - discount + delivery);
  const cartCount = cart.reduce((s,x)=>s+x.qty,0);

  function addToCart(id:string, qty=1){
    const p=products.find(x=>x.id===id); if(!p) return;
    if(p.stock<=0){ toast('This product is out of stock'); return; }
    setCart(prev=>{ const ex=prev.find(x=>x.productId===id); if(ex) return prev.map(x=>x.productId===id?{...x,qty:Math.min(p.stock,x.qty+qty)}:x); return [...prev,{productId:id,qty:Math.min(p.stock,qty)}]; });
    toast(`${p.name} added to cart`);
  }
  function buyNow(p:Product){ addToCart(p.id,1); setCartOpen(true); }
  function toggleWish(id:string){ setWishlist(w=> w.includes(id)? w.filter(x=>x!==id) : [...w,id]); }
  function applyCoupon(){
    const code=couponInput.trim().toUpperCase(); if(!code){ setCouponMsg('Enter a coupon code'); return; }
    const c=coupons.find(x=>x.code===code);
    if(!c){ setCouponMsg('Invalid coupon code'); setAppliedCoupon(null); return; }
    if(!c.active){ setCouponMsg('This coupon is not active'); return; }
    if(new Date(c.expiry) < new Date(new Date().toDateString())){ setCouponMsg('This coupon has expired'); return; }
    if(subtotal < c.minOrder){ setCouponMsg(`Needs minimum order of ${inr(c.minOrder)}`); return; }
    setAppliedCoupon(c); setCouponMsg(''); toast(`Coupon ${c.code} applied`);
  }
  function removeCoupon(){ setAppliedCoupon(null); setCouponInput(''); }

  async function placeOrder(){
    if(!form.name.trim()||!form.phone.trim()||!form.pincode.trim()||!form.address.trim()||!form.city.trim()){ setFormError('Please fill all delivery fields.'); return; }
    if(!/^\d{10}$/.test(form.phone.trim())){ setFormError('Enter a valid 10-digit phone number.'); return; }
    if(!/^\d{6}$/.test(form.pincode.trim())){ setFormError('Enter a valid 6-digit pincode.'); return; }
    if(cart.length===0){ setFormError('Your cart is empty.'); return; }
    setPlacing(true); setFormError('');
    const orderId='EH-'+Math.floor(100000+Math.random()*900000);
    const deliveryDate=new Date(Date.now()+4*86400000).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
    const order:Order={ id:orderId, orderId, customer:{...form}, payment:form.payment, items:cartDetailed.map(x=>({productId:x.product.id,name:x.product.name,price:x.product.price,qty:x.qty,image:x.product.image})), subtotal, discount, delivery, total:grandTotal, couponCode:appliedCoupon?.code||'', status:'Placed', createdAt:new Date().toISOString(), deliveryDate };
    try{
      const created = await createRecord("electrohub_orders", order, `order-${orderId}`);
      // reduce stock
      for(const item of cartDetailed){
        const prod=item.product; const next={...prod, stock:Math.max(0, prod.stock-item.qty)}; delete (next as any).recordId;
        if(prod.recordId) await replaceRecord("electrohub_products", prod.recordId, next);
      }
      await reloadRecords();
      setCheckoutSuccess({...order, recordId:created?.id}); setCart([]); setAppliedCoupon(null); setCouponInput(''); setCheckoutOpen(false); toast('Order placed successfully');
    }catch(e:any){ setFormError(e.message||'Could not place order. Please try again.'); }
    finally{ setPlacing(false); }
  }

  async function cancelOrder(order:Order){
    if(!order.recordId){ toast('Order record not available'); return; }
    try{ const next={...order, status:'Cancelled'}; delete (next as any).recordId; await replaceRecord("electrohub_orders", order.recordId, next); await reloadRecords(); toast('Order cancelled'); }catch(e:any){ toast(e.message); }
  }
  async function submitReturn(){
    if(!returnModal) return;
    if(!returnForm.productName){ toast('Choose a product'); return; }
    const req:ReturnReq={ id:'RET-'+Date.now(), orderId:returnModal.orderId, productName:returnForm.productName, type:returnForm.type, reason:returnForm.reason, description:returnForm.description||'No additional details', status:'Requested', createdAt:new Date().toISOString() };
    try{ await createRecord("electrohub_returns", req, `return-${req.id}`); await reloadRecords(); setReturnModal(null); toast('Return / Replace request submitted'); }catch(e:any){ toast(e.message); }
  }

  // ADMIN
  function openAdmin(){ setShowAdminPass(true); setAdminPassError(''); setAdminPassInput(''); }
  function submitAdminPass(){ if(adminPassInput===settings.adminPassword){ setShowAdminPass(false); setAdminOpen(true); setAdminTab('overview'); } else setAdminPassError('Incorrect password. Try again.'); }
  async function adminSaveProduct(){
    if(!productForm.name.trim()||!productForm.price||!productForm.mrp){ toast('Enter product name, price and MRP'); return; }
    setSavingAdmin(true);
    const image = productForm.imageUrl.trim() ? productForm.imageUrl.trim() : productForm.image;
    const specs = productForm.specs.split('\n').map(s=>s.trim()).filter(Boolean);
    const payload:Product = { id: editingProduct?.id || 'p-'+Date.now(), name:productForm.name.trim(), category:productForm.category, price:Number(productForm.price), mrp:Number(productForm.mrp), stock:Number(productForm.stock||0), rating:editingProduct?.rating||4.5, description:productForm.description||'Quality electronics with 1 year warranty and 7-day return/replace.', specs: specs.length?specs:['1 year warranty','7-day return / replace','Cash on Delivery available'], image, active: editingProduct?.active ?? true };
    try{
      if(editingProduct?.recordId){ await replaceRecord("electrohub_products", editingProduct.recordId, payload); }
      else { await createRecord("electrohub_products", payload, `product-${payload.id}`); }
      await reloadRecords(); setShowProductForm(false); setEditingProduct(null); toast('Product saved');
    }catch(e:any){ toast(e.message); }
    setSavingAdmin(false);
  }
  async function adminDeleteProduct(p:Product){ if(!p.recordId) return; try{ await deleteRecord("electrohub_products", p.recordId); await reloadRecords(); toast('Product deleted'); }catch(e:any){ toast(e.message); } }
  async function adminToggleProduct(p:Product){ if(!p.recordId) return; const next={...p, active:!p.active}; delete (next as any).recordId; try{ await replaceRecord("electrohub_products", p.recordId, next); await reloadRecords(); }catch(e:any){ toast(e.message); } }
  async function adminSaveCoupon(){
    if(!couponForm.code.trim()||!couponForm.value){ toast('Enter coupon code and value'); return; }
    setSavingAdmin(true);
    const payload:Coupon={ id:'c-'+Date.now(), code:couponForm.code.trim().toUpperCase(), type:couponForm.type, value:Number(couponForm.value), minOrder:Number(couponForm.minOrder||0), expiry:couponForm.expiry, active:couponForm.active };
    try{ await createRecord("electrohub_coupons", payload, `coupon-${payload.code}-${payload.id}`); await reloadRecords(); setShowCouponForm(false); toast('Coupon saved'); }catch(e:any){ toast(e.message); }
    setSavingAdmin(false);
  }
  async function adminDeleteCoupon(c:Coupon){ if(!c.recordId) return; try{ await deleteRecord("electrohub_coupons", c.recordId); await reloadRecords(); toast('Coupon deleted'); }catch(e:any){ toast(e.message); } }
  async function adminToggleCoupon(c:Coupon){ if(!c.recordId) return; const next={...c, active:!c.active}; delete (next as any).recordId; try{ await replaceRecord("electrohub_coupons", c.recordId, next); await reloadRecords(); }catch(e:any){ toast(e.message); } }
  async function adminChangeOrderStatus(o:Order, status:string){ if(!o.recordId) return; const next={...o, status}; delete (next as any).recordId; try{ await replaceRecord("electrohub_orders", o.recordId, next); await reloadRecords(); toast(`Order ${o.orderId} → ${status}`); }catch(e:any){ toast(e.message); } }
  async function adminChangeReturnStatus(r:ReturnReq, status:string){ if(!r.recordId) return; const next={...r, status}; delete (next as any).recordId; try{ await replaceRecord("electrohub_returns", r.recordId, next); await reloadRecords(); toast(`Return ${r.id} → ${status}`); }catch(e:any){ toast(e.message); } }
  async function adminSaveSettings(){
    if(settingsForm.newPassword && settingsForm.newPassword!==settingsForm.confirmPassword){ toast('New passwords do not match'); return; }
    setSavingAdmin(true);
    const payload:SettingsData={ storeName:settingsForm.storeName||'ElectroHub', deliveryCharge:Number(settingsForm.deliveryCharge||49), freeThreshold:Number(settingsForm.freeThreshold||999), adminPassword: settingsForm.newPassword || settings.adminPassword };
    try{
      if(settings.recordId) await replaceRecord("electrohub_settings", settings.recordId, payload);
      else await createRecord("electrohub_settings", payload, `settings-${Date.now()}`);
      await reloadRecords(); setSettingsForm({...settingsForm,newPassword:'',confirmPassword:''}); toast('Settings saved');
    }catch(e:any){ toast(e.message); }
    setSavingAdmin(false);
  }
  async function resetDemo(){
    setSavingAdmin(true);
    try{
      const [p,c,o,r] = await Promise.all([listRecords("electrohub_products"), listRecords("electrohub_coupons"), listRecords("electrohub_orders"), listRecords("electrohub_returns")]);
      for(const x of [...p,...c,...o,...r]){ /* delete by collection guess via id prefix is not reliable, delete from known collections */ }
      // delete explicitly per collection
      for(const x of p) await deleteRecord("electrohub_products", x.id);
      for(const x of c) await deleteRecord("electrohub_coupons", x.id);
      for(const x of o) await deleteRecord("electrohub_orders", x.id);
      for(const x of r) await deleteRecord("electrohub_returns", x.id);
      for(const row of seedProducts) await createRecord("electrohub_products", row, `reset-product-${row.id}-${Date.now()}`);
      for(const row of seedCoupons) await createRecord("electrohub_coupons", row, `reset-coupon-${row.id}-${Date.now()}`);
      await reloadRecords(); toast('Demo data restored');
    }catch(e:any){ toast(e.message); }
    setSavingAdmin(false);
  }

  const revenue = orders.filter(o=>o.status!=='Cancelled').reduce((s,o)=>s+o.total,0);
  const lowStock = products.filter(p=>p.stock<=10);
  const adminOrders = orders.filter(o=> (adminOrderSearch? o.orderId.toLowerCase().includes(adminOrderSearch.toLowerCase()) : true) && (adminOrderFilter==='All'||o.status===adminOrderFilter));

  if(loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--surface)]"><div className="text-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"/><p className="mt-3 font-bold">Loading ElectroHub…</p></div></div>;

  if(adminOpen) return (
    <div className="min-h-screen bg-[var(--surface)]">
      <header data-safe-area-sticky-top style={{top:'var(--safe-area-inset-top)'}} className="sticky z-30 bg-[#0b1220] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2"><div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-display font-extrabold">E</div><div><p className="font-display font-extrabold leading-none">ElectroHub <span className="text-amber-400">Admin</span></p><p className="text-[11px] text-slate-400">Store control centre</p></div></div>
        <div className="flex gap-2"><button onClick={()=>setAdminOpen(false)} className="px-3 py-2 bg-white/10 rounded-lg text-sm font-bold flex items-center gap-1"><Store size={15}/> Back to Store</button><button onClick={()=>{setAdminOpen(false); toast('Logged out of admin');}} className="px-3 py-2 bg-red-600 rounded-lg text-sm font-bold flex items-center gap-1"><LogOut size={15}/> Logout</button></div>
      </header>
      <div className="flex flex-col lg:flex-row">
        <aside className="lg:w-60 shrink-0 bg-[var(--surface-2)] border-b lg:border-b-0 lg:border-r border-[var(--line)] p-3">
          <div className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar">
            {([['overview','Overview',LayoutDashboard],['products','Products',Package],['coupons','Coupons',Tag],['orders','Orders',ClipboardList],['returns','Returns',RefreshCcw],['settings','Settings',SettingsIcon]] as const).map(([k,label,Icon])=><button key={k} onClick={()=>setAdminTab(k)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap ${adminTab===k?'bg-blue-600 text-white':'text-[var(--muted)]'}`}><Icon size={17}/>{label}</button>)}
          </div>
          <div className="hidden lg:block mt-6 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs leading-relaxed text-amber-900"><b>Tip:</b> Changes save to the store instantly. Prices, stock and coupons update on the storefront.</div>
        </aside>
        <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full">
          {adminTab==='overview' && <div>
            <h1 className="font-display text-2xl font-extrabold">Overview</h1><p className="text-sm text-[var(--muted)]">Today at a glance</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {[['Total Revenue',inr(revenue),'All confirmed orders'],['Total Orders',String(orders.length),'Placed on ElectroHub'],['Total Products',String(products.length),'In catalogue'],['Pending Returns',String(returnsList.filter(r=>r.status==='Requested').length),'Needs review']].map(([l,v,s])=><div key={l} className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-4"><p className="text-xs font-bold text-[var(--muted)] uppercase">{l}</p><p className="font-display text-2xl font-extrabold mt-1">{v}</p><p className="text-xs text-[var(--muted)]">{s}</p></div>)}
            </div>
            <div className="grid lg:grid-cols-2 gap-4 mt-4">
              <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-4"><h3 className="font-bold flex items-center gap-2"><AlertCircle size={17} className="text-amber-500"/> Low stock alerts</h3>{lowStock.length===0?<p className="text-sm text-[var(--muted)] mt-2">All products are well stocked.</p>:lowStock.map(p=><div key={p.id} className="flex justify-between py-2 border-b border-[var(--line)] text-sm"><span>{p.name}</span><b className={p.stock===0?'text-red-600':'text-amber-600'}>{p.stock===0?'Out of stock':`${p.stock} left`}</b></div>)}</div>
              <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-4"><h3 className="font-bold">Recent orders</h3>{orders.length===0?<p className="text-sm text-[var(--muted)] mt-2">No orders yet.</p>:orders.slice(0,5).map(o=><div key={o.id} className="flex justify-between py-2 border-b border-[var(--line)] text-sm"><span><b>{o.orderId}</b> • {o.customer.name}</span><span>{inr(o.total)} • {o.status}</span></div>)}</div>
            </div>
          </div>}
          {adminTab==='products' && <div>
            <div className="flex flex-wrap justify-between gap-3 items-center"><div><h1 className="font-display text-2xl font-extrabold">Products</h1><p className="text-sm text-[var(--muted)]">{products.length} products</p></div><button onClick={()=>{setEditingProduct(null); setProductForm({name:'',category:'Audio',price:'',mrp:'',stock:'',description:'',specs:'',image:'aura',imageUrl:''}); setShowProductForm(true);}} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-1"><Plus size={17}/> Add New Product</button></div>
            {showProductForm && <div className="mt-4 bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-4 grid sm:grid-cols-2 gap-3">
              <label className="text-sm font-bold">Product name<input value={productForm.name} onChange={e=>setProductForm({...productForm,name:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5" placeholder="e.g. SoundMax Speaker"/></label>
              <label className="text-sm font-bold">Category<select value={productForm.category} onChange={e=>setProductForm({...productForm,category:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5">{CATEGORIES.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}</select></label>
              <label className="text-sm font-bold">Price (₹)<input type="number" value={productForm.price} onChange={e=>setProductForm({...productForm,price:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5"/></label>
              <label className="text-sm font-bold">MRP (₹)<input type="number" value={productForm.mrp} onChange={e=>setProductForm({...productForm,mrp:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5"/></label>
              <label className="text-sm font-bold">Stock<input type="number" value={productForm.stock} onChange={e=>setProductForm({...productForm,stock:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5"/></label>
              <label className="text-sm font-bold">Choose existing image<select value={productForm.image} onChange={e=>setProductForm({...productForm,image:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5">{Object.entries(IMAGE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
              <label className="text-sm font-bold sm:col-span-2">Or paste image URL<input value={productForm.imageUrl} onChange={e=>setProductForm({...productForm,imageUrl:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5" placeholder="https://…"/></label>
              <label className="text-sm font-bold sm:col-span-2">Description<textarea value={productForm.description} onChange={e=>setProductForm({...productForm,description:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5" rows={2}/></label>
              <label className="text-sm font-bold sm:col-span-2">Specs (one per line)<textarea value={productForm.specs} onChange={e=>setProductForm({...productForm,specs:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5" rows={3} placeholder={'Feature one\nFeature two'}/></label>
              <div className="sm:col-span-2 flex gap-2"><button disabled={savingAdmin} onClick={adminSaveProduct} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50">{savingAdmin?'Saving…':'Save Product'}</button><button onClick={()=>setShowProductForm(false)} className="px-4 py-2.5 border border-[var(--line)] rounded-xl font-bold">Cancel</button></div>
            </div>}
            <div className="mt-4 bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm min-w-[720px]"><thead className="bg-[var(--surface)] text-left"><tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Active</th><th className="p-3">Actions</th></tr></thead><tbody>{products.map(p=><tr key={p.id} className="border-t border-[var(--line)]"><td className="p-3 flex items-center gap-2"><img src={imgFor(p)} alt={p.name} className="w-11 h-11 object-cover rounded-lg"/><span className="font-bold">{p.name}</span></td><td className="p-3">{p.category}</td><td className="p-3">{inr(p.price)} <span className="line-through text-[var(--muted)]">{inr(p.mrp)}</span></td><td className="p-3">{p.stock}</td><td className="p-3"><button onClick={()=>adminToggleProduct(p)} className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.active?'bg-green-100 text-green-700':'bg-slate-200 text-slate-600'}`}>{p.active?'Active':'Hidden'}</button></td><td className="p-3"><div className="flex gap-2"><button onClick={()=>{setEditingProduct(p); setProductForm({name:p.name,category:p.category,price:String(p.price),mrp:String(p.mrp),stock:String(p.stock),description:p.description,specs:p.specs.join('\n'),image:p.image.startsWith('http')?'aura':p.image,imageUrl:p.image.startsWith('http')?p.image:''}); setShowProductForm(true);}} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-bold">Edit</button><button onClick={()=>adminDeleteProduct(p)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold">Delete</button></div></td></tr>)}</tbody></table></div></div>
          </div>}
          {adminTab==='coupons' && <div>
            <div className="flex justify-between items-center"><div><h1 className="font-display text-2xl font-extrabold">Coupons</h1><p className="text-sm text-[var(--muted)]">Manage store discounts</p></div><button onClick={()=>{setCouponForm({code:'',type:'percent',value:'',minOrder:'',expiry:'2027-12-31',active:true}); setShowCouponForm(true);}} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-1"><Plus size={17}/> Add Coupon</button></div>
            {showCouponForm && <div className="mt-4 bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-4 grid sm:grid-cols-2 gap-3">
              <label className="text-sm font-bold">Code<input value={couponForm.code} onChange={e=>setCouponForm({...couponForm,code:e.target.value.toUpperCase()})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5 uppercase" placeholder="SAVE20"/></label>
              <label className="text-sm font-bold">Type<select value={couponForm.type} onChange={e=>setCouponForm({...couponForm,type:e.target.value as any})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5"><option value="percent">Percentage %</option><option value="flat">Flat ₹</option></select></label>
              <label className="text-sm font-bold">Value<input type="number" value={couponForm.value} onChange={e=>setCouponForm({...couponForm,value:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5"/></label>
              <label className="text-sm font-bold">Min order (₹)<input type="number" value={couponForm.minOrder} onChange={e=>setCouponForm({...couponForm,minOrder:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5"/></label>
              <label className="text-sm font-bold">Expiry<input type="date" value={couponForm.expiry} onChange={e=>setCouponForm({...couponForm,expiry:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5"/></label>
              <label className="text-sm font-bold flex items-center gap-2 mt-6"><input type="checkbox" checked={couponForm.active} onChange={e=>setCouponForm({...couponForm,active:e.target.checked})} className="w-4 h-4"/> Active</label>
              <div className="sm:col-span-2 flex gap-2"><button disabled={savingAdmin} onClick={adminSaveCoupon} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold">Save Coupon</button><button onClick={()=>setShowCouponForm(false)} className="px-4 py-2.5 border border-[var(--line)] rounded-xl font-bold">Cancel</button></div>
            </div>}
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{coupons.map(c=><div key={c.id} className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-4"><div className="flex justify-between"><span className="font-display font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">{c.code}</span><button onClick={()=>adminToggleCoupon(c)} className={`text-xs font-bold px-2 py-1 rounded-full ${c.active?'bg-green-100 text-green-700':'bg-slate-200 text-slate-600'}`}>{c.active?'Active':'Inactive'}</button></div><p className="mt-3 font-bold">{c.type==='percent'?`${c.value}% off`:`${inr(c.value)} off`}</p><p className="text-xs text-[var(--muted)]">Min order {inr(c.minOrder)} • Expires {c.expiry}</p><button onClick={()=>adminDeleteCoupon(c)} className="mt-3 text-red-600 font-bold text-sm flex items-center gap-1"><Trash2 size={14}/> Delete</button></div>)}</div>
          </div>}
          {adminTab==='orders' && <div>
            <h1 className="font-display text-2xl font-extrabold">Orders</h1><p className="text-sm text-[var(--muted)]">Update status — customers see it instantly in My Orders.</p>
            <div className="flex flex-wrap gap-2 mt-4"><input value={adminOrderSearch} onChange={e=>setAdminOrderSearch(e.target.value)} placeholder="Search by Order ID…" className="border border-[var(--line)] bg-[var(--surface-2)] rounded-xl px-3 py-2.5 flex-1 min-w-[200px]"/><select value={adminOrderFilter} onChange={e=>setAdminOrderFilter(e.target.value)} className="border border-[var(--line)] bg-[var(--surface-2)] rounded-xl px-3 py-2.5"><option>All</option>{[...ORDER_STEPS,'Cancelled'].map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="space-y-3 mt-4">{adminOrders.length===0?<div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-8 text-center text-[var(--muted)]">No orders found.</div>:adminOrders.map(o=><div key={o.id} className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-display font-extrabold">{o.orderId} • {o.customer.name}</p><p className="text-sm text-[var(--muted)]">{o.customer.address}, {o.customer.city} — {o.customer.pincode} • {o.customer.phone} • {o.payment}</p><p className="text-sm mt-1">{o.items.map(i=>`${i.name} × ${i.qty}`).join(', ')}</p></div><div className="text-right"><p className="font-extrabold">{inr(o.total)}</p><label className="text-xs font-bold block mt-1">Change Status<select value={o.status} onChange={e=>adminChangeOrderStatus(o,e.target.value)} className="ml-1 border border-[var(--line)] bg-[var(--surface)] rounded-lg px-2 py-1.5 text-xs">{[...ORDER_STEPS,'Cancelled'].map(s=><option key={s}>{s}</option>)}</select></label></div></div></div>)}</div>
          </div>}
          {adminTab==='returns' && <div>
            <h1 className="font-display text-2xl font-extrabold">Returns & Replacements</h1><p className="text-sm text-[var(--muted)]">Review requests and update their status.</p>
            <div className="space-y-3 mt-4">{returnsList.length===0?<div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-8 text-center text-[var(--muted)]">No return requests yet.</div>:returnsList.map(r=><div key={r.id} className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-4 flex flex-wrap justify-between gap-3"><div><p className="font-bold">{r.type}: {r.productName} • Order {r.orderId}</p><p className="text-sm text-[var(--muted)]">Reason: {r.reason} • {r.description}</p></div><label className="text-sm font-bold">Status<select value={r.status} onChange={e=>adminChangeReturnStatus(r,e.target.value)} className="ml-2 border border-[var(--line)] bg-[var(--surface)] rounded-lg px-2 py-1.5">{[...RETURN_STEPS,'Rejected'].map(s=><option key={s}>{s}</option>)}</select></label></div>)}</div>
          </div>}
          {adminTab==='settings' && <div>
            <h1 className="font-display text-2xl font-extrabold">Settings</h1><p className="text-sm text-[var(--muted)]">Store and admin preferences</p>
            <div className="mt-4 bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-4 grid sm:grid-cols-2 gap-3 max-w-3xl">
              <label className="text-sm font-bold">Store Name<input value={settingsForm.storeName} onChange={e=>setSettingsForm({...settingsForm,storeName:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5"/></label>
              <label className="text-sm font-bold">Delivery Charge (₹)<input type="number" value={settingsForm.deliveryCharge} onChange={e=>setSettingsForm({...settingsForm,deliveryCharge:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5"/></label>
              <label className="text-sm font-bold">Free Delivery Threshold (₹)<input type="number" value={settingsForm.freeThreshold} onChange={e=>setSettingsForm({...settingsForm,freeThreshold:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5"/></label>
              <label className="text-sm font-bold">New Admin Password<input type="password" value={settingsForm.newPassword} onChange={e=>setSettingsForm({...settingsForm,newPassword:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5" placeholder="Leave blank to keep current"/></label>
              <label className="text-sm font-bold sm:col-span-2">Confirm New Password<input type="password" value={settingsForm.confirmPassword} onChange={e=>setSettingsForm({...settingsForm,confirmPassword:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5"/></label>
              <div className="sm:col-span-2 flex flex-wrap gap-2"><button disabled={savingAdmin} onClick={adminSaveSettings} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold">Save Settings</button><button onClick={resetDemo} disabled={savingAdmin} className="px-4 py-2.5 border border-amber-300 bg-amber-50 text-amber-800 rounded-xl font-bold">Reset Demo Data</button></div>
              <p className="sm:col-span-2 text-xs text-[var(--muted)]">Storage limit: the store keeps up to 1,000 saved records. Reset clears orders, returns, products and coupons and restores the demo catalogue.</p>
            </div>
          </div>}
        </main>
      </div>
      <div className="fixed bottom-4 right-4 z-40 space-y-2">{toasts.map(t=><div key={t.id} className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-sm font-bold flex gap-2"><CheckCircle2 size={17} className="text-green-400"/>{t.msg}</div>)}</div>
    </div>
  );

  return (
    <div data-safe-area-inset-root style={{boxSizing:'border-box',paddingTop:'var(--safe-area-inset-top)'}} className="min-h-screen bg-[var(--surface)] text-[var(--ink)] overflow-x-clip">
      {/* Announcement */}
      <div className="bg-[#0b1220] text-white text-[11px] sm:text-xs text-center px-3 py-2 font-semibold">Free delivery above {inr(settings.freeThreshold)} &nbsp;|&nbsp; Coupons: <b className="text-amber-400">WELCOME10</b> (10% off) • <b className="text-amber-400">ELECTRO500</b> (₹500 off above ₹10,000)</div>
      {/* Header */}
      <header data-safe-area-sticky-top style={{top:'var(--safe-area-inset-top)'}} className="sticky z-30 bg-[var(--surface-2)]/95 backdrop-blur border-b border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 py-3 flex items-center gap-2 sm:gap-4">
          <button onClick={()=>{setView('store'); window.scrollTo({top:0,behavior:'smooth'});}} className="flex items-center gap-2 shrink-0"><span className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-display font-extrabold text-lg">E</span><span className="font-display font-extrabold text-lg sm:text-xl leading-none">{settings.storeName}<span className="block text-[10px] font-sans font-bold tracking-widest text-blue-600">ELECTRONICS STORE</span></span></button>
          <div className="hidden md:flex flex-1 max-w-xl items-center bg-[var(--surface)] border border-[var(--line)] rounded-full px-3 py-2"><Search size={18} className="text-[var(--muted)]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search headphones, phones, laptops…" className="bg-transparent outline-none w-full px-2 text-sm"/></div>
          <div className="flex-1 md:hidden"/>
          <button onClick={()=>setView('wishlist')} className="relative p-2.5 rounded-full hover:bg-[var(--surface)]" aria-label="Wishlist"><Heart size={21} className={wishlist.length?'fill-red-500 text-red-500':''}/>{wishlist.length>0 && <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{wishlist.length}</span>}</button>
          <button onClick={()=>setCartOpen(true)} className="relative p-2.5 rounded-full hover:bg-[var(--surface)]" aria-label="Cart"><ShoppingCart size={21}/>{cartCount>0 && <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>}</button>
          <button onClick={()=>setView('orders')} className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-full text-sm font-bold"><Package size={16}/> My Orders</button>
          <button onClick={()=>setMobileNav(!mobileNav)} className="md:hidden p-2" aria-label="Menu"><Menu size={22}/></button>
        </div>
        <div className="md:hidden px-3 pb-2"><div className="flex items-center bg-[var(--surface)] border border-[var(--line)] rounded-full px-3 py-2"><Search size={18} className="text-[var(--muted)]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products…" className="bg-transparent outline-none w-full px-2 text-sm"/></div></div>
        {mobileNav && <div className="md:hidden px-3 pb-3 flex gap-2"><button onClick={()=>{setView('orders'); setMobileNav(false);}} className="flex-1 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm">My Orders</button><button onClick={()=>{setView('store'); setMobileNav(false);}} className="flex-1 py-2 border border-[var(--line)] rounded-xl font-bold text-sm">Shop</button><button onClick={()=>{setView('wishlist'); setMobileNav(false);}} className="flex-1 py-2 border border-[var(--line)] rounded-xl font-bold text-sm">Wishlist</button></div>}
        <nav className="hidden md:flex max-w-7xl mx-auto px-5 pb-2 gap-1 overflow-x-auto no-scrollbar">{CATEGORIES.map(c=><button key={c} onClick={()=>{setCategory(c); setView('store');}} className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap ${category===c?'bg-blue-600 text-white':'hover:bg-[var(--surface)]'}`}>{c}</button>)}</nav>
      </header>

      {apiError && <div className="max-w-7xl mx-auto px-4 mt-3 bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-xl px-3 py-2 flex gap-2"><AlertCircle size={17} className="shrink-0 mt-0.5"/>{apiError}</div>}

      {view==='store' && <>
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-3 sm:px-5 pt-4"><div className="overflow-hidden rounded-[24px] bg-[#0b1220] text-white grid md:grid-cols-2"><div className="p-6 sm:p-10"><span className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-xs font-bold"><Zap size={13} className="text-amber-400"/> NEW SEASON • UP TO 40% OFF</span><h1 className="font-display font-extrabold leading-[1.05] mt-4" style={{fontSize:'clamp(32px,6vw,56px)'}}>Tech You Love,<br/><span className="text-amber-400">Prices You'll Love</span></h1><p className="text-slate-300 mt-3 max-w-md text-sm sm:text-base">Latest audio, phones, laptops & cameras — genuine products, 1-year warranty and 7-day easy return.</p><div className="flex flex-wrap gap-2 mt-6"><button onClick={()=>document.getElementById('products')?.scrollIntoView({behavior:'smooth'})} className="px-6 py-3 bg-blue-600 rounded-full font-bold">Shop Now</button><button onClick={()=>{setSort('Price Low to High'); document.getElementById('products')?.scrollIntoView({behavior:'smooth'});}} className="px-6 py-3 bg-white text-slate-900 rounded-full font-bold">Explore Deals</button></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 text-xs font-bold"><span className="flex gap-1.5 items-center"><Truck size={16} className="text-green-400"/> Free Delivery</span><span className="flex gap-1.5 items-center"><ShieldCheck size={16} className="text-green-400"/> 1 Year Warranty</span><span className="flex gap-1.5 items-center"><RotateCcw size={16} className="text-green-400"/> 7-Day Easy Return</span><span className="flex gap-1.5 items-center"><Wallet size={16} className="text-green-400"/> COD Available</span></div></div><div className="relative min-h-[240px]"><img src={auraImg} alt="Aura Wireless Headphones" className="absolute inset-0 w-full h-full object-cover"/><div className="absolute bottom-4 left-4 bg-white text-slate-900 rounded-2xl px-4 py-3 shadow-xl"><p className="text-[11px] font-bold text-[var(--muted)]">BESTSELLER</p><p className="font-display font-extrabold">Aura Wireless Headphones</p><p className="text-sm"><b className="text-blue-700">{inr(2999)}</b> <span className="line-through text-slate-400">{inr(4999)}</span> <span className="text-green-600 font-bold">40% off</span></p></div></div></div></section>

        {/* Filters */}
        <section id="products" className="max-w-7xl mx-auto px-3 sm:px-5 pt-6">
          <div className="flex flex-wrap gap-2 items-center"><div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">{CATEGORIES.map(c=><button key={c} onClick={()=>setCategory(c)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border ${category===c?'bg-slate-900 text-white border-slate-900':'bg-[var(--surface-2)] border-[var(--line)]'}`}>{c}</button>)}</div></div>
          <div className="flex flex-wrap gap-2 mt-3"><label className="flex items-center gap-2 bg-[var(--surface-2)] border border-[var(--line)] rounded-xl px-3 py-2 text-sm font-bold">Sort <select value={sort} onChange={e=>setSort(e.target.value)} className="bg-transparent outline-none font-bold"><option>Featured</option><option>Price Low to High</option><option>Price High to Low</option><option>Rating</option></select></label><label className="flex items-center gap-2 bg-[var(--surface-2)] border border-[var(--line)] rounded-xl px-3 py-2 text-sm font-bold">Price <select value={priceFilter} onChange={e=>setPriceFilter(e.target.value)} className="bg-transparent outline-none font-bold"><option>All</option><option>Under 5000</option><option>5000 - 20000</option><option>Above 20000</option></select></label><span className="self-center text-sm text-[var(--muted)] font-semibold">{visibleProducts.length} products</span></div>
        </section>

        {/* Grid */}
        <section className="max-w-7xl mx-auto px-3 sm:px-5 py-5"><div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {visibleProducts.map(p=>(
            <article key={p.id} className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl overflow-hidden flex flex-col hover:shadow-xl transition-shadow">
              <div className="relative aspect-[4/3] bg-white overflow-hidden"><img src={imgFor(p)} alt={p.name} className="w-full h-full object-cover"/><span className="absolute top-2 left-2 bg-green-600 text-white text-[11px] font-extrabold px-2 py-1 rounded-full">{discountPct(p)}% OFF</span><button onClick={()=>toggleWish(p.id)} aria-label="Toggle wishlist" className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center"><Heart size={17} className={wishlist.includes(p.id)?'fill-red-500 text-red-500':''}/></button></div>
              <div className="p-3 flex flex-col flex-1"><p className="text-[11px] font-bold tracking-wide text-blue-600 uppercase">{p.category}</p><h3 className="font-bold leading-snug line-clamp-2 min-h-[40px]">{p.name}</h3><div className="mt-1"><Stars v={p.rating}/></div><p className="mt-1.5"><span className="font-display font-extrabold text-lg">{inr(p.price)}</span> <span className="line-through text-[var(--muted)] text-xs">{inr(p.mrp)}</span></p><p className={`text-xs font-bold mt-1 ${p.stock===0?'text-red-600':p.stock<=10?'text-amber-600':'text-green-600'}`}>{p.stock===0?'Out of Stock':p.stock<=10?`Only ${p.stock} left`: 'In Stock'}</p>
              <div className="grid grid-cols-2 gap-2 mt-3"><button disabled={p.stock===0} onClick={()=>addToCart(p.id)} className="py-2.5 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-bold disabled:opacity-40">Add to Cart</button><button disabled={p.stock===0} onClick={()=>buyNow(p)} className="py-2.5 rounded-xl bg-amber-400 text-slate-900 text-xs sm:text-sm font-extrabold disabled:opacity-40">Buy Now</button></div><button onClick={()=>{setQuick(p); setQuickQty(1);}} className="mt-2 py-2 text-sm font-bold text-blue-700 flex items-center justify-center gap-1"><Eye size={15}/> View Details <ChevronRight size={15}/></button></div>
            </article>
          ))}
        </div>{visibleProducts.length===0 && <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-10 text-center"><p className="font-display font-extrabold text-xl">No products found</p><p className="text-[var(--muted)] text-sm mt-1">Try a different search, category or price filter.</p><button onClick={()=>{setSearch(''); setCategory('All'); setPriceFilter('All');}} className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold">Clear Filters</button></div>}</section>

        {/* Value strip */}
        <section className="max-w-7xl mx-auto px-3 sm:px-5 pb-8"><div className="bg-blue-600 rounded-3xl p-5 sm:p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><div><h2 className="font-display font-extrabold text-xl sm:text-2xl">Use WELCOME10 at checkout</h2><p className="text-blue-100 text-sm">Get 10% off your first order. ELECTRO500 gives ₹500 off above ₹10,000.</p></div><button onClick={()=>{setCouponInput('WELCOME10'); setCartOpen(true);}} className="shrink-0 px-5 py-3 bg-white text-blue-700 rounded-full font-extrabold flex items-center gap-1"><BadgePercent size={18}/> Try Coupon</button></div></section>
      </>}

      {view==='wishlist' && <section className="max-w-7xl mx-auto px-3 sm:px-5 py-6 min-h-[50vh]"><button onClick={()=>setView('store')} className="flex items-center gap-1 font-bold text-sm mb-3"><ArrowLeft size={16}/> Back to Store</button><h1 className="font-display text-2xl font-extrabold">My Wishlist</h1><p className="text-sm text-[var(--muted)]">{wishlist.length} saved items</p>{wishlist.length===0?<div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-10 text-center mt-4"><Heart size={40} className="mx-auto text-slate-300"/><p className="font-bold mt-3">Your wishlist is empty</p><p className="text-sm text-[var(--muted)]">Tap the heart on any product to save it here.</p><button onClick={()=>setView('store')} className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold">Browse Products</button></div>:<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">{wishlist.map(id=>{const p=products.find(x=>x.id===id); if(!p) return null; return <article key={id} className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl overflow-hidden"><img src={imgFor(p)} alt={p.name} className="w-full aspect-[4/3] object-cover"/><div className="p-3"><h3 className="font-bold">{p.name}</h3><p className="font-extrabold mt-1">{inr(p.price)} <span className="line-through text-[var(--muted)] text-xs">{inr(p.mrp)}</span></p><div className="flex gap-2 mt-3"><button onClick={()=>addToCart(id)} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">Move to Cart</button><button onClick={()=>toggleWish(id)} className="p-2 border border-[var(--line)] rounded-lg" aria-label="Remove from wishlist"><Trash2 size={17} className="text-red-500"/></button></div></div></article>})}</div>}</section>}

      {view==='orders' && <section className="max-w-5xl mx-auto px-3 sm:px-5 py-6 min-h-[50vh]"><button onClick={()=>setView('store')} className="flex items-center gap-1 font-bold text-sm mb-3"><ArrowLeft size={16}/> Back to Store</button><h1 className="font-display text-2xl font-extrabold">My Orders</h1><p className="text-sm text-[var(--muted)]">Track, cancel or request return / replacement.</p>{orders.length===0?<div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-10 text-center mt-4"><Package size={40} className="mx-auto text-slate-300"/><p className="font-bold mt-3">No orders yet</p><p className="text-sm text-[var(--muted)]">Your orders will appear here after checkout.</p><button onClick={()=>setView('store')} className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold">Start Shopping</button></div>:<div className="space-y-4 mt-4">{orders.map(o=>{ const step = ORDER_STEPS.indexOf(o.status); const reqs = returnsList.filter(r=>r.orderId===o.orderId); return <div key={o.id} className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-4"><div className="flex flex-wrap justify-between gap-2"><div><p className="font-display font-extrabold">{o.orderId}</p><p className="text-xs text-[var(--muted)]">Placed {new Date(o.createdAt).toLocaleDateString('en-IN')} • Expected delivery {o.deliveryDate}</p></div><span className={`px-3 py-1 rounded-full text-xs font-extrabold ${o.status==='Delivered'?'bg-green-100 text-green-700':o.status==='Cancelled'?'bg-red-100 text-red-600':'bg-blue-50 text-blue-700'}`}>{o.status}</span></div><div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">{o.items.map((it,i)=><div key={i} className="flex items-center gap-2 bg-[var(--surface)] rounded-xl p-2 pr-3 shrink-0"><img src={imgFor(it)} alt={it.name} className="w-10 h-10 object-cover rounded-lg"/><span className="text-xs font-bold">{it.name} × {it.qty}</span></div>)}</div>{o.status!=='Cancelled' && <div className="mt-4"><div className="flex justify-between text-[10px] font-bold text-[var(--muted)]">{ORDER_STEPS.map(s=><span key={s} className={ORDER_STEPS.indexOf(s)<=step?'text-blue-700':''}>{s}</span>)}</div><div className="h-2 bg-slate-200 rounded-full mt-1 overflow-hidden"><div className="h-full bg-blue-600 rounded-full transition-all" style={{width: o.status==='Delivered'?'100%':`${((step+1)/ORDER_STEPS.length)*100}%`}}/></div></div>}<p className="text-sm mt-3"><b>Total:</b> {inr(o.total)} • {o.payment} {o.couponCode?`• Coupon ${o.couponCode}`:''}</p><p className="text-xs text-[var(--muted)] flex gap-1 items-start mt-1"><MapPin size={13} className="mt-0.5 shrink-0"/> {o.customer.name}, {o.customer.address}, {o.customer.city} — {o.customer.pincode} • {o.customer.phone}</p>{reqs.length>0 && <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm"><b>Return / Replace:</b> {reqs.map(r=><span key={r.id} className="block">{r.type} — {r.productName} • Status: <b>{r.status}</b></span>)}</div>}<div className="flex flex-wrap gap-2 mt-4">{o.status!=='Delivered' && o.status!=='Cancelled' && <button onClick={()=>cancelOrder(o)} className="px-4 py-2 border border-red-200 text-red-600 rounded-xl font-bold text-sm">Cancel Order</button>}{o.status==='Delivered' && <button onClick={()=>{setReturnModal(o); setReturnForm({type:'Return',reason:'Damaged',description:'',productName:o.items[0]?.name||''});}} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm">Return / Replace</button>}</div></div>})}</div>}</section>}

      {/* Footer */}
      <footer className="bg-[#0b1220] text-slate-300 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div><p className="text-white font-display font-extrabold text-xl">{settings.storeName}</p><p className="text-sm mt-2 leading-relaxed">Your trusted destination for genuine electronics, fair prices and fast delivery across India.</p><p className="text-sm mt-3 flex gap-2 items-center"><Phone size={15}/> +91 98765 43210</p><p className="text-sm mt-1">support@electrohub.in</p></div>
          <div><p className="text-white font-bold">Help</p><ul className="text-sm mt-3 space-y-2"><li>Shipping & Delivery</li><li>Returns & Replacement</li><li>Track Your Order</li><li>Contact Us</li></ul></div>
          <div><p className="text-white font-bold">Policies</p><ul className="text-sm mt-3 space-y-2"><li>1 Year Warranty</li><li>7-Day Return Policy</li><li>Privacy Policy</li><li>Terms of Service</li></ul></div>
          <div><p className="text-white font-bold">About</p><ul className="text-sm mt-3 space-y-2"><li>Our Story</li><li>Why ElectroHub</li><li>Careers</li><li>Store Locator</li></ul></div>
        </div>
        <div className="border-t border-white/10"><div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row justify-between gap-1 items-center"><p className="text-xs text-slate-400">© {new Date().getFullYear()} {settings.storeName}. All rights reserved. Made in India.</p><button onClick={openAdmin} className="text-[10px] leading-none text-slate-600 hover:text-slate-400 tracking-wide">Admin</button></div></div>
      </footer>

      {/* Quick view */}
      {quick && <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={()=>setQuick(null)}><div className="bg-[var(--surface-2)] w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl" onClick={e=>e.stopPropagation()}><div className="grid sm:grid-cols-2"><div className="relative"><img src={imgFor(quick)} alt={quick.name} className="w-full h-64 sm:h-full object-cover sm:rounded-l-3xl"/><span className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">{discountPct(quick)}% OFF</span></div><div className="p-5"><div className="flex justify-between"><p className="text-xs font-bold text-blue-600 uppercase">{quick.category}</p><button onClick={()=>setQuick(null)} aria-label="Close"><X size={20}/></button></div><h2 className="font-display font-extrabold text-2xl mt-1">{quick.name}</h2><div className="mt-2"><Stars v={quick.rating}/></div><p className="mt-3"><span className="font-display font-extrabold text-2xl">{inr(quick.price)}</span> <span className="line-through text-[var(--muted)]">{inr(quick.mrp)}</span> <span className="text-green-600 font-bold text-sm">You save {inr(quick.mrp-quick.price)}</span></p><p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">{quick.description}</p><ul className="mt-3 space-y-1.5 text-sm">{quick.specs.map((s,i)=><li key={i} className="flex gap-2"><CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5"/>{s}</li>)}</ul><div className="flex gap-2 mt-4 text-xs font-bold"><span className="bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-full flex gap-1"><ShieldCheck size={14}/> 1 Year Warranty</span><span className="bg-amber-50 text-amber-800 px-2.5 py-1.5 rounded-full flex gap-1"><RotateCcw size={14}/> 7-Day Return</span><span className="bg-green-50 text-green-700 px-2.5 py-1.5 rounded-full flex gap-1"><Truck size={14}/> Delivery in 3–5 days</span></div><div className="flex items-center gap-3 mt-5"><span className="text-sm font-bold">Qty</span><div className="flex items-center border border-[var(--line)] rounded-full"><button onClick={()=>setQuickQty(q=>Math.max(1,q-1))} className="p-2" aria-label="Decrease quantity"><Minus size={16}/></button><span className="w-8 text-center font-bold">{quickQty}</span><button onClick={()=>setQuickQty(q=>Math.min(quick.stock,q+1))} className="p-2" aria-label="Increase quantity"><Plus size={16}/></button></div><span className="text-xs font-bold text-green-600">{quick.stock>0?`${quick.stock} in stock`:'Out of stock'}</span></div><div className="grid grid-cols-2 gap-2 mt-4"><button disabled={quick.stock===0} onClick={()=>{addToCart(quick.id,quickQty); setQuick(null);}} className="py-3 bg-blue-600 text-white rounded-xl font-bold">Add to Cart</button><button disabled={quick.stock===0} onClick={()=>{addToCart(quick.id,quickQty); setQuick(null); setCartOpen(true);}} className="py-3 bg-amber-400 rounded-xl font-extrabold">Buy Now</button></div></div></div></div></div>}

      {/* Cart drawer */}
      {cartOpen && <div className="fixed inset-0 z-50 bg-black/50" onClick={()=>setCartOpen(false)}><aside className="absolute right-0 top-0 h-full w-full max-w-md bg-[var(--surface-2)] shadow-2xl flex flex-col" onClick={e=>e.stopPropagation()}><div className="p-4 border-b border-[var(--line)] flex justify-between items-center"><h2 className="font-display font-extrabold text-xl flex gap-2 items-center"><ShoppingCart/> Your Cart <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{cartCount}</span></h2><button onClick={()=>setCartOpen(false)} aria-label="Close cart"><X size={22}/></button></div><div className="flex-1 overflow-y-auto p-4 space-y-3">{cartDetailed.length===0?<div className="text-center py-14"><ShoppingCart size={44} className="mx-auto text-slate-300"/><p className="font-bold mt-3">Your cart is empty</p><p className="text-sm text-[var(--muted)]">Add products to get started.</p><button onClick={()=>setCartOpen(false)} className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold">Continue Shopping</button></div>:cartDetailed.map(({product,qty})=><div key={product.id} className="flex gap-3 bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3"><img src={imgFor(product)} alt={product.name} className="w-20 h-20 object-cover rounded-xl"/><div className="flex-1 min-w-0"><p className="font-bold leading-snug">{product.name}</p><p className="text-sm">{inr(product.price)} <span className="line-through text-[var(--muted)] text-xs">{inr(product.mrp)}</span></p><div className="flex items-center justify-between mt-2"><div className="flex items-center border border-[var(--line)] rounded-full bg-[var(--surface-2)]"><button onClick={()=>setCart(c=>c.map(x=>x.productId===product.id?{...x,qty:Math.max(1,x.qty-1)}:x))} className="p-1.5" aria-label="Decrease"><Minus size={14}/></button><span className="w-7 text-center text-sm font-bold">{qty}</span><button onClick={()=>setCart(c=>c.map(x=>x.productId===product.id?{...x,qty:Math.min(product.stock,x.qty+1)}:x))} className="p-1.5" aria-label="Increase"><Plus size={14}/></button></div><button onClick={()=>setCart(c=>c.filter(x=>x.productId!==product.id))} className="text-red-600 flex items-center gap-1 text-xs font-bold"><Trash2 size={14}/> Remove</button></div></div></div>)}</div>{cartDetailed.length>0 && <div className="border-t border-[var(--line)] p-4 space-y-3"><div className="flex gap-2"><input value={couponInput} onChange={e=>setCouponInput(e.target.value.toUpperCase())} placeholder="Coupon code e.g. WELCOME10" className="flex-1 border border-[var(--line)] bg-[var(--surface)] rounded-xl px-3 py-2.5 uppercase text-sm font-bold"/><button onClick={applyCoupon} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm">Apply</button></div>{couponMsg && <p className="text-xs font-bold text-red-600">{couponMsg}</p>}{appliedCoupon && <div className="flex justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-sm font-bold text-green-800"><span>✓ {appliedCoupon.code} applied</span><button onClick={removeCoupon} className="text-red-600">Remove</button></div>}<div className="text-sm space-y-1.5"><div className="flex justify-between"><span>Subtotal</span><b>{inr(subtotal)}</b></div><div className="flex justify-between text-green-600"><span>Coupon discount</span><b>− {inr(discount)}</b></div><div className="flex justify-between"><span>Delivery</span><b>{delivery===0?'FREE':inr(delivery)}</b></div><div className="flex justify-between font-display font-extrabold text-lg pt-2 border-t border-[var(--line)]"><span>Grand Total</span><span>{inr(grandTotal)}</span></div></div><button onClick={()=>{setCartOpen(false); setCheckoutOpen(true);}} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-extrabold">Proceed to Checkout</button><button onClick={()=>{setCart([]); setAppliedCoupon(null);}} className="w-full py-2.5 border border-[var(--line)] rounded-xl font-bold text-sm">Clear Cart</button></div>}</aside></div>}

      {/* Checkout */}
      {checkoutOpen && <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center sm:p-4"><div className="bg-[var(--surface-2)] w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5"><div className="flex justify-between items-center"><h2 className="font-display font-extrabold text-2xl">Checkout</h2><button onClick={()=>setCheckoutOpen(false)} aria-label="Close checkout"><X size={22}/></button></div><p className="text-sm text-[var(--muted)]">Total to pay: <b className="text-[var(--ink)]">{inr(grandTotal)}</b> • {cartCount} items</p>{formError && <p className="mt-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl px-3 py-2">{formError}</p>}<div className="grid sm:grid-cols-2 gap-3 mt-4"><label className="text-sm font-bold">Full Name*<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-xl px-3 py-2.5" placeholder="Your name"/></label><label className="text-sm font-bold">Phone*<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value.replace(/\D/g,'').slice(0,10)})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-xl px-3 py-2.5" placeholder="10-digit mobile"/></label><label className="text-sm font-bold">Pincode*<input value={form.pincode} onChange={e=>setForm({...form,pincode:e.target.value.replace(/\D/g,'').slice(0,6)})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-xl px-3 py-2.5" placeholder="6-digit pincode"/></label><label className="text-sm font-bold">City*<input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-xl px-3 py-2.5" placeholder="City"/></label><label className="text-sm font-bold sm:col-span-2">Full Address*<textarea value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-xl px-3 py-2.5" rows={2} placeholder="House no, street, area"/></label></div><p className="font-bold mt-4 text-sm">Payment Method</p><div className="grid sm:grid-cols-3 gap-2 mt-2">{([['Cash on Delivery',Banknote,'Pay when it arrives'],['UPI',Smartphone,'GPay / PhonePe / Paytm'],['Card',CreditCard,'Credit / Debit Card']] as const).map(([label,Icon,desc])=><label key={label} className={`border rounded-2xl p-3 cursor-pointer ${form.payment===label?'border-blue-600 bg-blue-50':'border-[var(--line)]'}`}><input type="radio" name="payment" checked={form.payment===label} onChange={()=>setForm({...form,payment:label})} className="accent-blue-600"/><span className="flex items-center gap-1.5 font-bold text-sm mt-1"><Icon size={16}/>{label}</span><span className="text-xs text-[var(--muted)]">{desc}</span></label>)}</div><div className="bg-[var(--surface)] rounded-2xl p-3 mt-4 text-sm space-y-1"><div className="flex justify-between"><span>Subtotal</span><b>{inr(subtotal)}</b></div><div className="flex justify-between"><span>Discount</span><b>− {inr(discount)}</b></div><div className="flex justify-between"><span>Delivery</span><b>{delivery===0?'FREE':inr(delivery)}</b></div><div className="flex justify-between font-extrabold text-base pt-1 border-t border-[var(--line)]"><span>Total</span><span>{inr(grandTotal)}</span></div></div><button disabled={placing} onClick={placeOrder} className="w-full mt-4 py-3.5 bg-blue-600 text-white rounded-xl font-extrabold disabled:opacity-50">{placing?'Placing Order…':`Place Order • ${inr(grandTotal)}`}</button><p className="text-center text-xs text-[var(--muted)] mt-2 flex items-center justify-center gap-1"><Lock size={12}/> Mock checkout — no real payment is taken.</p></div></div>}

      {/* Success */}
      {checkoutSuccess && <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"><div className="bg-[var(--surface-2)] w-full max-w-md rounded-3xl p-6 text-center"><div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 size={36} className="text-green-600"/></div><h2 className="font-display font-extrabold text-2xl mt-3">Order Placed!</h2><p className="text-sm text-[var(--muted)] mt-1">Thank you, {checkoutSuccess.customer.name}. Your order is confirmed.</p><div className="bg-[var(--surface)] rounded-2xl p-4 mt-4 text-left text-sm space-y-1"><p><b>Order ID:</b> <span className="text-blue-700 font-extrabold">{checkoutSuccess.orderId}</span></p><p><b>Estimated delivery:</b> {checkoutSuccess.deliveryDate}</p><p><b>Payment:</b> {checkoutSuccess.payment}</p><p><b>Total paid:</b> {inr(checkoutSuccess.total)}</p></div><div className="grid grid-cols-2 gap-2 mt-4"><button onClick={()=>{setCheckoutSuccess(null); setView('orders');}} className="py-3 bg-slate-900 text-white rounded-xl font-bold">View My Orders</button><button onClick={()=>setCheckoutSuccess(null)} className="py-3 border border-[var(--line)] rounded-xl font-bold">Continue Shopping</button></div></div></div>}

      {/* Return modal */}
      {returnModal && <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center sm:p-4"><div className="bg-[var(--surface-2)] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5"><div className="flex justify-between"><h2 className="font-display font-extrabold text-xl">Return / Replace</h2><button onClick={()=>setReturnModal(null)} aria-label="Close"><X size={20}/></button></div><p className="text-sm text-[var(--muted)]">Order {returnModal.orderId}</p><div className="space-y-3 mt-4"><label className="text-sm font-bold block">Product<select value={returnForm.productName} onChange={e=>setReturnForm({...returnForm,productName:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-xl px-3 py-2.5">{returnModal.items.map(i=><option key={i.name}>{i.name}</option>)}</select></label><div className="grid grid-cols-2 gap-2">{(['Return','Replace'] as const).map(t=><button key={t} onClick={()=>setReturnForm({...returnForm,type:t})} className={`py-2.5 rounded-xl font-bold ${returnForm.type===t?'bg-blue-600 text-white':'border border-[var(--line)]'}`}>{t}</button>)}</div><label className="text-sm font-bold block">Reason<select value={returnForm.reason} onChange={e=>setReturnForm({...returnForm,reason:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-xl px-3 py-2.5">{['Damaged','Wrong Item','Not Working','Changed Mind','Other'].map(r=><option key={r}>{r}</option>)}</select></label><label className="text-sm font-bold block">Tell us more<textarea value={returnForm.description} onChange={e=>setReturnForm({...returnForm,description:e.target.value})} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-xl px-3 py-2.5" rows={3} placeholder="Describe the issue…"/></label><button onClick={submitReturn} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Submit Request</button></div></div></div>}

      {/* Admin password modal */}
      {showAdminPass && <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"><div className="bg-[var(--surface-2)] w-full max-w-sm rounded-3xl p-6"><div className="flex justify-between"><h2 className="font-display font-extrabold text-xl flex gap-2 items-center"><Lock size={19}/> Admin Login</h2><button onClick={()=>setShowAdminPass(false)} aria-label="Close"><X size={20}/></button></div><p className="text-sm text-[var(--muted)] mt-1">Enter the admin password to open the dashboard.</p><p className="mt-3 bg-blue-50 text-blue-800 text-sm font-bold rounded-xl px-3 py-2">Demo password: admin123</p><label className="block text-sm font-bold mt-4">Password<input type="password" value={adminPassInput} onChange={e=>setAdminPassInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') submitAdminPass();}} className="mt-1 w-full border border-[var(--line)] bg-[var(--surface)] rounded-xl px-3 py-2.5" placeholder="••••••••" autoFocus/></label>{adminPassError && <p className="text-sm font-bold text-red-600 mt-2 flex gap-1"><AlertCircle size={16}/>{adminPassError}</p>}<button onClick={submitAdminPass} className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl font-bold">Open Admin Dashboard</button></div></div>}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-[80] space-y-2">{toasts.map(t=><div key={t.id} className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-sm font-bold flex gap-2 items-center"><CheckCircle2 size={17} className="text-green-400"/>{t.msg}</div>)}</div>
    </div>
  );
}
