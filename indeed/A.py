#!/usr/bin/env python2
# -*- encoding: utf-8 -*-
# vim: set et sw=4 ts=4 sts=4 ff=unix fenc=utf8:
import os
import sys
import math
def permutations(head, tail=''):
    global all_list
    if len(head) == 0: all_list.append(tail)
    else:
        for i in range(len(head)):
            permutations(head[0:i] + head[i+1:], tail+head[i])

all_list=[]
# from decimal import *

str_abc = raw_input()
str_list = []
length = len(str_abc)
for i in range(0, length):
    str_list.append(str_abc[0:i]+'a'+str_abc[i+1:])
    str_list.append(str_abc[0:i]+'b'+str_abc[i+1:])
    str_list.append(str_abc[0:i]+'c'+str_abc[i+1:])
    str_list.append(str_abc[0:i]+'d'+str_abc[i+1:])
[permutations(x) for x in str_list]
all_list =list(set(all_list))
all_list.sort()
for x in all_list:
    print x



