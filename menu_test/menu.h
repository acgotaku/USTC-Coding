
/********************************************************************/
/* Copyright (C) SSE-USTC, 2012-2013                                */
/*                                                                  */
/*  FILE NAME             :  menu.h                                 */
/*  PRINCIPAL AUTHOR      :  WangBiao                               */
/*  SUBSYSTEM NAME        :  Menu                                   */
/*  MODULE NAME           :  Menu                                   */
/*  LANGUAGE              :  C                                      */
/*  TARGET ENVIRONMENT    :  ANY                                    */
/*  DATE OF FIRST RELEASE :  2014/09/21                             */
/*  DESCRIPTION           :  interface of Menu                      */
/********************************************************************/

/*
 * Revision log:
 *
 * Created by WangBiao,2014/09/21
 *
 */

#ifndef _MENU_H_
#define _MENU_H_

#include "linktable.h"
#define DESC_LEN    1024
#define CMD_LEN    50
#define CMD_NUM    10
/*
 * Menu Data Node Type
 */

typedef struct DataNode
{
    tLinkTableNode * pNext;
    char     cmd[CMD_LEN];
    char    desc[DESC_LEN];
    struct  DataNode *next;
} tDataNode;

/*
 * Create a Menu
 */
void InitMenu(tLinkTable ** head);
/*
 * Add a MenuItem
 */
int AddMenuItem(tLinkTable ** head, tDataNode * p);
/*
 * Del a MenuItem
 */
int DelMenuItem(tLinkTable ** head, tDataNode * p);
/*
 * Query a MenuItem
 */
tDataNode * QueryItem(tLinkTable * head,char * cmd);
/*
 * Show All MenuItem
 */
void ShowAllMenu(tLinkTable * head);

#endif /* _MENU_H_ */


