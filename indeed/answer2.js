var field=[['+','#','S'],
           ['+','+','+'],
           ['+','+','+'],
           ['+','G','+']
            ];
var getDistance = function(field){
    var row = field.length;
    var col = field[0].length;
    var data = new Array(row);
    var start ={x:-1,y:-1};
    var end = {x:-1,y:-1};
    var stack=[],flag =false;
    for(var i=0;i<row;i++){
        data[i] = new Array(col);
    }
    //find start and end point inital data matrix
    for(var i=0;i<row;i++){
        for(var j=0;j<col;j++){
            data[i][j] = {"val":-1,parent:{x:-1,y:-1}};
            if(field[i][j] == 'S'){
                start.x = i;
                start.y = j;
                data[i][j] ={"val":0,parent:{x:-1,y:-1}};
            }
            if(field[i][j] == 'G'){
                end.x = i;
                end.y = j; 
            }
        }
    }
    //get near position
    var near =function(point){
        var array =[];
        if(point.x >0){
            array.push({x:point.x-1,y:point.y});
        }
        if(point.y >0){
            array.push({x:point.x,y:point.y-1});
        }
        if(point.x < row-1){
            array.push({x:point.x+1,y:point.y});
        }
        if(point.y < col-1){
            array.push({x:point.x,y:point.y+1});
        }
        return array;
    };
    // from start to search four direction
    var queue =[];
    queue.push(start);
    while(queue.length > 0){
        var parent = queue.shift();
        var near_data = near(parent);
        for(var i=0;i<near_data.length;i++){
            var point_x =near_data[i].x;
            var point_y =near_data[i].y;
            if(data[point_x][point_y].val == -1 && field[point_x][point_y] != '#' && field[point_x][point_y] != 'S'){
                data[point_x][point_y].val= data[parent.x][parent.y].val +1;
                data[point_x][point_y].parent = parent;
                queue.push({x:point_x,y:point_y});
            }
        }
    }
    var item = data[end.x][end.y].parent;
    while(data[item.x][item.y].parent.x != -1){
        var point_x =item.x;
        var point_y =item.y;
        console.log({x:point_x,y:point_y});
        field[point_x][point_y] ='@';
        item = data[point_x][point_y].parent

    };
    for(var i=0;i<row;i++){
        console.log(field[i]);
    }
};