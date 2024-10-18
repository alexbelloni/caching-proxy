# Caching Proxy
Build a caching server that caches responses from other servers.

## Steps
* Initialize a new Node.js project:   
``` npm init -y ```
* Install the necessary dependencies:  
``` npm install http-proxy commander node-cache ```

## Running
```node index.js --port 3000 --origin http://dummyjson.com```

``` node index.js --clear-cache```

## Project 
The roadmap.sh project is [here](https://roadmap.sh/projects/caching-server)
  
## Dependencies
Caching: The node-cache package provides a simple in-memory cache for storing responses.  
Proxying: The http-proxy package forwards requests to the specified origin server.    
Commanding: The commander is a complete solution for node.js command-line interfaces.

## Next Steps
* error handling and logging

