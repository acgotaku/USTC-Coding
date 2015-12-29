#include<iostream>  
#include<cstring>  
#include<cstdlib>  
#include<cstdio>     
#include<queue>  
using namespace std;  

int n,m;  
const int N=250;  
const int M=10000;  
const int MAX=0xffffff;  
int pre[M];// save parent point
int dist[M];// distance to source

int inq[M];// record whether in queue
int min_c_f;// record in augmenting paths the residual networks value
int vertex;// point num  
int sum;// save minimum cost
int order; // save order count
struct element  
{  
  int c;//Capacity  
  int f;// flow
  int c_f;//residual flow 
  int v;// value
} G[N][N];  

void init()  
{  
  sum=0;  
  vertex=9;
  int cnt;
  int index =vertex +2;
  scanf("%d\n", &cnt);
  order=cnt;
  for(int u=0; u<=vertex+1+order; u++)// init flow as 0
  {  
    for(int v=0; v<=vertex+1+order; v++)  
    {  
      G[u][v].c=G[v][u].c=0;  
      G[u][v].c_f=G[v][u].c_f=0;  
      G[u][v].f=G[v][u].f=0;  
      G[u][v].v=G[v][u].v=MAX;  
    }  
  }  

  for(int i=0; i<vertex; i++)  
  {  
    G[i][i+1].v=0;
    G[i][i+1].c=G[i][i+1].c_f=MAX;
  }  
  G[0][1].c=G[0][1].c_f = 5;
  G[8][9].c=G[8][9].c_f = 5;

  while(cnt--)
  {
    int a, b, c;
    scanf("%d%d%d\n", &a,&b,&c);
    element* temp = &G[b+1][index]; //b+1+c
    temp->c = temp->c_f = 1;
    temp->v = -a * c;
	temp = &G[index][b+1+c]; //b+1+c
    temp->c = temp->c_f = 1;
    temp->v = 0;
	index++;
  }

}  

void SPFA(int s)// get the shortest path use the SPFA  algorithms
{  
  queue<int> Q;  
  int u;  
  for(int i=0; i<=vertex+1+order; i++)// init
  {  
    dist[i]=MAX;  
    pre[i]=-1;  
    inq[i]=0;  
  }  
  dist[s]=0;  
  Q.push(s);  
  inq[s] = 1;  
  while(!Q.empty())  
  {  
    u=Q.front();  
    Q.pop();  
    inq[u]=0;  
    for(int i=0; i<=vertex+1+order; i++)//update u adjacency point dist[], pre[], inq[]  
    {  
      int v=i;  
      if(G[u][v].c_f==0)     //  if (u,v) no edge ,back 
        continue;  
      if(G[u][v].v==MAX)  
        G[u][v].v=-G[v][u].v;  
      if(dist[v]>dist[u]+G[u][v].v)// update dist 
      {  
        dist[v]=dist[u]+G[u][v].v;  
        pre[v]=u;  
        if(inq[v]==0)  
        {  
          Q.push(v);  
          inq[v]=1;  
        }  
      }  
    }  
  }  
}  

void ford_fulkerson(int s,int t)  
{  
  SPFA(s);  
  while(pre[t]!=-1)//if pre[t] equal -1 means not find the augmenting paths
  {  
    int tmp = t;
    while(pre[tmp] != -1){
      cout << pre[tmp] << ' ';
      tmp = pre[tmp];
    }
    cout << "end" << endl;
    sum+=dist[t];//this is the minmum value
    cout << "dis " << dist[t] << endl;
    min_c_f=MAX;  
    int u=pre[t], v=t;//calculate the residual networks
    while(u!=-1)  
    {  
      if(min_c_f > G[u][v].c_f)  
        min_c_f=G[u][v].c_f;  
      v=u;  
      u=pre[v];  
    }  
    u=pre[t], v=t;  
    while(u!=-1)  
    {  
      G[u][v].f+=min_c_f; // change flow
      G[v][u].f=-G[u][v].f;  
      G[u][v].c_f=G[u][v].c-G[u][v].f; // change residual value
      G[v][u].c_f=G[v][u].c-G[v][u].f;  
      v=u;  
      u=pre[v];  
    }  
    SPFA(s);  
  }  
}  

int main()  
{  
  freopen("in.txt", "r", stdin);
  init();  
  ford_fulkerson(0,vertex);
  cout<<sum<<endl;  
  return 0;  
}
