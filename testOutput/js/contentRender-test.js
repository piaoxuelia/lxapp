/*! lxapp 2015-12-23 */
!function(a){ejs.open="{%",ejs.close="%}",a.$ContentRender={};var b=$(".wrapper"),c=function(a,b,c,d){var e=$(b),f=e.html();html=ejs.render(f,{data:a}),c.html(html),"function"==typeof d&&d()};$ContentRender.renderGrayBar=function(a,d){var a=a||{};c(a,"#grayBar-tmpl",b),"function"==typeof d&&d()},$ContentRender.renderArticle=function(a,b){var a=a||{},c={};c.title=a.title,c.time=$utils.formatDate(a.time),c.content=[],console.log(a),a.content.forEach(function(a){(a.type="txt")?c.content.push(a):a.type="txt"}),console.log(c.content),"function"==typeof b&&b()}}(this);