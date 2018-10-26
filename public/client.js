var height;
var width;
var colors = [];
var theGrid;
var mirrorGrid;
var liveCount = 0;
var playFlag = false;
var socket;
var select_piece_num=0;
createArray = function(rows) { //creates a 2 dimensional array of required height
	var arr = [];
	for (var i = 0; i < rows; i++) {
		arr[i] = [];
	}
	return arr;
},
createPanel = function(rows,cols){
	var html_txt = "";
	for(var rIndex = 0; rIndex < rows; rIndex++){
		html_txt += "<tr id='row_"+rIndex+"'>";
		for(var cIndex = 0; cIndex < cols; cIndex++ ){
			html_txt += "<td id='col_"+parseInt(rIndex*cols+cIndex)+"'><div class='white_piece'/></td>";
		}
		html_txt += "</tr>";
	}
	$("#panel").html(html_txt);	
	$('td').click(function(){
		var index = $(this).attr('id').substr(4);
		socket.emit('select piece', index);
		
	});

}
 updateGrid = function() { //perform one iteration of grid update
	for (var j = 1; j < rows - 1; j++) 
	{ //iterate through rows
		for (var k = 1; k < cols - 1; k++) 
		{ //iterate through columns
			var totalCells = 0;
			//add up the total values for the surrounding cells
			totalCells += theGrid[j - 1][k - 1]; //top left
			totalCells += theGrid[j - 1][k]; //top center
			totalCells += theGrid[j - 1][k + 1]; //top right

			totalCells += theGrid[j][k - 1]; //middle left
			totalCells += theGrid[j][k + 1]; //middle right

			totalCells += theGrid[j + 1][k - 1]; //bottom left
			totalCells += theGrid[j + 1][k]; //bottom center
			totalCells += theGrid[j + 1][k + 1]; //bottom right

			//apply the rules to each cell
			switch (totalCells) {
				case 2:
					mirrorGrid[j][k] = theGrid[j][k];
				   
					break;
				case 3:
					mirrorGrid[j][k] = 1; //live
					
					break;
				default:
					mirrorGrid[j][k] = 0; //
			}
		}
	}
	for (var l = 1; l < rows - 1; l++) 
	{
		//top and bottom
		mirrorGrid[l][0] = mirrorGrid[l][rows - 3];
		mirrorGrid[l][rows - 2] = mirrorGrid[l][1];
		//left and right
		mirrorGrid[0][l] = mirrorGrid[rows - 3][l];
		mirrorGrid[rows - 2][l] = mirrorGrid[1][l];

	}
	//swap grids
	var temp = theGrid;
	theGrid = mirrorGrid;
	mirrorGrid = temp;
	drawGrid();
 },
 drawGrid = function() { 
	liveCount = 0;
	for (var j = 0; j < rows; j++) { //iterate through rows
		for (var k = 0; k < cols; k++) { //iterate through columns
			if (theGrid[j][k] === 1) {
				socket.emit('getCreateColor', j,k);
				//$('#col_'+parseInt(j*rows+k)).css('background',colors[j*rows+k]);
				liveCount++;
			}
			else $('#col_'+parseInt(j*rows+k)).css('background','#fff');
			//$('#col_'+parseInt(j*rows+k)).html(theGrid[j][k]);
		}
	}
}
gameplay = function()
{
	socket.emit('getDisplayData');
	setTimeout(function(){gameplay();},1000);
}
$(function(){
	socket = io();
	$("#btn_play").click(function(){
			socket.emit('placeCell');
			$('#btn_play').prop("disabled",true);
			select_piece_num = 0;
	});

	$("#LifePresetList").change(function(){
		socket.emit('input_pattern',$(this).val());
	});

	

	socket.on('select piece', function(index,color,select_flag,play_flag){
        if(select_flag)
		{
			$("#col_"+index).css('background',color);
			$("#col_"+index).html("<div class='white_piece'/>");
			select_piece_num++;
		}
		else 
		{
			$("#col_"+index).css('background','#fff');
			select_piece_num--;
		}
		if(play_flag && select_piece_num!==0)$('#btn_play').prop("disabled",false);
		else $('#btn_play').prop("disabled",true);
    });
	

	socket.on('placeCell', function(pieces,colors,selects){
        for(var i=0;i<height*width;i++)
		{
			if(pieces[i]===1)
			{
				$('#col_'+i).css('background',colors[i]);
				$('#col_'+i).html("");
				//$('#col_'+i).html(pieces[i]);
			}
			else if(selects[i]!==1){
				$('#col_'+i).css('background','#fff');
				$('#col_'+i).html("<div class='white_piece'/>");
			}
		}
    });


	socket.emit('login',{color:{}});
	socket.on('login',function(color,display_pieces,display_colors,rows,cols){
		height = rows;
		width = cols;
		createPanel(rows,cols);
		for(var i=0;i<rows;i++)
		{
			for(var j=0;j<cols;j++)
			{
				if(display_pieces[i*cols+j]===1)
				{
					$('#col_'+parseInt(i*cols+j)).css('background',display_colors[i*cols+j]);
					$('#col_'+parseInt(i*cols+j)).html("");
				}
			}
		}
	});
	gameplay();
});