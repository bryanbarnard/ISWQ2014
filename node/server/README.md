###NODEJS Server Implementation README

<b>Installation</b>  
1.  Clone Repo  
2.  $ cd ISWQ2014/node/bin  
3.  $ npm install  
4.  $ node index.js  

<b>Simple Test</b>  
$ curl -v http://localhost:1337/api/api

<b>Dependencies</b>  
Expects MongoDB running on localhost with a db named 'api' and a collection named movies. If collection does not exist it will be created on first insert (POST).
