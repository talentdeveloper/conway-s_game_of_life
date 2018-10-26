var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3333;
var path = require('path');
const clients = {};
var createArray = function(rows) { //creates a 2 dimensional array of required height
	var arr = [];
	for (var i = 0; i < rows; i++) {
		arr[i] = [];
	}
	return arr;
}
var height = 20;
var width = 20;
var select_pieces = [];
var select_pieces_colors = [];
var display_pieces = [];
var display_pieces_colors = [];
var mirrorGrid = [];
var temp_color;
var block = [
  [0,0,0,0],
  [0,1,1,0],
  [0,1,1,0],
  [0,0,0,0]
];
var beehive = [
  [0,0,0,0,0,0],
  [0,0,1,1,0,0],
  [0,1,0,0,1,0],
  [0,0,1,1,0,0],
  [0,0,0,0,0,0]
];
var blinker = [
  [0,0,0,0,0],
  [0,0,1,0,0],
  [0,0,1,0,0],
  [0,0,1,0,0],
  [0,0,0,0,0]
];
var beacon = [
  [0,0,0,0,0,0],
  [0,1,1,0,0,0],
  [0,1,0,0,0,0],
  [0,0,0,0,1,0],
  [0,0,0,1,1,0],
  [0,0,0,0,0,0]
];

var getSpace = function(rows,cols,type)
{
	var firstpoint = -1;
	
	for(var i=0;i<height*width-((rows-1)*width);)
	{
		var flag = true;
		for(var start = i;start<i+cols;start++)
		{
			for(var j=0;j<rows;j++)
			{
				if(display_pieces[start+j*width]==1)flag = false;
			}
		}
		if(flag == true){firstpoint = i;break;}
		if((width-i%width)==cols)i+=cols;
		else i++;
	}
	if(firstpoint!=-1){
		var index = 0;
		for(var start = firstpoint;start < firstpoint+cols;start++)
		{
			for(var j=0;j<rows;j++)
			{
				switch(type)
				{
					case 1:display_pieces[start+j*width] = block[j][index];break;
					case 2:display_pieces[start+j*width] = beehive[j][index];break;
					case 3:display_pieces[start+j*width] = blinker[j][index];break;
					case 4:display_pieces[start+j*width] = beacon[j][index];break;
					default:break;
				}
				console.log(temp_color);
				display_pieces_colors[start+j*width] = temp_color;
			}
			index++;
		}
		console.log(display_pieces+block);
	}
}


