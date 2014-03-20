###Python Implementation README

<b>Installation</b>  
1.  Clone Repo  
2.  $ cd ISWQ2014/python/server  
3.  $ pip install -r requirements.txt  
4.  $ python app.py  

<b>Simple Test</b>  
$ curl -v http://localhost:1338/api/api

<b>Dependencies</b>  
Expects MongoDB running on localhost with a db named 'api' and a collection named movies. If collection does not exist it will be created on first insert (POST).
