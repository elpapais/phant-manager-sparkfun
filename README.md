# phant-manager-sparkfun

the fork of ````phant-manager-http```` that is currently hosted at [data.sparkfun.com](http://data.sparkfun.com).

## Setting up a dev environment

    $ node -v
    v0.10.26
    $ npm install -g grunt-cli
    $ git clone git@github.com:sfe-stash/phant-manager-sparkfun.git
    $ cd phant-manager-sparkfun
    $ git remote add upstream git@github.com:sparkfun/phant-manager-http.git
    $ npm install
    $ grunt dev
