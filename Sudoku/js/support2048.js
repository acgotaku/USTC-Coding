/**
 * Created by acgotaku on 14-6-18.
 */
var support2048 = {
    getPosTop: function(i, j, cellSpace, cellSideLength) {
        return cellSpace + i*( cellSpace + cellSideLength );
    },
    getPosLeft: function(i, j, cellSpace, cellSideLength) {
        return cellSpace + j*( cellSpace + cellSideLength );
    },
    nospace: function(board) {
        for (var i = 0; i < 4; i ++)
            for (var j = 0; j < 4; j ++)
                if (board[i][j] == 0)
                    return false;

        return true;

    },
    canMoveLeft: function() {
        for (var i = 0; i < 4; i ++)
            for (var j = 1; j < 4; j ++)
                if (board[i][j] != 0)
                    if (board[i][j - 1] == 0 || board[i][j - 1] == board[i][j])
                        return true;

        return false;
    },
    canMoveRight:function(){
        for (var i = 0; i < 4; i ++)
            for (var j = 2; j >= 0; j --)
                if (board[i][j] != 0)
                    if (board[i][j + 1] == 0 || board[i][j + 1] == board[i][j])
                        return true;

        return false;
    },
    canMoveUp:function(){
        for (var j = 0; j < 4; j ++)
            for (var i = 1; i < 4; i++)
                if (board[i][j] != 0)
                    if (board[i-1][j] == 0 || board[i-1][j] == board[i][j])
                        return true;

        return false;
    },
    canMoveDown:function(){
        for (var j = 0; j < 4; j ++)
            for (var i = 2; i >= 0; i --)
                if (board[i][j] != 0)
                    if (board[i+1][j] == 0 || board[i+1][j] == board[i][j])
                        return true;

        return false;
    },
    noBlockHorizontal:function(row,col1,col2,board){
        for(var i=col1+1;i<col2;i++){
            console.log(board[row][i]);
            if(board[row][i]!=0){
                return false;
            }
        }
        return true;
    },
    noBlockVertical:function(col,row1,row2,board){
        for(var i=row1+1;i<row2;i++){
            if(board[i][col]!=0){
                return false;
            }
        }
        return true;
    },
    nomove:function(board){
        if(this.canMoveDown()||this.canMoveUp()||this.canMoveRight()||this.canMoveLeft()){
            return false;
        }
        return true;
    }
};
