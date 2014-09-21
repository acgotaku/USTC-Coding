
/********************************************************************/
/* Copyright (C) SSE-USTC, 2012-2013                                */
/*                                                                  */
/*  FILE NAME             :  menu.c                                 */
/*  PRINCIPAL AUTHOR      :  WangBiao                               */
/*  SUBSYSTEM NAME        :  Menu                                   */
/*  MODULE NAME           :  LinkTable                              */
/*  LANGUAGE              :  C                                      */
/*  TARGET ENVIRONMENT    :  ANY                                    */
/*  DATE OF FIRST RELEASE :  2014/09/12                             */
/*  DESCRIPTION           :  interface of Menu                      */
/********************************************************************/

/*
 * Revision log:
 *
 * Created by WangBiao,2014/09/21
 *
 */

#include<stdio.h>
#include<stdlib.h>

#include"menu.h"

/*
 * Create a Menu
 */
void InitMenu(tLinkTable ** head)
{
    
    /* Init cmd list */
    *head= CreateLinkTable();
}
/*
 * Add a MenuItem
 */
void AddMenuItem(tLinkTable ** head, tDataNode * p)
{
    AddLinkTableNode(*head,(tLinkTableNode *)p);
}
/*
 * Del a MenuItem
 */
void DelMenuItem(tLinkTable ** head, tDataNode * p)
{
    DelLinkTableNode(*head,(tLinkTableNode *)p);
}
/*
 * Query a Menu
 */
tDataNode * QueryItem(tLinkTable * head,char * cmd)
{
    /* cmd line begins */
    tDataNode * p = (tDataNode*)GetLinkTableHead(head);
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
/*
 * Query a Menu
 */
void ShowAllMenu(tLinkTable * head)
{
    tDataNode * pNode = (tDataNode*)GetLinkTableHead(head);
    while(pNode != NULL)
    {
        printf("%s - %s\n", pNode->cmd, pNode->desc);
        pNode = (tDataNode*)GetNextLinkTableNode(head,(tLinkTableNode *)pNode);
    }
}