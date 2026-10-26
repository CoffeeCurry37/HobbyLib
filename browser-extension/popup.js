// Runs inside the user's explicitly opened shop page. No cookies, storage, passwords or scripts are read.
// Kept self-contained so it can run via a local browser or the active-tab extension.
function capturePage(kind = 'catalog') {
    const allowed = ['order.mandarake.co.jp', 'www.suruga-ya.jp', 'jp.mercari.com', 'auctions.yahoo.co.jp', 'shopping.yahoo.co.jp', 'store.shopping.yahoo.co.jp'];
    if (!allowed.includes(location.hostname))
        throw new Error('当前页面不属于支持的四个平台');
    const canonical = (raw) => { const u = new URL(raw, location.href); if (!allowed.includes(u.hostname) || u.protocol !== 'https:')
        return ''; const keep = new URLSearchParams(); for (const k of ['itemCode', 'tenpo_cd'])
        if (u.searchParams.has(k))
            keep.set(k, u.searchParams.get(k)); u.search = keep.toString(); u.hash = ''; return u.href; };
    const isItem = (url) => /\/detailPage\/item|\/product\/detail\/|\/(?:en\/)?item\/m\d+|\/shops\/product\/|\/jp\/auction\//.test(url) || url.includes('store.shopping.yahoo.co.jp/');
    if (kind === 'catalog') {
        if (!isItem(location.href) && !/\/search|\/listPage\//.test(location.pathname))
            throw new Error('请打开公开搜索页或商品详情页；账号页面请选择购买记录或愿望清单模式');
        const clone = document.body.cloneNode(true);
        clone.querySelectorAll('[style]').forEach(n => { if (/display\s*:\s*none|visibility\s*:\s*hidden/i.test(n.getAttribute('style') || ''))
            n.remove(); });
        clone.querySelectorAll('input[type=submit],input[type=button]').forEach(n => { const button = document.createElement('button'); button.textContent = n.value; n.replaceWith(button); });
        clone.querySelectorAll('script,style,noscript,iframe,input,textarea,select,header,footer,nav,[hidden]').forEach(n => n.remove());
        clone.querySelectorAll('*').forEach(n => { for (const a of Array.from(n.attributes)) {
            if (!['class', 'id', 'href', 'src', 'alt', 'itemprop', 'itemtype', 'content', 'data-testid', 'data-itemidx', 'aria-label', 'rel'].includes(a.name))
                n.removeAttribute(a.name);
        } if (n.tagName === 'A') {
            const href = n.getAttribute('href');
            if (href && !href.startsWith('javascript:'))
                try {
                    const u = new URL(href, location.href);
                    if (isItem(u.href))
                        n.setAttribute('href', canonical(u.href));
                }
                catch {
                    n.removeAttribute('href');
                }
        } });
        const meta = Array.from(document.querySelectorAll('meta[itemprop],link[itemprop],meta[property="og:image"]')).map(n => n.outerHTML).join('');
        return { format: 'radar-capture-1', kind, url: location.href, capturedAt: new Date().toISOString(), html: '<html><head>' + meta + '</head><body>' + clone.innerHTML + '</body></html>' };
    }
    const rows = [], seen = new Set();
    for (const a of Array.from(document.querySelectorAll('a[href]'))) {
        if (!isItem(a.href))
            continue;
        const url = canonical(a.href);
        if (!url || seen.has(url))
            continue;
        const box = a.closest('tr,li,article,[data-testid="item-cell"],.item,.block') || a;
        const title = (a.querySelector('[data-testid="thumbnail-item-name"],.title,.product-name')?.textContent || a.textContent?.trim() || a.querySelector('img')?.alt || '').replace(/のサムネイル$/, '').replace(/\s+[¥￥]\s*[\d,]+.*$/, '').trim();
        if (title.length < 2 || /^(詳細|売り切れ|カート|商品詳細)$/.test(title))
            continue;
        const body = box.textContent || '';
        const status = body.match(/キャンセル|取消|返品|支払い待ち|発送待ち|取引中|取引完了|受取評価済み|発送済み|配達完了|購入済み/)?.[0] || '待核对';
        rows.push({ title: title.slice(0, 300), url, quantity: Number(body.match(/(?:数量|個数)\s*[:：]?\s*(\d+)/)?.[1] || 1), recordId: '', status });
        seen.add(url);
        if (rows.length >= 500)
            break;
    }
    if (!rows.length)
        throw new Error('未识别到带商品链接的记录。请打开具体列表并等加载完成；可先复制标题和商品链接，按模板导入');
    return { format: 'radar-capture-1', kind, source: location.hostname, capturedAt: new Date().toISOString(), rows };
}

document.getElementById('capture').addEventListener('click',async()=>{const output=document.getElementById('result');try{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});const kind=document.getElementById('kind').value;const result=await chrome.scripting.executeScript({target:{tabId:tab.id},func:capturePage,args:[kind]});const data=result[0]?.result;if(!data)throw new Error('页面没有返回可读取的数据');const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='radar-'+kind+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);output.textContent='已下载。回到收藏雷达的采集工作台或账号记录，预览后导入。';}catch(e){output.textContent=e.message;}});