
Directory Structure

server :
    holds the express server and the API implementation
src:
    the core of the app and everything in there can be rendered on the server or the client
static/js:
    folder holds the client-side bootstrapping code

All of the database methods are implemented in the server-side api.js

Both sides pull in the src directory with relative imports, like require('../src/routes').
The components within src each fetch the data they need, but this needs to work on the client and the server



transducers.js (transform and reduce)
work with any data structure (arrays, objects, iterators, immutable data structures)

seq(coll, xform) — A generalized method that will return the same data type that was passed in as coll, with xform applied. You will usually use this unless you know you want an array, object, or iterator
into(to, xform, from) — Apply xform to each item in from and append it to to. This has the effect of "pouring" elements into to
toArray(coll, xform?) — Turn coll into an array, applying the transformation xform to each item if provided
toObj(coll, xform?) — Turn coll into an object if possible, applying the transformation xform
toIter(coll, xform?) — Make an iterator over coll, and apply the transformation xform to each value if specified

Transformations
map(coll?, f, ctx?) — call f on each item
filter(coll?, f, ctx?) — only include the items where the result of calling f with the item is truthy
remove(coll?, f, ctx?) — only include the items where the result of calling f with the item is falsy
keep(coll?) — remove all items that are null or undefined
takeWhile(coll?, f, ctx?) — grab only the first items where the result of calling f with the item is truthy
dedupe(coll?) — remove consecutive duplicates (equality compared with ===)

compose is a provided function simply use it to build up transformations
var transform = compose(
  map(x => x + 1),
  filter(x => x % 2 === 0),
  take(2)
);


 utility functions:
 merge(obj, value) — Merge value into obj. value can be another object or a two-element array of [key, value]
 push(arr, value) — Push value onto arr and return arr
