
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

#define debug 
int results[3] = {0,0,0};
char * info[3] =
{
    "Init Menu fail",
    "Add Menu Item fail",
    "Del Menu Item fail"
};
int main()
{   
    tLinkTable * head = NULL; 
    InitMenu(&head);
    if(head == NULL)
    {
        debug("Init Menu fail\n");
        results[0] = 1;
    }
    int i;
    char * list[10]={"zero","one","two","three","four","five","six","seven","eight","nine"};
    tDataNode * p=NULL;
    for (i=0; i<CMD_NUM; i++)
    {
        p = (tDataNode*)malloc(sizeof(tDataNode));
        snprintf(p->cmd, CMD_LEN, "%s", list[i]);
        snprintf(p->desc, DESC_LEN, "This is %s cmd!", list[i]);
        AddMenuItem(&head,p);
        if(AddMenuItemStub(&head,p) == FAILURE)
        {
            debug("Add Menu Item fail\n");
            results[1] = 0;
        }
        if(DelMenuItemStub(&head,p) == FAILURE)
        {
            debug("Del Menu Item fail\n");
            results[2] = 0;
        }
    }
    /* test report */
    printf("test report\n");
    for(i=0;i<=2;i++)
    {
        if(results[i] == 0)
        {
            printf("Testcase Number%d  - %s\n",i,info[i]);
        }
    }
}