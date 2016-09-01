STARTUP SEQUENCE
--
1. Load NPM modules needed: do "npm i" in all directories
2. Start backend: backend/index.js (make sure that it has executable bit set)
3. Launch Redis. If you use a Redis server working on another host or non-default port number, you can set the host name and port number as command line argument for mid-end as documented in the mid-end's ./index.js --help output
4. Start mid-end: midend/index.js
5. Set up an http server for front-end (Important: browsers will not send XHR if the page is loaded from a local computer as a file)
6. Open front-end page in the browser