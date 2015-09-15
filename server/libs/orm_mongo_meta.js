"use strict"
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
            "DropDownOption": new ObjectID('000000000210'),
            "iconSearch": new ObjectID('000000000300'),
            "metaSearch": new ObjectID('000000000400'),
            "Users": new ObjectID('000000000600'),
            "AuthProviders": new ObjectID('000000000700'),
            "FileMeta": new ObjectID('000000000800'),
            "UserApps": new ObjectID('000000000900'),
            "App": new ObjectID('000000000a00'),
            "AppSearch": new ObjectID('000000000a10'),
            "AppPerms": new ObjectID('000000000b00'),
            "AppPageComponent": new ObjectID('000000000e00'),
            "ImportMeta": new ObjectID('000000000c00'),
            "ImportMetaData": new ObjectID('000000000d00')
        }
    };

    exps.ICONS = [
      {key: "1", name: "Standard Account", icon: {type: "standard", name: "account"}},
      {key: "2", name: "Endorsment", icon: {type: "standard", name: "endorsement"}},
      {key: "3", name: "Coaching", icon: {type: "standard", name: "coaching"}},
      {key: "4", name: "Thanks", icon: {type: "standard", name: "thanks"}},
      {key: "5", name: "Calendar", icon: {type: "standard", name: "today"}},
      {key: "6", name: "Report", icon: {type: "standard", name: "report"}}
    ]

    exps.FORMMETA = [
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
                            key: "top"
                        },
                        {
                            name: "Child Form (embedded document)",
                            key: "childform"
                        },
                        {
                            name: "Search Form (fields returned in a search)",
                            key: "search"
                        }
                    ]
                },
                {
                    name: "icon",
                    show_when: "true",
                    title: "Form Icon",
                    type: "reference",
                    required: false,
                    search_form: exps.forms.iconSearch

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
                            key: "1col"
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
                            key: "text"
                        },
                        {
                            name: "Picture",
                            key: "image"
                        },
                        {
                            name: "Email",
                            key: "email"
                        },
                        {
                            name: "ChildForm",
                            key: "childform"
                        },
                        {
                            name: "Reference",
                            key: "reference"
                        },
                        {
                            name: "Textarea",
                            key: "textarea"
                        },
                        {
                            name: "Dropdown",
                            key: "dropdown"
                        },
                        {
                            name: "DateTime",
                            key: "datetime"
                        }
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
                    type: "reference",
                    placeholder: "only for lookup fields",
                    show_when: "record['type'] == 'reference'",
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
                    show_when: "record['type'] == 'reference'",
                    placeholder: "{primary: 'name', others: {fieldname: 'val', fieldname: 'val'}}",
                    required: false
                },
                {
                    name: "search_form",
                    title: "Lookup Search Form",
                    type: "reference",
                    placeholder: "only for lookup fields",
                    show_when: "record['type'] == 'reference'",
                    createnew_form: exps.forms.formMetadata,
                    createnew_defaults: '{"primary": "name", "others": {}}',
                    search_form: exps.forms.metaSearch,
                    required: false,
                    _id: new ObjectID('000000000209'),
                },
                {
                    name: "child_form",
                    title: "Child Form",
                    type: "reference",
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
                            key: "view"
                        },
                        {
                            name: "List",
                            key: "list"
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
                            key: true
                        },
                        {
                            name: "No",
                            key: false
                        }
                    ]
                },
                {
                    name: "dropdown_options",
                    title: "Dropdown Options",
                    show_when: "record['type'] == 'dropdown'",
                    type: "dropdown_options",
                    child_form: exps.forms.DropDownOption,
                }
            ]
        },
        {
            _id: exps.forms.DropDownOption,
            name: "DropDown Option",
            type: "childform",
            fields: [
                {
                    name: "name",
                    title: "Name",
                    type: "text"
                },
                {
                    name: "key",
                    title: "key",
                    type: "text",
                }
            ]
        },
        {
            _id: exps.forms.iconSearch,
            name: "iconSearch",
            type: "metadata",
            data: exps.ICONS,
            fields: [
              {
                  name: "icon",
                  title: "Icon",
                  type: "icon",
              },
              {
                  name: "name",
                  title: "Name",
                  type: "text",
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
                    title: "Name",
                    type: "text",
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
                            key: "new"
                        },
                        {
                            name: "User",
                            key: "user"
                        },
                        {
                            name: "Team Manager",
                            key: "manager"
                        },
                        {
                            name: "Admin",
                            key: "admin"
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
                            key: "facebook"
                        },
                        {
                            name: "Internal Password",
                            key: "password"
                        },
                        {
                            name: "Chatter",
                            key: "chatter"
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
                  type: "reference",
                  createnew_form: exps.forms.App,
                  search_form: exps.forms.AppSearch,
                  required: true,
                  _id: new ObjectID('000000000901')
              }
            ]
        },
        {
            _id: exps.forms.AppSearch,
            name: "AppSearch",
            collection: "app",
            type: "search",
            fields: [
                {
                    name: "name",
                    title: "App Name",
                    type: "text"
                },
                {
                    name: "icon",
                    title: "Form Icon",
                    type: "text"
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
                            key: "deployed"
                        },
                        {
                            name: "Sandbox",
                            key: "sandbox"
                        }
                    ]
                },
                {
                    name: "icon",
                    show_when: "true",
                    title: "Form Icon",
                    type: "text",
                    required: false
                },
                {
                    name: "appperms",
                    title: "App Forms",
                    show_when: "true",
                    type: "childform",
                    layout: "list",
                    child_form: exps.forms.AppPerms,
                    _id: new ObjectID('000000000a01')
                },
                {
                    name: "landingpage",
                    title: "Landing Page",
                    type: "childform",
                    createnew_form: exps.forms.AppPageComponent,
                    child_form: exps.forms.AppPageComponent,
                    _id: new ObjectID('000000000a02'),
                }
            ]
        },
        {
            _id: exps.forms.AppPageComponent,
            name: "App Page Component",
            type: "childform",
            fields: [
              {
                  name: "title",
                  title: "Title",
                  type: "text",
                  required: true
              },
              {
                  name: "size",
                  title: "Form",
                  type: "reference",
                  search_form: exps.forms.metaSearch,
                  required: true,
                  _id: new ObjectID('000000000e01'),
              },
              {
                  name: "view",
                  title: "View",
                  show_when: "true",
                  type: "dropdown",
                  required: true,
                  dropdown_options: [
                      {
                          name: "Tile view",
                          key: "TileMain"
                      },
                      {
                          name: "List view",
                          key: "ListMain"
                      },
                      {
                          name: "Record view",
                          key: "FormMain"
                      },
                      {
                          name: "Graph",
                          key: "graph"
                      },
                      {
                          name: "TimeLine",
                          key: "TimeLine"
                      }
                    ]
                },
                {
                    name: "filter",
                    title: "Data Filter",
                    show_when: "true",
                    type: "dropdown",
                    required: true,
                    dropdown_options: [
                        {
                            name: "Filter Clause",
                            key: "filter"
                        },
                        {
                            name: "Top X",
                            key: "topx"
                        },
                        {
                            name: "Other Page Component",
                            key: "page"
                        },
                        {
                            name: "xxx",
                            key: "xxx"
                        }
                      ]
                  }
            ]
        },
        {
            _id: exps.forms.AppPerms,
            name: "App Meta",
            type: "childform",
            fields: [
              {
                  name: "form",
                  title: "Form",
                  type: "reference",
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
                          key: "r"
                      },
                      {
                          name: "CR--",
                          key: "cr"
                      },
                      {
                          name: "CRU-",
                          key: "cru"
                      },
                      {
                          name: "CRUD",
                          key: "crud"
                      }
                    ]
                }
            ]
        },
        {
            _id: exps.forms.ImportMeta,
            name: "ImportMeta",
            type: "top",
            url: "/dform/defaultData",
            action: "import",
            fields: [
                {
                    name: "name",
                    title: "App Name",
                    show_when: "true",
                    type: "text"
                },
                {
                    name: "metadata",
                    title: "App Meta Data",
                    show_when: "true",
                    type: "childform",
                    layout: "list",
                    child_form: exps.forms.ImportMetaData,
                    _id: new ObjectID('000000000d01')
                }
            ]
        },
        {
            _id: exps.forms.ImportMetaData,
            name: "FormFieldMetadata",
            type: "childform",
            fields: [
                {
                    name: "form",
                    title: "Form",
                    type: "reference",
                    search_form: exps.forms.formMetadata
                },
                {
                    name: "load",
                    title: "Meta",
                    type: "jsonarea"
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

    exps.defaultData =   [
      {
        _id: "LoadApp001",
        name: "Admin App",
        metadata: [
          {
            form: {_id: exps.forms.App, search_ref: {name: "App"}},
            load: [
              {name: "Admin App", type: "deployed", appperms: [
                {form: {_id: exps.forms.formMetadata}, crud: "crud"},
                {form: {_id: exps.forms.FormFieldMetadata}, crud: "crud"},
                {form: {_id: exps.forms.DropDownOption}, crud: "crud"},
                {form: {_id: exps.forms.metaSearch}, crud: "crud"},
                {form: {_id: exps.forms.Users}, crud: "crud"},
                {form: {_id: exps.forms.AuthProviders}, crud: "crud"},
                {form: {_id: exps.forms.UserApps}, crud: "crud"},
                {form: {_id: exps.forms.App}, crud: "crud"},
                {form: {_id: exps.forms.AppSearch}, crud: "crud"},
                {form: {_id: exps.forms.AppPerms}, crud: "crud"},
                {form: {_id: exps.forms.AppPageComponent}, crud: "crud"},
                {form: {_id: exps.forms.ImportMeta}, crud: "crud"},
                {form: {_id: exps.forms.ImportMetaData}, crud: "crud"}
                ]}
            ]
          }
        ]
      }
    ];

    exps.adminMetabyId = function() {
      let res = {};

      for (let v of exps.FORMMETA) {
        res[v._id.toString()] = v;
      }
      return res;
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
        console.log ('findFieldById() searching for: "' + oname +'"');
        for (let form of meta) {
          //var flds = meta[i].fields;
          console.log('findFieldById() checking the form: ' + form.name);
          if (form.fields) for (let fld of form.fields) {
            console.log('findFieldById() got the field : ' + fld.name + ' "' + fld._id + '"');
            if (fld._id && fld._id.equals(oname)) {
              console.log("findFieldById() found it");
              return {form: form, field: fld};
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