for(var i=0;i<height*width;i++)
{
	select_pieces[i] = 0;
	display_pieces[i] = 0;
	select_pieces_colors[i] = "";
	display_pieces_colors[i] = "";
	mirrorGrid[i] = 0;
}
app.use(require('express').static(path.join(__dirname,'public')));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
io.on('connection', function(socket){

  socket.on('select piece', function(index){
	var select_flag;
	var play_flag = true;
	if(display_pieces[index] == 1)
	{
		play_flag = false;
	}
	
	if(select_pieces[index] == 1)
	{
		select_pieces[index] = 0;
		select_pieces_colors[index] = "";
		select_flag = false;
	}
	else 
	{
		select_pieces[index] = 1;
		select_pieces_colors[index] = clients[socket.id].color;
		select_flag = true;
	}
    io.emit('select piece', index,clients[socket.id].color,select_flag,play_flag);
  });


  socket.on('login',function(state){
	  var r = toHex(parseInt((Math.random()*256)));
	  var g = toHex(parseInt((Math.random()*256)));
	  var b = toHex(parseInt((Math.random()*256)));
	  var color_str = "#"+r+g+b;
	  clients[socket.id] = state;
	  clients[socket.id].color = color_str;
	  io.emit('login', color_str,display_pieces,display_pieces_colors,height,width);
  });

  socket.on('input_pattern',function(state){
	  temp_color = clients[socket.id].color;
	  switch(state)
	  {
		case 'block':
			getSpace(4,4,1);break;
		case 'beehive':
			getSpace(5,6,2);break;
		case 'blinker':
			getSpace(5,5,3);break;
		case 'beacon':
			getSpace(6,6,4);break;
		default:break;
	  }
	  io.emit('placeCell', display_pieces,display_pieces_colors,select_pieces);
  });

  socket.on('placeCell', function(){
	  for(var i=0;i<height*width;i++)
	  {
		 if(select_pieces[i]==1)display_pieces[i]=1;
		 if(select_pieces_colors[i] != "")display_pieces_colors[i] = select_pieces_colors[i];
	  }
	  for(var i=0;i<height*width;i++)
	 {
		select_pieces[i] = 0;
		select_pieces_colors[i] = "";
	 }
	console.log(display_pieces);
    io.emit('placeCell', display_pieces,display_pieces_colors,select_pieces);
  });

  socket.on('getDisplayData',function(){
	for (var j = 1; j < height; j++) 
	{ //iterate through rows
		for (var k = 1; k < width - 1; k++) 
		{ //iterate through columns
			var totalCells = 0;
			var colors=[];
			if(display_pieces[(j-1) * width + k-1]==1)
			{
				totalCells++;
				colors.push(display_pieces_colors[(j-1) * width + k-1]);
			}
			if(display_pieces[(j-1) * width + k]==1)
			{
				totalCells++;
				colors.push(display_pieces_colors[(j-1) * width + k]);
			}
			if(display_pieces[(j-1) * width + k+1]==1)
			{
				totalCells++;
				colors.push(display_pieces_colors[(j-1) * width + k+1]);
			}
			if(display_pieces[j * width + k-1]==1)
			{
				totalCells++;
				colors.push(display_pieces_colors[j * width + k-1]);
			}
			if(display_pieces[j * width + k+1]==1)
			{
				totalCells++;
				colors.push(display_pieces_colors[j * width + k+1]);
			}
			if(display_pieces[(j+1) * width + k-1]==1)
			{
				totalCells++;
				colors.push(display_pieces_colors[(j+1) * width + k-1]);
			}
			if(display_pieces[(j+1) * width + k]==1)
			{
				totalCells++;
				colors.push(display_pieces_colors[(j+1) * width + k]);
			}
			if(display_pieces[(j+1) * width + k+1]==1)
			{
				totalCells++;
				colors.push(display_pieces_colors[(j+1) * width + k+1]);
			}
			
			console.log(totalCells);
			switch (totalCells) {
				case 2:
					mirrorGrid[j * width + k] = display_pieces[j * width + k];
					break;
				case 3:
					mirrorGrid[j * width + k] = 1; //live
				console.log(colors);
					if(colors.length == 3 && colors[0]!=="" && colors[1] !=="" && colors[2]!=""){
						var r = parseInt((hexToRgb(colors[0]).r + hexToRgb(colors[1]).r + hexToRgb(colors[2]).r)/3);
						var g = parseInt((hexToRgb(colors[0]).g + hexToRgb(colors[1]).g + hexToRgb(colors[2]).g)/3);
						var b = parseInt((hexToRgb(colors[0]).b + hexToRgb(colors[1]).b + hexToRgb(colors[2]).b)/3);
						display_pieces_colors[j * width + k] = "#"+toHex(r)+toHex(g)+toHex(b);
					}
					break;
				default:
					mirrorGrid[j * width + k] = 0; //
			}
		}
	}
	for (var i = 1; i < height - 1; i++) 
	{
		//top and bottom
		mirrorGrid[i * width + 0] = mirrorGrid[i * width + height-3];
		mirrorGrid[i * width + height-2] = mirrorGrid[i * width + 1];
		//left and right
		mirrorGrid[i] = mirrorGrid[(height-3) *  width + i];
		mirrorGrid[(height-2) * width + i] = mirrorGrid[1 * width + i];

	}
	//swap grids
	var temp = display_pieces;
	display_pieces = mirrorGrid;
	mirrorGrid = temp;
	io.emit('placeCell', display_pieces,display_pieces_colors,select_pieces);
  });
});
http.listen(port, function(){
  console.log('listening on *:' + port);
});

function toHex(n) {
  n = n.toString(16) + '';
  return n.length >= 2 ? n : new Array(2 - n.length + 1).join('0') + n;
}
function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

