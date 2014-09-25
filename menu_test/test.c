
/**************************************************************************************************/
/* Copyright (C) icehoney.me, WB@USTC, 2014-2015                                                  */
/*                                                                                                */
/*  FILE NAME             :  test.c                                                               */
/*  PRINCIPAL AUTHOR      :  WangBiao                                                             */
/*  SUBSYSTEM NAME        :  menu                                                                 */
/*  MODULE NAME           :  menu                                                                 */
/*  LANGUAGE              :  C                                                                    */
/*  TARGET ENVIRONMENT    :  ANY                                                                  */
/*  DATE OF FIRST RELEASE :  2014/09/08                                                           */
/*  DESCRIPTION           :  This is a test for menu program                                      */
/**************************************************************************************************/

/*
 * Revision log:
 *
 * Created by WangBiao, 2014/09/25
 *
 */


#include <stdio.h>
#include <stdlib.h>
#include "menu.h"

#define debug printf
int main()
{   
    tLinkTable * head = NULL; 
    InitMenu(&head);
    if(head == NULL)
    {
        debug("Init Menu fail\n");
    }
    int i;
    char * list[10]={"zero","one","two","three","four","five","six","seven","eight","nine"};
    tDataNode * p=NULL;
    for (i=0; i<CMD_NUM; i++)
    {
        p = (tDataNode*)malloc(sizeof(tDataNode));
        snprintf(p->cmd, CMD_LEN, "%s", list[i]);
        snprintf(p->desc, DESC_LEN, "This is %s cmd!", list[i]);
        if(AddMenuItemStub(&head,p) == FAILURE)
        {
            debug("Add Menu Item fail\n");
        }
    }
    while(1)
    {
        char cmd[CMD_LEN];
        printf("Input a cmd string > ");
        scanf("%s", &cmd);
        if(strcmp("exit",cmd)==0)
        {
            return 0;
        }
        tDataNode *p =QueryItem(head,cmd);
        if( p == NULL)
        {
            printf("This is a wrong cmd!\n");
            continue;
        }
        printf("%s - %s\n", p->cmd, p->desc); 
    }
}