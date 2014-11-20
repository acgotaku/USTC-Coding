#include <iostream>
#include <map>
#include <string>
#include <stdint.h>
#include <cstdlib>
#include <ctime>
#include <sstream>
using namespace std;
uint32_t hashCode(const char * arKey,uint32_t nKeyLength)
{
	uint32_t hash=5381;
	for(;nKeyLength>0;nKeyLength-=1)
	{
		hash = ((hash << 5) + hash) ^ *arKey++;
	}
	return hash;
}
uint32_t hashBack(char * suffix,uint32_t length,uint32_t end)
{
	uint32_t hash =end;
	for(;length>0;length-=1)
	{
		hash=(hash ^ suffix[length-1])* 1041204193;
	}
	return hash;
}
static const char alphanum[] =
"0123456789"
"ABCDEFGHIJKLMNOPQRSTUVWXYZ"
"abcdefghijklmnopqrstuvwxyz";
int stringLength = sizeof(alphanum) - 1;
char genRandom()  // Random string generator function.
{

    return alphanum[rand() % stringLength];
}
int main(int argc, char* argv[])
{   
	uint32_t target =atoi(argv[1]);
	map<string, string> list;
	int i;
	srand (time(NULL));
	for(i=0;i<65536;i++)
	{
		char p[4]={'\0'};
		p[0]=genRandom();
		p[1]=genRandom();
		p[2]=genRandom();	
		uint32_t data=hashBack(p,3,target);
		ostringstream key;
		key<<data;
		
		list[key.str()]=p;
	}
	for(i=0;i<100000000;i++){
		char q[8]={'\0'};
		q[0]=genRandom();
		q[1]=genRandom();
		q[2]=genRandom();
		q[3]=genRandom();
		q[4]=genRandom();
		q[5]=genRandom();
		q[6]=genRandom();
		uint32_t data=hashCode(q,7);
		ostringstream key;
		key<<data;
		if(list.find(key.str()) != list.end())
		{
			ostringstream temp;
			temp<<q<<list[key.str()];
			cout<<temp.str()<<endl;
			cout<<hashCode(temp.str().c_str(),10)<<endl;
		}
	}
 	return 0;
}