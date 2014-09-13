
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

#define DESC_LEN    1024
#define CMD_LEN    10
#define CMD_NUM    10
typedef struct DataNode
{
    char     cmd[CMD_LEN];
    char    desc[DESC_LEN];
    struct  DataNode *next;
} tDataNode;
tDataNode * Init(tDataNode * head);
tDataNode * SelectCmd(tDataNode * head,char * cmd);
int main()
{   
    tDataNode * head = NULL; 
    head=Init(head);
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
tDataNode * Init(tDataNode * head)
{
    
    /* Init cmd list */
    int i;
    char * list[10]={"zero","one","two","three","four","five","six","seven","eight","nine"};
    tDataNode * p=NULL;
    for (i=0; i<CMD_NUM; i++)
    {
        printf("%s",list[i]);
        p = (tDataNode*)malloc(sizeof(tDataNode));
        snprintf(p->cmd, CMD_LEN, "%s", list[i]);
        snprintf(p->desc, DESC_LEN, "This is %s cmd!", list[i]);
        p->next = head;
        head = p;
    }
    printf("Menu List:\n");
    p = head;
    while(p != NULL)
    {
        printf("%s - %s\n", p->cmd, p->desc);
        p = p->next;
    }
    printf("exit - exit program!\n");
    return head;
}
tDataNode * SelectCmd(tDataNode * head,char * cmd)
{
    /* cmd line begins */
    tDataNode * p = head;
    while(p != NULL)
    {
        if(strcmp(p->cmd,cmd)==0)
        {
            return p;
        }
        p = p->next;
    }
    return NULL;
}