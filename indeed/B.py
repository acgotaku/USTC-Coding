#!/usr/bin/env python2
# -*- encoding: utf-8 -*-
# vim: set et sw=4 ts=4 sts=4 ff=unix fenc=utf8:
import os
import sys
import math
# from decimal import *
def calc():
    num = int(raw_input())
    count = int(raw_input())
    index =0
    start = 0
    obj ={}
    obj[num] =0
    if  count > 1000000:
        max_range =1000000
    else:
        max_range = count
    for i in range(0,max_range):
        first = int(str(num)[0:1])
        num_list = [int(x) for x in str(num)]
        num_list.insert(first,(first))
        del num_list[0]
        str_num = ''.join(str(i) for i in num_list)
        num = int(str_num)
        if  str_num in obj:
            start =int(obj[str_num])
            index =i+1
            break
        else:
            obj[str_num] = i+1
    if index > 0:
        count = (count - start) % ( index -start);
        for i in range(0,count):
            first = int(str(num)[0:1])
            num_list = [int(x) for x in str(num)]
            num_list.insert(first,(first))
            del num_list[0]
            str_num = ''.join(str(i) for i in num_list)
            num = int(str_num)

    print str(num)


def main(argv):
    calc()

if __name__ == "__main__":
    main(sys.argv)