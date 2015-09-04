/**
 * Created by keith on 17/10/14.
 */

var ObjectID = require('mongodb').ObjectID;

module.exports = function(options) {

    var db = options.db;
    var exps = {
        forms: {
            "formMetadata" : new ObjectID('000000000100'),
            "FormFieldMetadata": new ObjectID('000000000200'),
            "metaSearch": new ObjectID('000000000400'),
            "Users": new ObjectID('000000000600'),
            "AuthProviders": new ObjectID('000000000700'),
            "FileMeta": new ObjectID('000000000800'),
            "UserApps": new ObjectID('000000000900'),
            "App": new ObjectID('000000000a00'),
            "AppMeta": new ObjectID('000000000b00'),
            "ImportMeta": new ObjectID('000000000c00')
        }
    };

    var FORMMETA = [
        {
            _id: exps.forms.formMetadata,
            name: "FormMetadata",
            collection: "formmeta",
            type: "top",
            layout: "1col",
            icon: "page-edit",
            fields: [

                {
                    name: "name",
                    show_when: "true",
                    title: "Form Name",
                    type: "text",
                    placeholder: "",
                    required: true
                },
                {
                    name: "type",
                    title: "Form Type",
                    show_when: "true",
                    type: "dropdown",
                    required: true,
                    default_value: "top",
                    dropdown_options: [
                        {
                            name: "Top Level Form",
                            value: "top"
                        },
                        {
                            name: "Child Form (embedded document)",
                            value: "childform"
                        },
                        {
                            name: "Search Form (fields returned in a search)",
                            value: "search"
                        }
                    ]
                },
                {
                    name: "icon",
                    show_when: "true",
                    title: "Form Icon",
                    type: "text",
                    placeholder: "Checkout http://zurb.com/playground/foundation-icon-fonts-3",
                    required: false
                },
                {
                    name: "collection",
                    show_when: "record['type'] == 'top'",
                    title: "Mongo Collection name",
                    type: "text",
                    placeholder: "No Spaces please!",
                    required: false
                },

                {
                    name: "layout",
                    title: "Form Layout",
                    type: "dropdown",
                    show_when: "true",
                    required: true,
                    default_value: "1col",
                    dropdown_options: [
                        {
                            name: "1 Column",
                            value: "1col"
                        }
                    ]
                },
                {
                    name: "fields",
                    title: "Form Feilds",
                    show_when: "true",
                    type: "childform",
                    layout: "list",
                    child_form: exps.forms.FormFieldMetadata,
                    _id: new ObjectID('000000000106')
                }
            ]
        },
        {
            _id: exps.forms.FormFieldMetadata,
            name: "FormFieldMetadata",
            type: "childform",
            fields: [
                {
                    name: "title",
                    title: "Field Title",
                    show_when: "true",
                    type: "text",
                    placeholder: "Field Label",
                    required: true
                },
                {
                    name: "name",
                    title: "Field Name",
                    show_when: "true",
                    type: "text",
                    placeholder: "No Spaces please",
                    required: true
                },
                {
                    name: "type",
                    title: "Field Type",
                    show_when: "true",
                    type: "dropdown",
                    required: true,
                    default_value: "text",
                    dropdown_options: [
                        {
                            name: "Text",
                            value: "text"
                        },
                        {
                            name: "Picture",
                            value: "image"
                        },
                        {
                            name: "Email",
                            value: "email"
                        },
                        {
                            name: "ChildForm",
                            value: "childform"
                        },
                        {
                            name: "Lookup",
                            value: "lookup"
                        },
                        {
                            name: "Textarea",
                            value: "textarea"
                        },
                        {
                            name: "Dropdown",
                            value: "dropdown"
                        },
                    ]
                },
                {
                    name: "default_value",
                    title: "Default Value",
                    show_when: "true",
                    type: "text",
                    placeholder: "Default Value",
                    required: false
                },
                {
                    name: "placeholder",
                    title: "Placeholder Value",
                    show_when: "record['type'] == 'list'",
                    type: "text",
                    required: false
                },
                {
                    name: "show_when",
                    title: "Show When ( ie: record['type'] == 'list')",
                    show_when: "true",
                    type: "text",
                    default_value: "true",
                    required: false
                },
                {
                    name: "createnew_form",
                    title: "Lookup Create form",
                    type: "lookup",
                    placeholder: "only for lookup fields",
                    show_when: "record['type'] == 'lookup'",
                    createnew_form: exps.forms.formMetadata,
                    createnew_defaults: '{"primary": "name", "others": {}}',
                    search_form: exps.forms.metaSearch,
                    required: false,
                    _id: new ObjectID('000000000207'),
                },
                {
                    name: "createnew_defaults",
                    title: "Lookup Create New Defaults",
                    type: "text",
                    show_when: "record['type'] == 'lookup'",
                    placeholder: "{primary: 'name', others: {fieldname: 'val', fieldname: 'val'}}",
                    required: false
                },
                {
                    name: "search_form",
                    title: "Lookup Search Form",
                    type: "lookup",
                    placeholder: "only for lookup fields",
                    show_when: "record['type'] == 'lookup'",
                    createnew_form: exps.forms.formMetadata,
                    createnew_defaults: '{"primary": "name", "others": {}}',
                    search_form: exps.forms.metaSearch,
                    required: false,
                    _id: new ObjectID('000000000209'),
                },
                {
                    name: "child_form",
                    title: "Child Form",
                    type: "lookup",
                    show_when: "record['type'] == 'childform'",
                    createnew_form: exps.forms.formMetadata,
                    createnew_defaults: '{"primary": "name", "others": { "type": "childform"}}',
                    search_form: exps.forms.metaSearch,
                    required: false,
                    _id: new ObjectID('000000000210'),
                },
                {
                    name: "layout",
                    title: "Childform Layout",
                    type: "dropdown",
                    show_when: "record['type'] == 'childform'",
                    required: false,
                    default_value: "1col",
                    dropdown_options: [
                        {
                            name: "View",
                            value: "view"
                        },
                        {
                            name: "List",
                            value: "list"
                        }
                    ]
                },
                {
                    name: "required",
                    title: "Required?",
                    type: "dropdown",
                    required: false,
                    default_value: false,
                    dropdown_options: [
                        {
                            name: "Yes",
                            value: true
                        },
                        {
                            name: "No",
                            value: false
                        }
                    ]
                },
                {
                    name: "dropdown_options",
                    title: "Dropdown Options",
                    show_when: "record['type'] == 'dropdown'",
                    type: "dropdown_options"
                }
            ]
        },
        {
            _id: exps.forms.metaSearch,
            name: "metaSearch",
            type: "search",
            collection: "formmeta",
            fields: [
                {
                    name: "name",
                    title: "Name"
                }
            ]
        },
        {
            _id: exps.forms.Users,
            name: "Users",
            collection: "user",
            type: "top",
            layout: "1col",
            icon: "torsos-all",
            fields: [

                {
                    name: "name",
                    show_when: "true",
                    title: "Full Name",
                    type: "text",
                    placeholder: "",
                    required: true
                },
                {
                    name: "role",
                    title: "Role",
                    show_when: "true",
                    type: "dropdown",
                    required: true,
                    default_value: "user",
                    dropdown_options: [
                        {
                            name: "New",
                            value: "new"
                        },
                        {
                            name: "User",
                            value: "user"
                        },
                        {
                            name: "Team Manager",
                            value: "manager"
                        },
                        {
                            name: "Admin",
                            value: "admin"
                        }
                    ]
                },
                {
                    name: "email",
                    show_when: "true",
                    title: "Email",
                    type: "email",
                    placeholder: "",
                    required: true
                },
                {
                    name: "picture",
                    title: "Picture",
                    show_when: "true",
                    type: "image",
                    required: false
                },
                {
                    name: "provider",
                    title: "Auth Providers",
                    show_when: "true",
                    type: "childform",
                    child_form: exps.forms.AuthProviders,
                    _id: new ObjectID('000000000604')
                },
                {
                    name: "apps",
                    title: "Apps",
                    type: "childform",
                    createnew_form: exps.forms.UserApps,
                    child_form: exps.forms.UserApps,
                    _id: new ObjectID('000000000601'),
                }
            ]
        },
        {
            _id: exps.forms.AuthProviders,
            name: "AuthProviders",
            type: "childform",
            fields: [

                {
                    name: "type",
                    title: "Auth Provider Type",
                    show_when: "true",
                    type: "dropdown",
                    required: true,
                    dropdown_options: [
                        {
                            name: "Facebook",
                            value: "facebook"
                        },
                        {
                            name: "Internal Password",
                            value: "password"
                        },
                        {
                            name: "Chatter",
                            value: "chatter"
                        }
                    ]
                },
                {
                    name: "provider_id",
                    title: "Provider Id",
                    show_when: "true",
                    type: "text",
                    placeholder: "Field Label",
                    required: true
                },
                {
                    name: "password",
                    title: "Password",
                    show_when: "true",
                    type: "text",
                    placeholder: "password",
                    required: true
                }
            ]
        },
        {
            _id: exps.forms.UserApps,
            name: "User Apps",
            type: "childform",
            fields: [
              {
                  name: "app",
                  title: "App",
                  type: "lookup",
                  search_form: exps.forms.App,
                  required: true,
                  _id: new ObjectID('000000000901')
              }
            ]
        },
        {
            _id: exps.forms.App,
            name: "App",
            collection: "app",
            type: "top",
            layout: "1col",
            icon: "page-edit",
            fields: [

                {
                    name: "name",
                    show_when: "true",
                    title: "App Name",
                    type: "text",
                    placeholder: "",
                    required: true
                },
                {
                    name: "type",
                    title: "Form Type",
                    show_when: "true",
                    type: "dropdown",
                    required: true,
                    default_value: "top",
                    dropdown_options: [
                        {
                            name: "Deployed",
                            value: "deployed"
                        },
                        {
                            name: "Sandbox",
                            value: "sandbox"
                        }
                    ]
                },
                {
                    name: "icon",
                    show_when: "true",
                    title: "Form Icon",
                    type: "text",
                    placeholder: "Checkout http://zurb.com/playground/foundation-icon-fonts-3",
                    required: false
                },
                {
                    name: "appmeta",
                    title: "App Forms",
                    show_when: "true",
                    type: "childform",
                    layout: "list",
                    child_form: exps.forms.AppMeta,
                    _id: new ObjectID('000000000a01')
                }
            ]
        },
        {
            _id: exps.forms.AppMeta,
            name: "App Meta",
            type: "childform",
            fields: [
              {
                  name: "form",
                  title: "Form",
                  type: "lookup",
                  search_form: exps.forms.metaSearch,
                  required: true,
                  _id: new ObjectID('000000000b01'),
              },
              {
                  name: "crud",
                  title: "CRUD",
                  show_when: "true",
                  type: "dropdown",
                  required: true,
                  default_value: "text",
                  dropdown_options: [
                      {
                          name: "-R--",
                          value: "r"
                      },
                      {
                          name: "CR--",
                          value: "cr"
                      },
                      {
                          name: "CRU-",
                          value: "cru"
                      },
                      {
                          name: "CRUD",
                          value: "crud"
                      }
                    ]
                }
            ]
        },
        {
            _id: exps.forms.ImportMeta,
            name: "ImportMeta",
            type: "top",
            fields: [

                {
                    name: "meta",
                    title: "Unique Filename",
                    show_when: "true",
                    type: "textarea"
                }
            ]
        },
        {
            _id: exps.forms.FileMeta,
            name: "FileMeta",
            type: "fileform",
            fields: [

                {
                    name: "filename",
                    title: "Unique Filename",
                    show_when: "true",
                    type: "text"
                },
                {
                    name: "length",
                    title: "size (bytes)",
                    show_when: "true",
                    type: "text"
                },
                {
                    name: "uploadDate",
                    title: "Upload Date",
                    show_when: "true",
                    type: "text"
                },
                {
                    name: "ownerId",
                    title: "Owner",
                    show_when: "true",
                    type: "text"
                }
            ]
        }
    ];

    exps.data =
       [
          {
            form: exps.forms.AppMeta,
            load: [
              {name: "Admin App", type: "deployed", appmeta: [
                {form: exps.forms.formMetadata, crud: "crud"},
                {form: exps.forms.FormFieldMetadata, crud: "crud"},
                {form: exps.forms.metaSearch, crud: "crud"},
                {form: exps.forms.Users, crud: "crud"},
                {form: exps.forms.AuthProviders, crud: "crud"},
                {form: exps.forms.UserApps, crud: "crud"},
                {form: exps.forms.App, crud: "crud"},
                {form: exps.forms.AppMeta, crud: "crud"},
                {form: exps.forms.ImportMeta, crud: "crud"}
                ]}
            ]
          }
      ];

    exps.getFormMeta = function (success, error) {
        db.collection('formmeta').find({}).toArray(function (err, docs) {
            if (err) {
                console.log('err ' + err);
                error(err);
            } else {
                var defs = FORMMETA.concat(docs);
                //console.log('getFormMeta: got ALL form meta data ' + JSON.stringify(defs));
                success(defs);
            }
        });
    }

    exps.findFormById = function (meta, name) {
        try {
          var oname = new ObjectID(name);
          //console.log ('findFormById() searching for: "' + oname +'"');
          for (var i = 0, len = meta.length; i < len; i += 1) {
              //console.log('findFormById() got the id: ' + meta[i].name + ' : "' + meta[i]._id + '"');
              if (meta[i]._id.equals(oname)) {
                  //console.log ('findFormById() returning : ' + meta[i].name);
                  return meta[i];
              }
          }
        } catch (e) {
          console.log('findFormById() err ' + JSON.stringify(e));
        }
        return;
    }

    exps.findFieldById = function (meta, name) {
      try {
        var oname = new ObjectID(name);
        //console.log ('findFieldById() searching for: "' + oname +'"');
        for (var i = 0, ilen = meta.length; i < ilen; i += 1) {
            var flds = meta[i].fields;
            //console.log('findFieldById() checking the form   : ' + meta[i].name + '"');
            for (var j = 0, jlen = flds.length; j < jlen; j += 1) {
                //console.log('findFieldById() got the field : ' + flds[j].name + ' "' + flds[j]._id + '"');
                if (flds[j]._id) {
                    if (flds[j]._id.equals(oname)) {
                        //console.log('findFieldById() returning : ' + meta[i].name + ' "' + flds[j].name + '"');
                        return {form: meta[i], field: flds[j]};
                    }
                }
            }
        }
      } catch (e) {
        console.log('findFieldById() err ' + JSON.stringify(e));
      }
        return;
    }

    return exps;
}
