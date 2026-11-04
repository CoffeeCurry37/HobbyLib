// Extract bounded facts from the product's own content and order sections.
export function historicalFacts(html, title) {
  const sectionText = heading => {
    const pattern = new RegExp('<span>' + heading + '</span>\\s*</h2>\\s*<div[^>]*>\\s*<div class="itemDetail">([\\s\\S]*?)</div>', 'i');
    return (html.match(pattern)?.[1] || '').replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
  };
  const content = sectionText('商品(?:内容|概要)');
  const order = sectionText('注文受付期間');
  const regional = title.match(/【([^【】（）()]+)[（(]全(\d+)種[）)]】/);
  return {
    regionalRange: /under the same sky/i.test(title) && regional ? {region: regional[1], choices: Number(regional[2])} : null,
    fullBodyArt: /サーヴァントイラスト[（(]全身イラスト[）)]を使用/.test(content),
    eventDrawnServants: /イベント描き下ろしのサーヴァント絵柄を使用/.test(content),
    selectableDesign: /ご購入時に絵柄をお選びいただけます/.test(content),
    orderProduction: /当商品は受注生産商品(?:です|となります)/.test(order),
    publication: /仕様[：:]\s*A3サイズ、116P[（(]表紙含む[）)]/.test(content)
      ? {format: 'A3', pagesIncludingCovers: 116} : null,
    illustrations48: /広告用に描かれた48種/.test(content) && /これらを全種収録/.test(content),
  };
}

export function historicalSummary(detail, match, event) {
  const name = match.officialTitle;
  const facts = detail.historicalFacts;
  const clauses = [];
  if (facts.regionalRange) clauses.push('官方将此款列在' + facts.regionalRange.region + '地区，同页共列 ' + facts.regionalRange.choices + ' 款');
  if (facts.fullBodyArt) clauses.push('图案采用从者全身插画');
  if (facts.eventDrawnServants) clauses.push('图案采用为本次活动新绘的从者插画');
  if (facts.illustrations48 && facts.publication) clauses.push('收录全部 48 幅周年广告插画，A3 开本，含封面共 116 页');
  if (/【復刻】/.test(detail.title)) clauses.push('本次销售为官方复刻');
  if (/コンプリートセット/.test(name)) clauses.push('这一规格是完整套装');
  else if (/単品[・\s]*ランダム封入/.test(name)) clauses.push('这一规格为随机单包');
  else if (facts.selectableDesign) clauses.push('下单时可选择图案');
  if (!clauses.length && facts.orderProduction) clauses.push('该次官方销售采用接单生产');
  return '《' + event + '》的「' + name + '」。' + (clauses.length ? clauses.join('，') + '。' : '');
}
