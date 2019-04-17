function getQueryVariable(url, variable) {
  const strArr = new URL(url).search.split('?');
  if (strArr[1]) {
    const query = strArr[1];
    const vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
      const pair = vars[i].split('=');
      if (pair[0] == variable) {
        return pair[1];
      }
    }
  }
  return undefined;
}