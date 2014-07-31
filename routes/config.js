var npmSearch = require('npm-package-search'),
  npm = require('npm'),
  fs = require('fs'),
  mkdirp = require('mkdirp'),
  util = require('util'),
  async = require('async'),
  request = require('request'),
  exphbs = require('express3-handlebars'),
  path = require('path');

var search = npmSearch(
  path.join('/tmp/npm.json'), {
    interval: 3600 * 1000
  }
);

var handlebars = exphbs.create({
  layoutsDir: path.join(__dirname, '..', 'views', 'layouts'),
  partialsDir: path.join(__dirname, '..', 'views', 'partials'),
  defaultLayout: 'config',
  helpers: {
    variableName: function(name) {
      name = name.split('-').map(function(chunk) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      });
    }
  }
}).engine;

var defaults = {
  'phant-input-http': {
    included: 'Phant.HttpInput',
    phantConfig: {
      name: 'HTTP',
      http: true,
      options: [
        {
          "label": "Metadata",
          "name": "metadata",
          "default": "phant-meta-nedb",
          "type": "select",
          "require": "meta",
          "description": "The phant metadata module to use"
        },
        {
          "label": "Keychain",
          "name": "keychain",
          "default": "phant-keychain-hex",
          "type": "select",
          "require": "keychain",
          "description": "The phant keychain module to use"
        }
      ]
    }
  },
  'phant-output-http': {
    included: 'Phant.HttpOutput',
    phantConfig: {
      name: 'HTTP',
      http: true,
      options: [
        {
          "label": "Storage",
          "name": "strorage",
          "default": "phant-stream-csv",
          "type": "select",
          "require": "stream",
          "description": "The phant stream storage module to use"
        },
        {
          "label": "Keychain",
          "name": "keychain",
          "default": "phant-keychain-hex",
          "type": "select",
          "require": "keychain",
          "description": "The phant keychain module to use"
        }
      ]
    }
  },
  'phant-manager-telnet': {
    included: 'Phant.TelnetManager',
    phantConfig: {
      name: 'Telnet',
      options: [
        {
          "label": "Port",
          "name": "port",
          "default": "8081",
          "type": "number",
          "description": "The TCP port to listen on."
        },
        {
          "label": "Metadata",
          "name": "metadata",
          "default": "phant-meta-nedb",
          "type": "select",
          "require": "meta",
          "description": "The phant metadata module to use"
        },
        {
          "label": "Keychain",
          "name": "keychain",
          "default": "phant-keychain-hex",
          "type": "select",
          "require": "keychain",
          "description": "The phant keychain module to use"
        }
      ]
    }
  }
};

npm.load();

exports.make = function(req, res) {

  var get = function(name) {

    return function(cb) {

      request.get('https://registry.npmjs.org/' + name + '/latest', function(err, response, body) {

        if (err) {
          return cb(err);
        }

        cb(null, JSON.parse(body));

      });

    };

  };

  search(/^phant-/, function(err, packages) {

    var info = {};

    packages.forEach(function(p) {
      info[p.name] = get(p.name);
    });

    async.parallel(info, function(err, results) {

      res.render('config', {
        title: 'phant server configurator',
        err: err,
        packages: JSON.stringify(util._extend(defaults,results))
      });

    });

  });

};

exports.check = function(req, res) {

  request.get('https://registry.npmjs.org/phantconfig-' + req.param('name'), function(err, response, body) {
    res.json({exists: response.statusCode === 200});
  });

};

exports.publishPackage = function(req, res) {

  var config = JSON.parse(req.param('config')),
      name = 'phantconfig-' + req.param('name');

  createPackage(name, config, function(err, folder) {

    if(err) {
      return res.json({
        success: false
        message: err
      });
    }

    //npm.publish(folder, function(err) {

      res.json({
        success: (err ? false : true),
        message: (err ? 'Publishing to npm failed.' : ''),
        name: name
      });

    //});

  });

};

exports.downloadPackage = function(req, res) {

  res.render('config', {
    title: 'phant server configurator'
  });

};

function createPackage(name, config, callback) {

  var folder = path.join('/tmp', 'phantconfig', name);

  var files = [
    { tpl: 'index.handlebars', out: 'index.js' },
    { tpl: 'package.handlebars', out: 'package.json' },
    { tpl: 'readme.handlebars', out: 'README.md' }
  ];

  mkdirp(folder, function(err) {

    if(err) {
      return callback('Temp folder creation failed');
    }

    async.each(files, function(file, cb) {

      // render the template
      handlebars(file.tpl, config, function(err, rendered) {

        if(err) {
          return cb('Generating the package failed.');
        }

        // write it to disk
        fs.writeFile(path.join(folder, file.out), rendered, function(err) {

          if(err) {
            return cb('Writing ' + file.out + ' to disk failed');
          }

          cb(null, folder);

        });

      });

    }, callback);

  });

}
