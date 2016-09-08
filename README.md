STARTUP SEQUENCE
--
1. Load NPM modules needed: do "npm i" in all directories
2. Start backend: backend/index.js. Make sure that it has executable bit set. If you are running it on a remote machine, you will have to update the value of "Access-Control-Allow-Origin" headers inside the code manually.
3. Launch Redis. If you use a Redis server working on another host or non-default port number, you can set the host name and port number as command line argument for mid-end as documented in the mid-end's ./index.js --help output
4. Start mid-end: midend/index.js. Make sure that it has executable bit set. If you are running it on a remote machine, you will have to update the value of "Access-Control-Allow-Origin" headers inside the code manually.
5. Set up an http server for front-end (Important: browsers will not send XHR if the page is loaded from a local computer as a file)
6. Open front-end page in the browser

DESIGN CONSIDERATIONS
--
1. Normally, a cookie based auth is greatly discouraged for an "APIsed" program, but there was no trivial way to pass it on through inside a multipart form data without buffering the whole request and reducing server's responsiveness considerably
2. All XHR CORS nastiness with manual header editing comes out of the aforementioned
3. Since I had less than a day to fix a prettier version of the front-end that I mistakenly overwrote a day earlier, I simply based everything on the original React's "hello world" sample and went without code packaging. __The in-browser JSX compilation is used for the same reason. jQuery was used for ajax handling as the only React compatible ajax libs are not broweser ready (require compilation/packaging)__
4. Since both sqlite and redis modules forces use of their asynchronous api, it would've been better to use something like a sunchronous OOP wrapper around them. There is no merit in using asynchronous code within asynchronous request handler function as we can't give response earlier than we get/process data to and from databases