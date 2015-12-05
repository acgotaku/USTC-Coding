//$(function(){
    var Suduku =(function(){
        var stack=[];
        return {
            init:function(){
                var self=this;
                $("#result").on("click",function(){
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
            },
            setTableData:function(){
                $(".tile-container").empty();
                var data=$("#data").val();
                var row =data.split("\n");
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
                var dataList = self.getTableData();
                var buffer_list=[];
                if(dataList.length > 0){
                    var flag =true;
                    for(var i=length-1;i >= 0;i--){
                        var cell=dataList[i];
                        var data=self.getCorrectData(cell.x,cell.y);
                        if(data != false && data.length == 1){
                           $("<div>").addClass("tile box-bold tile-position-"+cell.x+"-"+cell.y).append($("<div>").addClass("tile-inner").text(data[0])).appendTo($(".tile-container"));
                           dataList.splice(i,1);
                           length--;
                           flag=false;
                        }
                        if(data != false && data.length > 1){
                            buffer_list.push({"x":cell.x,"y":cell.y,"data":data});
                        }
                    }
                    if(flag){
                        if(buffer_list.length == 0){
                            console.log("wuji");
                            return;
                        }
                        var min_data=buffer_list[0];
                        for(var k=1;k<buffer_list.length;k++){
                            if(buffer_list[k].data.length < min_data.data.length){
                                min_data= buffer_list[k];
                            }
                        }
                        for(var i=0;i<min_data.data.length;i++){
                            stack.push({"x":min_data.x,"y":min_data.y,"data":min_data.data[i]});
                        }
                        self.startRecursiveSearch(dataList);
                    }
                }
            },
            startRecursiveSearch:function(){
                while(stack.length > 0){
                    var start =stack.pop();
                    $("<div>").addClass("tile box-bold hide tile-position-"+start.x+"-"+start.y).append($("<div>").addClass("tile-inner").text(start.data)).appendTo($(".tile-container"));
                }
            },
            recursiveSearch:function(){
                for(var i=length-1;i >= 0;i--){
                    var cell=dataList[i];
                    var data=self.getCorrectData(cell.x,cell.y);
                    if(data != false && data.length == 1){
                       $("<div>").addClass("tile box-bold tile-position-"+cell.x+"-"+cell.y).append($("<div>").addClass("tile-inner").text(data[0])).appendTo($(".tile-container"));
                       dataList.splice(i,1);
                       length--;
                       flag=false;
                    }
                    if(data != false && data.length > 1){
                        buffer_list.push({"x":cell.x,"y":cell.y,"data":data});
                    }
                }
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