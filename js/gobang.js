/**
核心算法模块
create 2015-1-9 11:37:37
update 2015-1-23 16:19:09

**/
define(function(){

    /** 初始化数据开始**/
	var isStart = true;//标记是否刚刚开局
	var p1_x,p1_y;
	var p2_x,p2_y;
	var move =[];//走法数组
	var step = 0;
	
    //棋盘 0表示没有棋子，1为player1,2为player2
    var board = initBorad();
	var t_board = initBorad();
	
	function initBorad(){
        var board = new Array();
        for(var i = 0 ;i < 15; i++ ){
            board[i] = new Array();
            for(var j = 0;j < 15;j++){
                board[i][j] = 0;
            }
        }
        return board;
    };
	
	
    //table[15][15][572]对于15*15的棋盘，一共有572种可能获胜的可能
    //table[x][y][k]为true表示在坐标（x,y）是计算机第k个"5"(获胜组合)中的一个位置。.
    //false表示这种获胜可能已经被封死了
    var p1_table = initTable();
    var p2_table = initTable();
	var t_p1_table = initTable();
	var t_p2_table = initTable();
	
    function initTable() {
        var table = new Array();
        for (var i = 0; i < 15; i++) {
            table[i] = new Array();
            for (var j = 0; j < 15; j++) {
                table[i][j] = new Array();
                for (var k = 0; k < 572; k++) {
                    table[i][j][k] = false;
                }
            }
        }


        var count = 0;
        for (var x = 0; x < 15; x++){ // x坐标相同的交叉点
            for (var y = 0; y < 11; y++) {
                for (var k = 0; k < 5; k++) {
                    // 第count个能成5的位置为[x][y+k]
                    table[x][y + k][count] = true;
                }
            count++;
            }
        }
        for (var y = 0; y < 15; y++){ // y坐标相同的交叉点
            for (var x = 0; x < 11; x++) {
                for (var k = 0; k < 5; k++) {
                   table[x + k][y][count] = true;
                }
            count++;
          }
        }

        for (var x = 0; x < 11; x++){ // 主对角线╲
            for (var y = 0; y < 11; y++) {
                for (var k = 0; k < 5; k++) {
                   table[x + k][y + k][count] = true;
                }
            count++;
             }
        }
        for (var x = 4; x < 15; x++){ // 次对角线╱
            for (var y = 0; y < 11; y++) {
                for (var k = 0; k < 5; k++) {
                    table[x - k][y + k][count] = true;
                }
            count++;
            }
        }
		console.info("获胜可能初始化成功")
        return table;
    }

    //win[0][k]的值表示player1在第k个获胜可能中已经存在的连子数，初始为0,9表示这个获胜组合已经不可能获胜
    //同理win[1][k]用于表示player2
    var win = initWin();
	var t_win = initWin();
	
	function initWin(){
         var win = new Array();
         for(var i = 0;i < 2;i++){
             win[i] = new Array();
             for(var j = 0; j < 572;j++){
                 win[i][j] = 0;
             }
         }
         return win;
     };
	 
	function reset(){
		var startTime = new Date().getTime();
		board = initBorad();
		p1_table = initTable();
		p2_table = initTable();
		win = initWin();
		var end = new Date().getTime();
		console.info("重新初始化数据完成，耗时:"+(end - startTime)+"ms")
	};
	

    /** 初始化数据结束**/
	
	/**复制数据*/
	function copyData(type){
		var startTime = new Date().getTime();
		for(var i = 0;i < 2;i++){
             for(var j = 0; j < 572;j++){
				if(type == 1)
					t_win[i][j] = win[i][j];
				else{
					win[i][j] = t_win[i][j];
					}
             }
         };
		 
		for(var i = 0 ;i < 15; i++ ){
            for(var j = 0;j < 15;j++){
                t_board[i][j] = board[i][j];
				for (var k = 0; k < 572; k++) {
					if(type == 1){
						t_p1_table[i][j][k] = p1_table[i][j][k];	
						t_p2_table[i][j][k] = p2_table[i][j][k];
					}else{
						p1_table[i][j][k] = t_p1_table[i][j][k];	
						p2_table[i][j][k] = t_p2_table[i][j][k];
					}
                }
            }
        }
		var end = new Date().getTime();
		console.info("复制数据完成，耗时:"+(end - startTime)+"ms")
	
	}
	
	
	/***保存局面**/
	
	//评估函数，返回在(x,y)下子后的得分，player1为正，player2为负，绝对值越大代表当前局面越好
	//遍历所有在(x,y)还有可能获胜的组合，如果这个位置的所有获胜可能都为false，则返回0;
     function getSocre(x,y,type){
        var score = 0;
		for(var k= 0;k < 572;k++){
			if(type == 1){//玩家1
				if(p1_table[x][y][k]){
					switch(win[0][k]){
						case 1:score += 5;break;
						case 2:score += 50;break;
						case 3:score += 500;break;
						case 4:score += 5000;break;
						default:break;
					}
				}		
			}else if(type == 2){//玩家2
				if(p2_table[x][y][k]){
					switch(win[1][k]){
						case 1:score -= 5;break;
						case 2:score -= 50;break;
						case 3:score -= 500;break;
						case 4:score -= 5000;break;
						default:break;
					}
					
				}
			}
		}
		return score;
    }
	//搜索棋盘上所有能下的点，返回最好的局面值
	 function searchPoint(type){
		var value = 0;
		for(var i = 0 ; i< 15;i++){
			for(var j = 0;j<15;j++){
				if(board[i][j] == 0){
					var temp = getSocre(i,j,type);
					if(type ==1 && temp >value){
						value = temp;
						p1_x = i;
						p1_y = j;		
					}else if(type == 2 && temp < value ){
						value = temp;
						p2_x = i;
						p2_y = j;
					}
				}
			}
		}
		return value;
	 }
	
	
	
	
	//玩家在棋盘上下棋后的数据变化，包括：棋盘在[x][y]处设置为相应的下棋方;
	//如果是玩家1下，玩家2对应的所有p2_table[x][y][k] 对应为false，win[1][k]=9,即这一点的所有获胜可能已经不存在。
	//玩家1在该点所有的获胜可能（win[0][k]）上加1
	function makeMove(x,y,type){
		//if(board[x][y] != 0) return;
		for(var k= 0;k <= 572; k++){
			if(type == 1 ){				
				if(p1_table[x][y][k] && win[0][k] !=9){
					win[0][k] ++;
				}
				if(p2_table[x][y][k]){
					p2_table[x][y][k] = false;
					win[1][k] = 9;
				}
				board[x][y] = 1;
			}
			if(type == 2){
				if(p2_table[x][y][k] && win[1][k] !=9){
					win[1][k] ++;
				}
				if(p1_table[x][y][k]){
					p1_table[x][y][k] = false;
					win[0][k] = 9;
				}
				board[x][y] = 2;
			}		
		}
		move.push(x,y,type);
		step ++;//步数+1
	}
	
	//保存当前局面
	function copyBoard(){
		var t_board = new Array();
        for(var i = 0 ;i < 15; i++ ){
            t_board[i] = new Array();
            for(var j = 0;j < 15;j++){
                t_board[i][j] = board[i][j];
            }
        }
		console.info('局面保存成功！')
        return t_board;
	}
	
	//走法回退，这里就不用栈了，直接重新设置相关的数组
	function unMove(){
		copyData(2);
	}
	
	
	//player1用最大搜索
	function maxSearch(dept){
		var score ,best = -1000000;
		var temp = 0;
		if(dept < 1){
			score = searchPoint(1);
		}else{
		console.info("player1:"+dept);
		for(var i = 0;i<15;i++){
				for(var j=0;j<15;j++){
					makeMove(i,j,1);
					score = minSearch(dept-1);
					if(score > best){
						best = score;
					}
				}		
					
			}	
			return best;	
		}
		
	}
	

	//plyer2用最小搜索
	function minSearch(dept){
		var score ,best = 1000000;
		var temp = 0;
		if(dept < 1){
			score = searchPoint(2);
		}else{
			console.info("player2:"+dept);
			for(var i = 0;i<15;i++){
				for(var j=0;j<15;j++){
					makeMove(i,j,2);
					score = maxSearch(dept-1);
					if(score < best){
						best = score;
					}
				}			
			}
				
			return best;
		}	
		
	}
	//最大最小搜索，dept等于1时表示向前一步
	function maxminSearch(dept){
		console.info(dept)
		if(dept = 0 )
			return searchPoint(2);
		else 
			return minSearch(dept);
	
	}
	
	/*查询是否已经有三个连子*/
	function search3(){
		var flag = false;
		for(var i = 0;i < 572; i++){
			if(win[1][i] == 3){
				flag = true;
			}
		}
		return flag;
	}
	var is3 = search3();
	
	//返回：0表示还没有人赢，1表示player1赢了，2,player2赢
	function isWin(){
		var isWin = 0;
		for(var i = 0;i < 2;i++){
			for(var j = 0;j < 572; j++){
				if(win[i][j] == 5){
					if(i == 0) isWin = 1;
					if(i == 1) isWin = 2;
				}
			}
		}
		return isWin;
	};
	
	function display(){
		for(var i = 0;i < 2;i++){
			console.info(win[i]);
			for(var j = 0;j < 572; j++){
				
			}
		}
	}
	
	//直观的用贪心算法搜索2步。
	function simpleSearch(type){
		//alert(move)
		var score = 0,p1_score = 1000000,p2_score = -1000000;
		if(type == 2){
			if(isStart){//开始第一步,在（5，5）到（10，10）的坐标内随机选一个下
				var x = Math.round(Math.random()*5)+5;
				var y = Math.round(Math.random()*5)+5 ;
				if(board[x][y] == 0){
					p2_x = x;
					p2_y = y;
				}
				else{
					p2_x = 8;
					p2_y = 8;
				}	
				console.info('游戏开始，player2在('+p2_x+','+p2_y+')下子...')
				//board[p2_x][p2_y] = 2;
				makeMove(p2_x,p2_y,2);	
				isStart = false;
			}else{
			 
				copyData(1);//保存局面
				//用贪心算法搜索2步。				
				p2_score = searchPoint(2);//第一步
				console.info('player2第一步可以在('+p2_x+','+p2_y+')下子...该点评估得分为：'+p2_score);
				makeMove(p2_x,p2_y,2);
				p1_score = searchPoint(1);//第二步
				console.info('player1第二步想在('+p1_x+','+p1_y+')下子...该点评估得分为：'+p1_score);				
				//maxminSearch(5);

				if(-p2_score < p1_score ){//此处设计为防守为主，但是在有三个连子以上的情况下，优先进攻
					console.info('下玩家想下的位置...')
					unMove();
					makeMove(p1_x,p1_y,2);
					p2_x = p1_x;
					p2_y = p1_y;
				}else{
					console.info('下自己的位置...');
					unMove();
					makeMove(p2_x,p2_y,2);	
				}
			}
		}
	
	}
	
	function chess(x,y,flag){
		var winFlag = isWin();
		if(winFlag == 1){
			return [x,y,1]
		}else if(winFlag == 2){
			return [x,y,2];
		}
		/*都没赢
		1.p1先下，判断，如果赢，返回(x,y,1)
		2,如果没有赢，调用方法，p2下棋
		3.判断，如果p2赢，返回(p2_x,p2_y,2)
		
		*/
		makeMove(x,y,1);	
		winFlag = isWin();
		if(winFlag == 1){
			return [x,y,1]
		}else{		
			t_board = copyBoard();//先保存局面
			simpleSearch(2);
			if(isWin() == 2)
			return [p2_x,p2_y,2];
			else 
			return [p2_x,p2_y,0];
		}
	}
	
	
	
	
	//对外接口，此处设计为在(x,y)下子后返回电脑应该下子的坐标(x1,y1,0)
	//返回（x,y，1）表示player1已经赢了，反回(x,y,2)表示player2赢
	var go = function(x,y,flag){
		return chess(x,y,flag);
	}
	
	return {
		go:go
	};

})