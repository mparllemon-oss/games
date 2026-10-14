export const WEAPONS=[
 {id:'pistol',name:'Service Pistol',short:'Pistol',icon:'⌖',desc:'Reliable sidearm. A steady emergency choice.',cost:0,damage:28,rate:310,mag:12,reload:1050,reserve:72,spread:.035,pellets:1,auto:false,range:620},
 {id:'shotgun',name:'Street Sweeper',short:'Shotgun',icon:'▰',desc:'A brutal close-range spread. Best when they get close.',cost:180,damage:17,rate:720,mag:6,reload:1550,reserve:36,spread:.28,pellets:7,auto:false,range:360},
 {id:'smg',name:'Scavenger SMG',short:'SMG',icon:'⌁',desc:'Fast automatic fire; eats ammunition quickly.',cost:280,damage:16,rate:92,mag:32,reload:1650,reserve:160,spread:.105,pellets:1,auto:true,range:580},
 {id:'rifle',name:'Ranger Rifle',short:'Rifle',icon:'╱',desc:'Hard-hitting controlled fire for medium range.',cost:420,damage:32,rate:190,mag:24,reload:1450,reserve:144,spread:.045,pellets:1,auto:true,range:820},
 {id:'minigun',name:'M-134 Minigun',short:'Heavy',icon:'✣',desc:'Sustained heavy fire. Spins up, then clears the street.',cost:720,damage:13,rate:62,mag:120,reload:2600,reserve:360,spread:.14,pellets:1,auto:true,range:670}
];
export const ENEMIES={walker:{hp:54,speed:43,damage:9,reward:12,r:15,color:'#79836c',xp:10},runner:{hp:37,speed:82,damage:7,reward:18,r:12,color:'#bd785b',xp:14},brute:{hp:210,speed:28,damage:23,reward:38,r:23,color:'#655b53',xp:30},toxic:{hp:74,speed:40,damage:13,reward:26,r:16,color:'#8eaa57',xp:22},colossus:{hp:950,speed:32,damage:28,reward:280,r:36,color:'#65554a',xp:160},mutant:{hp:760,speed:41,damage:18,reward:320,r:31,color:'#8cad4d',xp:180}};
export const UPGRADES=[
 {id:'health',name:'Reinforced Vest',desc:'+20 maximum health, fully restored',cost:110,max:5},
 {id:'speed',name:'Lightweight Boots',desc:'+6% movement speed',cost:105,max:5},
 {id:'damage',name:'Hotter Loads',desc:'+10% weapon damage',cost:145,max:6},
 {id:'reload',name:'Fast Hands',desc:'Reload 9% faster',cost:120,max:5},
 {id:'fire',name:'Trigger Work',desc:'Fire 6% faster',cost:150,max:5},
 {id:'ammo',name:'Deep Pockets',desc:'+15% reserve ammo on pickups',cost:90,max:4},
 {id:'crit',name:'Steady Aim',desc:'+4% critical hit chance',cost:130,max:5}
];
export const baseRun=()=>({wave:0,kills:0,score:0,scrap:90,hp:100,maxHp:100,x:0,y:0,level:1,xp:0,xpNext:100,owned:['pistol'],current:'pistol',ammo:{pistol:12},reserve:{pistol:72},upgrades:{},time:0});
