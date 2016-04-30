#include <stdio.h>

const int maxn = 30;
const int MAX = 9999999;
int cost[maxn][maxn];
int dp[maxn][maxn][maxn][maxn];
int row, col;

int get_sum(int row1, int col1, int row2, int col2)
{
  int ret = 0;
  for(int i = row1; i <= row2; i++)
    for(int j = col1; j <= col2; j++)
      ret += cost[i][j];
  return ret;
}

int _dp(int row1, int col1, int row2, int col2)
{
  if(row1 == row2 && col1 == col2)
    return 0;
//  printf("%d %d %d %d\n", row1, col1, row2, col2);
  if(dp[row1][col1][row2][col2] != MAX)
    return dp[row1][col1][row2][col2];
  int tmp = get_sum(row1, col1, row2, col2);
 //// printf("sum:%d %d %d %d = %d\n", row1, col1, row2, col2, tmp);
  int t;
  for(int i = row1 ; i < row2; i ++)
  {
    t = _dp(row1, col1, i, col2) + _dp(i+1, col1, row2, col2) + tmp;
    if(t < dp[row1][col1][row2][col2])
      dp[row1][col1][row2][col2] = t;
  }
  for(int i = col1 ; i < col2; i ++)
  {
    t = _dp(row1, col1, row2, i) + _dp(row1, i+1, row2, col2) + tmp;
    if(t < dp[row1][col1][row2][col2])
      dp[row1][col1][row2][col2] = t;
  }
  return dp[row1][col1][row2][col2];
}

int main()
{
  char tmp[maxn];
  scanf("%d %d\n", &row, &col);
  for(int i = 0; i < row; i++)
  {
    scanf("%s\n", tmp);
    for (int j = 0; j < col; j++)
      cost[i][j] = tmp[j] - '0';
  }
  for(int i = 0; i < row; i++)
    for(int j = 0; j < col; j++)
      for(int k = 0; k < row; k++)
        for(int l = 0; l < col; l++)
          dp[i][j][k][l] = MAX;
  printf("%d\n", _dp(0, 0, row-1, col-1));
}
