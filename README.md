
### Latest incarnation of **myapp**

this time, with `express`, `mongo`, `react`, `es6`, my custom html router, and `salesforce lightning design system`.

<FormMain
   crud: c|u
   form: def
   value: {record:{}, status}
   parent: defailts of parent record, if a childform (embedded document)
   inModal: if form/buttons needs to be displayed in modal_container


   _formControlState : calculate validity of all current form field data
   _fieldChange: called from the <Field>,  updates the form state.changedata & state.formcontrol
   _save: save the state.changedata to the server
   _delete: delete the record from the server
  
  // inline 
  _manageData: if the button 'Manage Data' button (_data), set state.manageData, open a Modal with <ListMain inline={true}>
  _inlineDataChange: handle onDataChange from <ListMain>
  _inlineDataFinished

   Display the Form
  SectionHeader  buttons=FormButtons
</FormMain>

<ListMain
  inline: if edits allowed inline!, store data in state.inlineData (mutable)

  _ActionDelete: delete row Button
  _ActionEdit: edit row Button, state.editrow (if childform) or nav to RecordPage.

  _inLineEdit:  set state.inline.{editidx & editval}, renders <FormMain inModal={true}>
  _inLinefieldChange: set state.inline
  
  _inLineDelete: 
  _inLineSave: push to state.inline



</ListMain>




---

##### Directory Structure

`server` holds the express server and the API implementation

`app` the core of the app and everything in there can be rendered on the server or the client

`shared` can run on client or server!


---
using jexl

example  : user.apps[.app._id = app._id].appuserdata.mysquad._id

---
mongo HANDLING

db.<Collection>.find(query, projection)
// Use dot '<field.field>' in the query to match the field in the embedded array doc, althou mongo still returns ALL docs in array!! you can use '$' in the projection document when you only need one particular array element in selected documents.

Use '<field.0>' in the query to match only the first element in the array

Use '<field>.$' in the projection  to limit the contents of the <field> array from the query results to contain only the first element matching the query document (one findone usecase)

// following returns just the matched embedded document, but it returns ALL THE FIELDS in the document!
db.app.find ({"_id":ObjectId("5618fbbb4b2b2c6b47d897a4"),"landingpage._id":ObjectId("565b0f7f823653be2fc8ddbb")}, { "landingpage.$": 1}).pretty();


// **LIMIT**, CANNOT use multiple '$' in projection to specify individual fields in the embedded document, ie ({"fields.$.name": 1, "fields.$.desc": 1})
db.COLLECTION.find({_id: ObjectId("XXX"), "fields._id":  ObjectId("XXX")}, {"fields.$": 1})

// aggrigations (command) : only way to bring back selected fields from a single array embedded document
db.collection.aggregate([ { '$match': {_id: ObjectId("XXX"), "fields._id":  ObjectId("XXX")}, { '$project': { 'fields' : { '$map': { 'input': '$fields', 'as': 'field', 'in': { 'name': '$$field.name' }}}}}])


// can use $sclice to paginate embedded docs
db.posts.find( {}, { comments: { $slice: [ 20, 10 ] } } )
only return 10 items, after skipping the first 20 items of that array


---
Notes



---
`transducers.js` (transform and reduce)
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
