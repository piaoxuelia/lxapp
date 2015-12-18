(function(g) {

	ejs.open = "{%";
	ejs.close = "%}";

	g.$ContentRender = {};
	var wrapper = $('.wrapper')

	var render = function(data,id,wrapper,callback){
		var tmp = $(id),
		a = tmp.html();

		html = ejs.render(a,{data:data});
		wrapper.html(html);

		typeof callback == "function" && callback();
	}

	$ContentRender.renderGrayBar = function(data , callback){
		var data = data || {};
		render(data, "#grayBar-tmpl",wrapper);
		typeof callback == "function" && callback();
	}

	$ContentRender.renderArticle = function(data , callback){
		var data = data || {};
		var aticleData = {};
		aticleData.title = data.title;
		aticleData.time = $utils.formatDate(data.time);
		aticleData.content = [];
		console.log(data)
		data.content.forEach(function(item){
			if(item.type = "txt"){
				aticleData.content.push(item);
			}else if(item.type = "txt"){

			}
			
		})
		console.log(aticleData.content)

		//render(aticleData, "#article-tmpl",wrapper);
		typeof callback == "function" && callback();
	}


})(this)