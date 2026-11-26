// Hook CfgReader.DoReadString + DoReadFloat while configs load: pair (lastString, float)
function say(o) { send(o); }
const TARGETS = [1800, 1500, 900, 200, 10, 5, 0.01, 0.1, 0.5];
let libMod = null, ready = false, lastStr = null, hits = 0, pairs = 0;
const iv = setInterval(() => {
  if (!libMod) libMod = Process.findModuleByName('libil2cpp.so');
  if (!libMod || ready) return;
  try { init(); } catch (e) { say({ stage: 'err', e: String(e) }); }
}, 400);
setTimeout(() => { clearInterval(iv); say({ stage: 'timeout', ready, hits, pairs }); }, 900000);

function readCs(off) {
  // null-terminated-ish: length at +0x10, chars at +0x14
  try {
    const p = off.add(0x10);
    const len = p.readS32();
    if (len <= 0 || len > 200) return null;
    return off.add(0x14).readUtf16String(len);
  } catch (e) { return null; }
}

function init() {
  const ex = (n) => libMod.getExportByName(n);
  const N = (n, r, a) => new NativeFunction(ex(n), r, a);
  const d = N('il2cpp_domain_get', 'pointer', [])();
  if (d.isNull()) return;
  try { N('il2cpp_thread_attach', 'pointer', ['pointer'])(d); } catch (e) { }
  const getAssemblies = N('il2cpp_domain_get_assemblies', 'pointer', ['pointer', 'pointer']);
  const getImage = N('il2cpp_assembly_get_image', 'pointer', ['pointer']);
  const imageName = N('il2cpp_image_get_name', 'pointer', ['pointer']);
  const imgClassCount = N('il2cpp_image_get_class_count', 'size_t', ['pointer']);
  const imgClass = N('il2cpp_image_get_class', 'pointer', ['pointer', 'size_t']);
  const className = N('il2cpp_class_get_name', 'pointer', ['pointer']);
  const classGetMethods = N('il2cpp_class_get_methods', 'pointer', ['pointer', 'pointer']);
  const methodName = N('il2cpp_method_get_name', 'pointer', ['pointer']);

  const cnt = Memory.alloc(8);
  const arr = getAssemblies(d, cnt);
  const n = arr.isNull() ? 0 : Number(cnt.readU64());
  if (!n) return;
  let main = null;
  for (let i = 0; i < n; i++) {
    const a = arr.add(i * 8).readPointer();
    if (a.isNull()) continue;
    const im = getImage(a);
    if (im.isNull()) continue;
    if (imageName(im).readCString() === 'Main.dll') { main = im; break; }
  }
  if (!main) return;
  const cc = Number(imgClassCount(main));
  let kl = null;
  for (let i = 0; i < cc; i++) {
    const k = imgClass(main, i);
    if (!k.isNull() && className(k).readCString() === 'CfgReader') { kl = k; break; }
  }
  if (!kl) return;
  ready = true;
  clearInterval(iv);

  let fnStr = null, fnFloat = null;
  const it = Memory.alloc(8);
  for (;;) {
    const mi = classGetMethods(kl, it);
    if (mi.isNull()) break;
    const nm = methodName(mi).readCString();
    const p = mi.readPointer();
    if (nm === 'DoReadString') fnStr = p;
    if (nm === 'DoReadFloat') fnFloat = p;
  }
  if (!fnStr || !fnFloat) { say({ stage: 'nofn', str: String(fnStr), flt: String(fnFloat) }); return; }
  say({ stage: 'hooked', str: fnStr.toString(), flt: fnFloat.toString() });

  Interceptor.attach(fnStr, {
    onLeave(retval) {
      if (retval.isNull()) { lastStr = null; return; }
      const s = readCs(retval);
      if (s) lastStr = s;
    }
  });

  Interceptor.attach(fnFloat, {
    onEnter(args) { this.self = args[0]; },
    onLeave() {
      let v = null;
      try { v = this.self.add(0x30).readFloat(); } catch (e) { return; }
      if (v === null) return;
      hits++;
      if (hits > 30000) return;
      if (!lastStr) return;
      say({ stage: 'pair', name: lastStr, val: v });
    }
  });
}
