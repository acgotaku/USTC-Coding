function showNumberWithAnimation( i , j , randNumber, config ){

    var numberCell = $('#number-cell-' + i + "-" + j );
    numberCell.addClass('cell-'+board[i][j]);
    numberCell.text( randNumber );

    numberCell.animate({
        width:config.cellSideLength,
        height:config.cellSideLength,
        top:support2048.getPosTop( i , j ,config.cellSpace, config.cellSideLength),
        left:support2048.getPosLeft( i , j,config.cellSpace, config.cellSideLength )
    },50);
}
function showMoveAnimation( fromx , fromy , tox, toy ,config){

    var numberCell = $('#number-cell-' + fromx + '-' + fromy );
    numberCell.animate({
        top:support2048.getPosTop( tox , toy ,config.cellSpace,config.cellSideLength),
        left:support2048.getPosLeft( tox , toy ,config.cellSpace,config.cellSideLength)
    },200);
}
