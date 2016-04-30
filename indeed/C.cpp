#include<stdio.h>
int n, q;
int MAX = 999999;
const int maxn = 200;
int data[maxn][maxn];

void floyd(int n)
{
  for(int k = 0; k < n; k++)
    for(int i = 0; i < n; i++)
      for(int j = 0; j < n; j++)
        if(data[i][j] > data[i][k] + data[k][j])
          data[i][j] = data[i][k] + data[k][j];
}


void init()
{
  for(int i = 0; i < n; i++)
    for(int j = 0; j < n; j++)
    {
      data[i][j] = MAX;
      if( (i+1) == j)
        data[i][j] = 1;
      if(i == j)
        data[i][j] = 0;
    }
  floyd(n);
}

int main()
{

  int a, b;
  scanf("%d %d\n", &n, &q);
  init();
  while(q--)
  {
    scanf("%d %d\n", &a, &b);
    if(a == b)
    {
      printf("0\n");
      continue;
    }
    a--;
    b--;
    if(data[a][b] == MAX)
      printf("-1\n");
    else
      printf("%d\n", data[a][b]);
    data[a][b] = 1;
    floyd(n);
  }
}
