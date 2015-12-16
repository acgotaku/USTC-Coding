//$(function(){
    var Suduku =(function(){
        var stack=[];
        return {
            init:function(){
                var self=this;
                $(".button").on("click",function(){
                    $(".game-message").removeClass("game-over");
                });
                $("#result").on("click",function(){
                    stack =[];
                    self.getAnswer();
                });
                $("#init").on("click",function(){
                    $(".box-bold").fadeOut();
                    setTimeout(function(){
                        $(".box-bold").remove();
                    },800);
                });
                $("#filldata").on("click",function(){
                    self.setTableData();
                });
                $("#step").on("click",function(){
                    self.onlyOneStep();
                });
            },
            setTableData:function(){
                $(".tile-container").empty();
                var data=$("#data").val();
                var row =data.split("\n");
                if(row.length < 9){
                    return;
                }
                for(var i=0;i< 9;i++){
                    var cell=row[i];
                    for(var j=0;j<9;j++){
                        if(cell[j] != "0"){
                            $("<div>").addClass("tile tile-position-"+i+"-"+j).append($("<div>").addClass("tile-inner").text(cell.charAt(j))).appendTo($(".tile-container"));
                        }
                    }
                }
            },
            getAnswer:function(){
                var self=this;
                var data=self.traversalTable();
                if(data == true){
                    self.getAnswer();
                }else if(typeof data =="object"){
                    if(data == null){
                        return ;
                    }else{
                        var min_data=data[0];
                        for(var k=1;k<data.length;k++){
                            if(data[k].data.length < min_data.data.length){
                                min_data= data[k];
                            }
                        }
                        for(var i=0;i<min_data.data.length;i++){
                            stack.push({"x":min_data.x,"y":min_data.y,"data":min_data.data[i]});
                        }
                        self.startRecursiveSearch();
                    }

                }else if(data == false){
                    self.startRecursiveSearch();
                }

            },
            onlyOneStep:function(){
                var self=this;
                var data=self.traversalTable();
                if(data == true){
                    return ;
                }else if(typeof data =="object"){
                    if(data == null){
                        return ;
                    }else{
                        var min_data=data[0];
                        for(var k=1;k<data.length;k++){
                            if(data[k].data.length < min_data.data.length){
                                min_data= data[k];
                            }
                        }
                        for(var i=0;i<min_data.data.length;i++){
                            stack.push({"x":min_data.x,"y":min_data.y,"data":min_data.data[i]});
                        }
                    }
                }
                var start =stack.pop();
                if(start == null){
                    $(".game-message").addClass("game-over");
                    return ;
                }
                $(".tile-position-"+start.x+"-"+start.y).nextAll().remove();
                $(".tile-position-"+start.x+"-"+start.y).remove();
                $("<div>").addClass("tile box-bold tile-position-"+start.x+"-"+start.y).append($("<div>").addClass("tile-inner").text(start.data)).appendTo($(".tile-container"));
            },
            traversalTable:function(){
                var self=this;
                var dataList = self.getTableData();
                var buffer_list=[];
                var length = dataList.length;
                var only =false;
                if(length == 0){
                    return null;
                }
                for(var i=length-1;i >= 0;i--){
                    var cell=dataList[i];
                    var data=self.getCorrectData(cell.x,cell.y);
                    if(data != false && data.length == 1){
                       $("<div>").addClass("tile box-bold tile-position-"+cell.x+"-"+cell.y).append($("<div>").addClass("tile-inner").text(data[0])).appendTo($(".tile-container"));
                       only =true;
                    }else if(data != false && data.length > 1){
                        buffer_list.push({"x":cell.x,"y":cell.y,"data":data});
                    }else if(data == false){
                        return false;
                    }
                }
                if(only == true){
                    return true;
                }else{
                    return buffer_list;
                }

            },
            startRecursiveSearch:function(){
                var start =stack.pop();
                if(start == null){
                    $(".game-message").addClass("game-over");
                    return ;
                }
                $(".tile-position-"+start.x+"-"+start.y).nextAll().remove();
                $(".tile-position-"+start.x+"-"+start.y).remove();
                $("<div>").addClass("tile box-bold tile-position-"+start.x+"-"+start.y).append($("<div>").addClass("tile-inner").text(start.data)).appendTo($(".tile-container"));
                var self=this;
                self.getAnswer();
            },
            getTableData:function(){
                var dataList= [];
                for(var i=0;i < 9 ;i++){
                    for(var j=0;j < 9;j++){
                        if($(".tile-position-"+i+"-"+j).length == 0){
                            dataList.push({"x":i,"y":j,"data":0});
                        }
                    }
                }
                return dataList;
            },
            getRowData:function(x,y){
                var rowData=[];
                for(var i=0;i<9;i++){
                    if($(".tile-position-"+x+"-"+i).length == 1){
                        rowData.push($(".tile-position-"+x+"-"+i).text());
                    }                    
                }
                return rowData;
            },
            getColData:function(x,y){
                var colData=[];
                for(var i=0;i<9;i++){
                    if($(".tile-position-"+i+"-"+y).length == 1){
                        colData.push($(".tile-position-"+i+"-"+y).text());
                    }                    
                }
                return colData;
            },
            getNineData:function(x,y){
                var nineData=[];
                var row=Math.floor(x/3)*3;
                var col=Math.floor(y/3)*3;
                for(var i=row;i<row+3;i++){
                    for(var j=col;j<col+3;j++){
                        if($(".tile-position-"+i+"-"+j).length == 1){
                            nineData.push($(".tile-position-"+i+"-"+j).text());
                        }    
                    }
                }
                return nineData;
            },
            getCorrectData:function(x,y){
                var rowData=this.getRowData(x,y);
                var colData=this.getColData(x,y);
                var nineData=this.getNineData(x,y);
                var correctData=Array.from(new Set(rowData.concat(colData).concat(nineData)));
                var result=[];
                for(var i=1;i<10;i++){
                    if(correctData.indexOf(i.toString()) == -1){
                       result.push(i);
                    }
                }
                if(result.length ==0){
                    return false;
                }else{
                    return result;
                }
            }
        }
    })();
     Suduku.init();
//});