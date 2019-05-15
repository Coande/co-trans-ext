// iframe页面通讯
// https://www.cnblogs.com/syll/p/8640329.html
// 接收iframe外部通过postMessage传递过来的数据
window.addEventListener('message', function(event) {
  if (event.data.op === 'showDetail') {
    document.body.classList.add('trans-ext-detail');
  } else if (event.data.op === 'hideDetail') {
    document.body.classList.remove('trans-ext-detail');
  }
});

window.addEventListener('message',function(event){
  if(event.data.changeTransTool) {
    const keyword = $('#textarea-source').val() || $('#j-textarea').val() 
      || $('#source').val() || $('#index-input-main').val() || $('#formInput').val();
    window.parent.postMessage({ changeTransTool: event.data.changeTransTool, keyword: keyword ? keyword : '' }, '*');
  }
});

// 接收query上的数据并判断是否需要显示输入内容和语言切换等
const isShowDetail = getQueryVariable(window.location.href, 'showDetail');
if (isShowDetail === 'true') {
  document.body.classList.add('trans-ext-detail');
} else {
  document.body.classList.remove('trans-ext-detail');
}