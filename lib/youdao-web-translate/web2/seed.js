(function() {
  var b = function() {
    var l = new Image();
    l.src =
      'http://fanyi.youdao.com/web2/rl.do?keyfrom=chromeext&action=w_try&' +
      new Date().getTime();
  };
  var c = 'fanyi.youdao.com',
    i = '/web2/';
  if (window.location.host === c && window.location.pathname === i) {
    b();
    alert('请在浏览英文网页时使用有道网页翻译2.0');
    return;
  }
  if (
    !(
      window.location.protocol == 'http:' ||
      window.location.protocol == 'https:'
    )
  ) {
    alert('请在浏览网页时使用有道网页翻译2.0');
    return;
  }
  var h = 'http://fanyi.youdao.com/web2';
  if (!window.OUTFOX_JavascriptTranslatoR) {
    var e = document.createElement('script');
    e.setAttribute(
      'src',
      h + '/scripts/all-packed-utf-8.js?242748M&' + Date.parse(new Date())
    );
    e.setAttribute('type', 'text/javascript');
    e.setAttribute('charset', 'utf-8');
    document.body.appendChild(e);
  } else {
    var j = 'http://fanyi.youdao.com';
    var a = '/web2/conn.html';
    var k = h + '/index.do';
    var g = j + '/jtr';
    var d = h + '/rl.do';
    var f = h + '/styles/all-packed.css';
    J.loadCSS(document, f);
    window.OUTFOX_JavascriptTranslatoR = new J.TR.UI(document.body, {
      domain: j,
      update: false,
      updateTipMsg: '增加关闭按钮',
      updateDate: '2011-3-15',
      cssURL: f,
      tipsURL: k,
      transURL: g,
      logURL: d,
      connFilePath: a,
      reqSize: 20
    });
  }
})();
