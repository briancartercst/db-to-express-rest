var extend = require("extend"),
  join = require("path").join,
  debug = require("debug")("db-to-express-api"),
  rest = require("./rest"),
  validator = require("validator"),
  s = require("sprintf"),
  express = require("express"),
  path = require("path"),
  //placeholder for requireing() nedb if needed.
  nedb = null;

module.exports = dbapi;

function dbapi(collection, options) {
  if (!(this instanceof dbapi)) {
    return new dbapi(collection, options);
  }
  this.db = null;
  this.options = extend({
    dbtype: "nedb"
  }, options);

  if ("nedb" === this.options.dbtype) {
    nedb = require("nedb");
    if (typeof collection === "string") {
      validateCollectionName(collection);
      debug("Creating NeDB database for collection '%s'", collection);
      this.db = getNeDBCollection(collection);
    } else if (collection instanceof nedb) {
      // Guess collection name from nedb filename property.
      this.db = collection;
      collection = path.basename(collection.filename, path.extname(collection.filename));
      debug("Using existing NeDB database as collection '%s'", collection);
    }
  }
  var router = express.Router();
  debug("Attaching API router to /" + collection);
  router.use("/" + collection, rest(collection, this.db));
  return router;
}


function getNeDBCollection(collection, options) {
  var store = require("nedb");
  options = extend({
    filename: join(process.cwd(), "db", collection + ".db"),
    autoload: true
  }, options);
  var collection = new store(options);
  return collection;
}

function validateCollectionName(name) {
  if ("collection" === name) {
    throw new Error("Please do not use 'collection' as a collection name.");
  }
  if (!validator.isAlphanumeric(name)) {
    var e = s("collection name '%s' is not valid. " +
      "Please use an alphanumeric string.", name);
    throw new Error(e);
  }
}