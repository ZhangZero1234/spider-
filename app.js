var rq = require("request");
var cheerio = require("cheerio");
var fs = require("fs");
var url = require("url");
var async = require("async");

var depth = 2;//深度
var counter = 0;//计步器
var timescale = 1000;//并行爬取间隔
var count = 3; //并行数量控制
var repositary = [];//存储所有的links
var warehouse = [];//存储当前级别links
var operate_url = ['https://cnodejs.org'];//操作当前级别的links
var options= {"filetypes":[".pdf",".mp3",".zip",".gif",".jpg",".xml",".ods",".xls"],"Duplicate_remove":true,"start_url":"https://cnodejs.org","hash":true,"query":true};
function get_link(link,callback){
	console.log("正在爬取 : "+link);
	rq(link,function(error, response, body){
		$ = cheerio.load(body);
	    for(var i = 0 ; i < $("a").length ; i++){
	    	if($("a")[i].attribs.href && $("a")[i].attribs.href.indexOf("mailto")==-1 && $("a")[i].attribs.href.indexOf("https")==-1)
	    	{
	    		
	    		warehouse.push(url.resolve(link,$("a")[i].attribs.href));
	    	}
	    }
	    setTimeout(function(){
	    	 callback(null,link);
	    	},timescale);
	   
	});
}

// 排除数组中相同的项
Array.prototype.unique = function(){
	var context = this;
	var res = [];
	var flag = false;
	for(var i = 0 ; i < context.length ; i++)
	{
		for(var j = 0 ; j < res.length ; j++)
		{
			if(context[i] === res[j])
			{
				flag = true;
				break;
			}
		}
		if(!flag)
		{
			res.push(context[i]);
		}
		else{
			flag = false;
		}
		// console.log(res);
	}
	return res;
}
// 过滤器,过滤不想要的格式
function filter(arr,options){
	var bufferArray = [];
	var array = [];
	if(options.Duplicate_remove == undefined || options.Duplicate_remove == "")
	{
		options.Duplicate_remove = true;
	}
	if(options.Duplicate_remove)
	{
		arr = arr.unique();
	}
	if(options.hash)
	{
		// var reg = /"#"/g;
		for(var i = 0 ; i < arr.length ; i++)
		{
			if(arr[i].indexOf("#")==-1)
			{
				array.push(arr[i]);
			}
		}
		arr = [];
		arr = array;
		array=[];
	}
	if(options.query)
	{
		var flag = true;
		var path = 0;
		// var reg = /\?/g;
		for(var i = 0 ; i < arr.length ; i++)
		{
			// console.log(arr[i].indexOf("?"));
			if(arr[i].indexOf("?")>-1)
			{
				path = arr[i].split("?")[0];//获得纯path
				if(path.indexOf("/index.html")>-1)
				{
					path = path.split("index.html")[0];
				}
				// console.log(path);
				for(var j = 0 ; j < arr.length ; j++)
				{
					if(path === arr[j])
					{
						// console.log(path);
						// console.log(arr[j]);
						flag = false;
						break;
					}
				}
				if(flag)
				{
					array.push(arr[i]);
				}
			}
			else{
				array.push(arr[i]);
			}
			flag = true;
		}
		arr = [];
		arr = array
	}
	if(options.filetypes == "" || options.filetypes == undefined)
	{
		return arr;
	}
	else{
		var str = "";
		var types = options.filetypes;
		str = types.join("|");
		var reg = new RegExp("("+ str +")$");
		for(var i = 0 ; i < arr.length ; i++)
		{
			if(!reg.test(arr[i])&&arr[i].indexOf(options.start_url)>-1)
			{
				bufferArray.push(arr[i]);
			}
		}
		return bufferArray;
	}
}

// 将数组中的数据写入目标文件objFile中 txt文件
function dataToFile(arr,objFile){
	for(var i = 0 ; i < arr.length ; i++)
	{
		fs.appendFileSync(objFile, `${arr[i]}\n`);
	}
}

function operate(operate_url){
	async.mapLimit(operate_url,count,function(url,callback){get_link(url,callback)}
	,function(err,result){
		warehouse = filter(warehouse,options);
		repositary = repositary.concat(warehouse);
		// console.log(repositary);
		operate_url = [];
		operate_url = warehouse;
		warehouse = [];
		counter++;
		if(counter>=depth)
		{
			repositary = filter(repositary,options);
			dataToFile(repositary,"links.txt");
			return;
		}
		operate(operate_url);
	})
}
operate(operate_url);