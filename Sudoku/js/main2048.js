var board = new Array();
var score = 0;
var hasConflicted = new Array();
$(function() {
    var config = {
        documentWidth: window.screen.availWidth,
        gridContainerWidth: 0.92 * window.screen.availWidth,
        cellSideLength: 0.18 * window.screen.availWidth,
        cellSpace: 0.04 * window.screen.availWidth,
        init: function() {
            config.documentWidth = window.screen.availWidth;
            if (config.documentWidth > 500) {
                config.gridContainerWidth = 500;
                config.cellSpace = 20;
                config.cellSideLength = 100;
            } else {
                config.gridContainerWidth = 0.92 * window.screen.availWidth;
                config.cellSideLength = 0.18 * window.screen.availWidth;
                config.cellSpace = 0.04 * window.screen.availWidth;
            }

        }
    };
    var My2048 = {
        board: new Array(),
        init: function() {
            var self = this;
            config.init();
            self.redraw();
            $(window).resize(function() {
                config.init();
                self.redraw();
                self.updateBoardView();
            });
            for (var i = 0; i < 4; i++) {
                board[i] = new Array();
                hasConflicted[i] = new Array();
                for (var j = 0; j < 4; j++) {
                    board[i][j] = 0;
                    hasConflicted[i][j] = false;
                }
            }
            // board[0][0] = 2;
            // board[0][1] = 4;
            // board[0][2] = 2;
            self.updateBoardView();
            self.generateOneNumber();
            self.generateOneNumber();
            self.bindKey();
            self.touch();
            $("#start").click(function() {
                self.newGame();
            });
        },
        newGame: function() {
            for (var i = 0; i < 4; i++) {
                for (var j = 0; j < 4; j++) {
                    board[i][j] = 0;
                    hasConflicted[i][j] = false;
                }
            }
            $(".game-message").removeClass("game-over");
            score = 0;
            this.updateScore();
            this.updateBoardView();
            this.generateOneNumber();
        },
        redraw: function() {
            if (config.documentWidth < 500) {
                $('#grid-container').css('width', config.gridContainerWidth - 2 * config.cellSpace);
                $('#grid-container').css('height', config.gridContainerWidth - 2 * config.cellSpace);
                $('#grid-container').css('padding', config.cellSpace);
                $('#grid-container').css('border-radius', 0.02 * config.gridContainerWidth);
                $('.grid-cell').css('width', config.cellSideLength);
                $('.grid-cell').css('height', config.cellSideLength);
                $('.grid-cell').css('border-radius', 0.02 * config.cellSideLength);
            } else {
                $('#grid-container').removeAttr('style');
                $('.grid-cell').removeAttr('style');
            }
            for (var i = 0; i < 4; i ++)
                for (var j = 0; j < 4; j++) {
                    var gridCell = $('#grid-cell-' + i + "-" + j);
                    gridCell.css('top', support2048.getPosTop(i, j, config.cellSpace, config.cellSideLength));
                    gridCell.css('left', support2048.getPosLeft(i, j, config.cellSpace, config.cellSideLength));
                }
        },
        updateBoardView: function() {
            $(".number-cell").remove();
            for (var i = 0; i < 4; i ++)
                for (var j = 0; j < 4; j++) {
                    $("#grid-container").append('<div class="number-cell" id="number-cell-' + i + '-' + j + '"></div>');
                    var theNumberCell = $('#number-cell-' + i + '-' + j);

                    if (board[i][j] == 0) {
                        theNumberCell.css('width', '0px');
                        theNumberCell.css('height', '0px');
                        theNumberCell.css('top', support2048.getPosTop(i, j, config.cellSpace, config.cellSideLength) + config.cellSideLength / 2);
                        theNumberCell.css('left', support2048.getPosLeft(i, j, config.cellSpace, config.cellSideLength) + config.cellSideLength / 2);
                    }
                    else {
                        theNumberCell.css('width', config.cellSideLength);
                        theNumberCell.css('height', config.cellSideLength);
                        theNumberCell.css('top', support2048.getPosTop(i, j, config.cellSpace, config.cellSideLength));
                        theNumberCell.css('left', support2048.getPosLeft(i, j, config.cellSpace, config.cellSideLength));
                        theNumberCell.addClass('cell-' + board[i][j]);
                        theNumberCell.text(board[i][j]);
                    }
                    hasConflicted[i][j] = false;
                }
            $('.number-cell').css('line-height', config.cellSideLength + 'px');
        },
        generateOneNumber: function() {
            if (support2048.nospace(board))
                return false;

            //随机一个位置
            var randx = parseInt(Math.floor(Math.random() * 4));
            var randy = parseInt(Math.floor(Math.random() * 4));

            for (var i = 0; i < 4; i++) {
                for (var j = 0; j < 4; j++) {
                    if (board[randx][randy] == 0)
                        break;

                    randx = parseInt(Math.floor(Math.random() * 4));
                    randy = parseInt(Math.floor(Math.random() * 4));
                }
            }
            if (board[randx][randy] != 0) {
                for (var i = 0; i < 4; i++) {
                    for (var j = 0; j < 4; j++) {
                        if (board[i][j] == 0) {
                            randx = i;
                            randy = j;
                            break;
                        }
                    }
                }
            }

            //随机一个数字
            var randNumber = Math.random() < 0.5 ? 2 : 4;

            //在随机位置显示随机数字
            board[randx][randy] = randNumber;
            showNumberWithAnimation(randx, randy, randNumber, config);

            return true;
        },
        touch: function() {
            var self=this;
            var container = document.getElementById("grid-container");
            var touchStartClientX, touchStartClientY;
            container.addEventListener("touchstart", function(event) {
                touchStartClientX = event.touches[0].pageX;
                touchStartClientY = event.touches[0].pageY;
                event.preventDefault();
            });
            container.addEventListener("touchmove", function(event) {
                event.preventDefault();
            });
            container.addEventListener("touchend", function(event) {
                var touchEndClientX, touchEndClientY;
                touchEndClientX = event.changedTouches[0].pageX;
                touchEndClientY = event.changedTouches[0].pageY;
                var dx = touchEndClientX - touchStartClientX;
                var absDx = Math.abs(dx);
                var dy = touchEndClientY - touchStartClientY;
                var absDy = Math.abs(dy);
                if (Math.max(absDx, absDy) > 10) {
                    if (absDx > absDy) {
                        if (dx > 0) {//right
                            if (self.moveRight()) {
                                self.updateScore();
                            }
                        } else {//left
                            if (self.moveLeft()) {
                                self.updateScore();
                            }
                        }
                    } else {
                        if (dy > 0) {//down
                            if (self.moveDown()) {
                                self.updateScore();
                            }
                        } else {//up
                            if (self.moveUp()) {
                                self.updateScore();
                            }
                        }
                    }
                }
                event.preventDefault();
            });

        },
        bindKey: function() {
            var self = this;
            $(document).keydown(function(event) {
                event.preventDefault();
                switch (event.keyCode) {
                    case 37://left
                        if (self.moveLeft()) {
                            self.updateScore();
                        }
                        break;
                    case 38://up
                        if (self.moveUp()) {
                            self.updateScore();
                        }
                        break;
                    case 39: //right
                        if (self.moveRight()) {
                            self.updateScore();
                        }
                        break;
                    case 40: //down
                        if (self.moveDown()) {
                            self.updateScore();
                        }
                        break;
                    default:
                        break;
                }
            });
        },
        updateScore: function() {
            var self = this;
            setTimeout(self.generateOneNumber.bind(self), 210);
            setTimeout(self.isGameOver.bind(self), 360);
            $("#score").text(score);
        },
        moveLeft: function() {
            if (!support2048.canMoveLeft(board)) {
                return false;
            }
            for (var i = 0; i < 4; i ++)
                for (var j = 1; j < 4; j++)
                {
                    if (board[i][j] != 0) {
                        for (var k = 0; k < j; k++) {
                            if (board[i][k] == 0 && support2048.noBlockHorizontal(i, k, j, board)) {
                                //move
                                showMoveAnimation(i, j, i, k, config);
                                board[i][k] = board[i][j];
                                board[i][j] = 0;
                                continue;
                            }
                            else if (board[i][k] == board[i][j] && support2048.noBlockHorizontal(i, k, j, board) && !hasConflicted[i][k]) {
                                //move
                                showMoveAnimation(i, j, i, k, config);
                                //add
                                board[i][k] += board[i][j];
                                board[i][j] = 0;
                                score += board[i][k];
                                hasConflicted[i][k] = true;
                                continue;
                            }
                        }
                    }
                }
            setTimeout(this.updateBoardView.bind(this), 200);
            return true;
        },
        moveRight: function() {
            if (!support2048.canMoveRight(board)) {
                return false;
            }
            for (var i = 0; i < 4; i ++)
                for (var j = 2; j >= 0; j--)
                {
                    if (board[i][j] != 0) {
                        for (var k = 3; k > j; k--) {
                            if (board[i][k] == 0 && support2048.noBlockHorizontal(i, k, j, board)) {
                                //move
                                showMoveAnimation(i, j, i, k, config);
                                board[i][k] = board[i][j];
                                board[i][j] = 0;
                                continue;
                            }
                            else if (board[i][k] == board[i][j] && support2048.noBlockHorizontal(i, j, k, board) && !hasConflicted[i][k]) {
                                //move
                                showMoveAnimation(i, j, i, k, config);
                                //add
                                console.log(i);
                                console.log(k);
                                console.log(j);
                                console.log(support2048.noBlockHorizontal(i, j, k, board));
                                board[i][k] += board[i][j];
                                board[i][j] = 0;
                                score += board[i][k];
                                hasConflicted[i][k] = true;
                                continue;
                            }
                        }
                    }
                }
            setTimeout(this.updateBoardView.bind(this), 200);
            return true;
        },
        moveUp: function() {
            if (!support2048.canMoveUp(board)) {
                return false;
            }
            for (var j = 0; j < 4; j ++)
                for (var i = 1; i < 4; i++)
                {
                    if (board[i][j] != 0) {
                        for (var k = 0; k < i; k++) {
                            if (board[k][j] == 0 && support2048.noBlockVertical(j, k, i, board)) {
                                //move
                                showMoveAnimation(i, j, k, j, config);
                                board[k][j] = board[i][j];
                                board[i][j] = 0;
                                continue;
                            }
                            else if (board[k][j] == board[i][j] && support2048.noBlockVertical(j, k, i, board) && !hasConflicted[k][j]) {
                                //move
                                showMoveAnimation(i, j, k, j, config);
                                //add
                                board[k][j] *= 2;
                                board[i][j] = 0;
                                score += board[k][j];
                                hasConflicted[k][j] = true;
                                continue;
                            }
                        }
                    }
                }
            setTimeout(this.updateBoardView.bind(this), 200);
            return true;
        },
        moveDown: function() {
            if (!support2048.canMoveDown(board)) {
                return false;
            }
            for (var j = 0; j < 4; j ++)
                for (var i = 2; i >= 0; i--)
                {
                    if (board[i][j] != 0) {
                        for (var k = 3; k > i; k--) {
                            if (board[k][j] == 0 && support2048.noBlockVertical(j, i, k, board)) {
                                //move
                                showMoveAnimation(i, j, k, j, config);
                                board[k][j] = board[i][j];
                                board[i][j] = 0;
                                continue;
                            }
                            else if (board[k][j] == board[i][j] && support2048.noBlockVertical(j, i, k, board) && !hasConflicted[k][j]) {
                                //move
                                showMoveAnimation(i, j, k, j, config);
                                //add
                                board[k][j] *= 2;
                                board[i][j] = 0;
                                score += board[k][j];
                                hasConflicted[k][j] = true;
                                continue;
                            }
                        }
                    }
                }
            setTimeout(this.updateBoardView.bind(this), 200);
            return true;
        },
        isGameOver: function() {
            if (support2048.nomove(board)) {
                this.GameOver();
            }
        },
        GameOver: function() {
            if (!$(".game-message").hasClass("game-over")) {
                $(".game-message").addClass("game-over");
            }
        }
    };
    My2048.init();
});
