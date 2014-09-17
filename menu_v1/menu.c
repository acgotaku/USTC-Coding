
/**************************************************************************************************/
/* Copyright (C) icehoney.me, WB@USTC, 2014-2015                                                  */
/*                                                                                                */
/*  FILE NAME             :  menu.c                                                               */
/*  PRINCIPAL AUTHOR      :  WangBiao                                                             */
/*  SUBSYSTEM NAME        :  menu                                                                 */
/*  MODULE NAME           :  menu                                                                 */
/*  LANGUAGE              :  C                                                                    */
/*  TARGET ENVIRONMENT    :  ANY                                                                  */
/*  DATE OF FIRST RELEASE :  2014/09/08                                                           */
/*  DESCRIPTION           :  This is a menu program                                               */
/**************************************************************************************************/

/*
 * Revision log:
 *
 * Created by WangBiao, 2014/09/08
 *
 */


#include <stdio.h>
#include <stdlib.h>
#include "linktable.h"

int Help();
int Quit();

#define DESC_LEN    1024
#define CMD_LEN    50
#define CMD_NUM    10
typedef struct DataNode
{
    char     cmd[CMD_LEN];
    char    desc[DESC_LEN];
    struct  DataNode *next;
} tDataNode;
void Init(tLinkTable ** head);
tDataNode * SelectCmd(tLinkTable * head,char * cmd);
void ShowAllCmd(tLinkTable * head);
int main()
{   
    tLinkTable * head = NULL; 
    Init(&head);
    ShowAllCmd(head);
    while(1)
    {
        char cmd[CMD_LEN];
        printf("Input a cmd string > ");
        scanf("%s", &cmd);
        if(strcmp("exit",cmd)==0)
        {
            return 0;
        }
        tDataNode *p =SelectCmd(head,cmd);
        if( p == NULL)
        {
            printf("This is a wrong cmd!\n");
            continue;
        }
        printf("%s - %s\n", p->cmd, p->desc); 
    }
}

void Init(tLinkTable ** head)
{
    
    /* Init cmd list */
    *head= CreateLinkTable();
    int i;
    char * list[10]={"zero","one","two","three","four","five","six","seven","eight","nine"};
    tDataNode * p=NULL;
    for (i=0; i<CMD_NUM; i++)
    {
        p = (tDataNode*)malloc(sizeof(tDataNode));
        snprintf(p->cmd, CMD_LEN, "%s", list[i]);
        printf("%s\n",p->cmd);
        snprintf(p->desc, DESC_LEN, "This is %s cmd!", list[i]);
        AddLinkTableNode(*head,(tLinkTableNode *)p);
        printf("%s\n",p->cmd);
    }
}
tDataNode * SelectCmd(tLinkTable * head,char * cmd)
{
    /* cmd line begins */
    tDataNode * p = (tDataNode*)GetLinkTableHead(head);;
    while(p != NULL)
    {
        if(strcmp(p->cmd,cmd)==0)
        {
            return p;
        }
        p = (tDataNode*)GetNextLinkTableNode(head,(tLinkTableNode *)p);
    }
    return NULL;
}
void ShowAllCmd(tLinkTable * head)
{
    tDataNode * pNode = (tDataNode*)GetLinkTableHead(head);
    while(pNode != NULL)
    {
        printf("%s - %s\n", pNode->cmd, pNode->desc);
        pNode = (tDataNode*)GetNextLinkTableNode(head,(tLinkTableNode *)pNode);
    }
}