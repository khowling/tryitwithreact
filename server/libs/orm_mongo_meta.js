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
            "ComponentMetadata" : new ObjectID('000000000150'),
            "FormFieldMetadata": new ObjectID('000000000200'),
            "DropDownOption": new ObjectID('000000000250'),
            "iconSearch": new ObjectID('000000000300'),
            "metaSearch": new ObjectID('000000000400'),
            "Users": new ObjectID('000000000600'),
            "UserSearch": new ObjectID('000000000650'),
            "AuthProviders": new ObjectID('000000000700'),
            "FileMeta": new ObjectID('000000000800'),
            "UserApps": new ObjectID('000000000900'),
            "App": new ObjectID('000000000a00'),
            "AppSearch": new ObjectID('000000000a50'),
            "AppPerms": new ObjectID('000000000b00'),
            "AppPageComponent": new ObjectID('000000000e00'),
            "ImportMeta": new ObjectID('000000000c00'),
            "ImportMetaData": new ObjectID('000000000d00')
        }
    };

    exps.ICONS = [
      {_id: "std1", name: "account", icon: {type: "standard", name: "account"}},
{_id: "std2", name: "announcement", icon: {type: "standard", name: "announcement"}},
{_id: "std3", name: "answer_best", icon: {type: "standard", name: "answer_best"}},
{_id: "std4", name: "answer_private", icon: {type: "standard", name: "answer_private"}},
{_id: "std5", name: "answer_public", icon: {type: "standard", name: "answer_public"}},
{_id: "std6", name: "approval", icon: {type: "standard", name: "approval"}},
{_id: "std7", name: "apps_admin", icon: {type: "standard", name: "apps_admin"}},
{_id: "std8", name: "apps", icon: {type: "standard", name: "apps"}},
{_id: "std9", name: "article", icon: {type: "standard", name: "article"}},
{_id: "std11", name: "avatar", icon: {type: "standard", name: "avatar"}},
{_id: "std12", name: "calibration", icon: {type: "standard", name: "calibration"}},
{_id: "std13", name: "call_history", icon: {type: "standard", name: "call_history"}},
{_id: "std14", name: "call", icon: {type: "standard", name: "call"}},
{_id: "std15", name: "campaign_members", icon: {type: "standard", name: "campaign_members"}},
{_id: "std16", name: "campaign", icon: {type: "standard", name: "campaign"}},
{_id: "std17", name: "canvas", icon: {type: "standard", name: "canvas"}},
{_id: "std18", name: "case_change_status", icon: {type: "standard", name: "case_change_status"}},
{_id: "std19", name: "case_comment", icon: {type: "standard", name: "case_comment"}},
{_id: "std20", name: "case_email", icon: {type: "standard", name: "case_email"}},
{_id: "std21", name: "case_log_a_call", icon: {type: "standard", name: "case_log_a_call"}},
{_id: "std22", name: "case_transcript", icon: {type: "standard", name: "case_transcript"}},
{_id: "std23", name: "case", icon: {type: "standard", name: "case"}},
{_id: "std24", name: "coaching", icon: {type: "standard", name: "coaching"}},
{_id: "std25", name: "connected_apps", icon: {type: "standard", name: "connected_apps"}},
{_id: "std26", name: "contact", icon: {type: "standard", name: "contact"}},
{_id: "std27", name: "contract", icon: {type: "standard", name: "contract"}},
{_id: "std28", name: "custom", icon: {type: "standard", name: "custom"}},
{_id: "std29", name: "dashboard", icon: {type: "standard", name: "dashboard"}},
{_id: "std30", name: "default", icon: {type: "standard", name: "default"}},
{_id: "std31", name: "document", icon: {type: "standard", name: "document"}},
{_id: "std32", name: "drafts", icon: {type: "standard", name: "drafts"}},
{_id: "std33", name: "email_chatter", icon: {type: "standard", name: "email_chatter"}},
{_id: "std34", name: "email", icon: {type: "standard", name: "email"}},
{_id: "std35", name: "empty", icon: {type: "standard", name: "empty"}},
{_id: "std36", name: "endorsement", icon: {type: "standard", name: "endorsement"}},
{_id: "std37", name: "event", icon: {type: "standard", name: "event"}},
{_id: "std38", name: "feed", icon: {type: "standard", name: "feed"}},
{_id: "std39", name: "feedback", icon: {type: "standard", name: "feedback"}},
{_id: "std40", name: "file", icon: {type: "standard", name: "file"}},
{_id: "std41", name: "flow", icon: {type: "standard", name: "flow"}},
{_id: "std43", name: "goals", icon: {type: "standard", name: "goals"}},
{_id: "std45", name: "groups", icon: {type: "standard", name: "groups"}},
{_id: "std46", name: "home", icon: {type: "standard", name: "home"}},
{_id: "std47", name: "insights", icon: {type: "standard", name: "insights"}},
{_id: "std48", name: "lead", icon: {type: "standard", name: "lead"}},
{_id: "std49", name: "link", icon: {type: "standard", name: "link"}},
{_id: "std50", name: "log_a_call", icon: {type: "standard", name: "log_a_call"}},
{_id: "std51", name: "marketing_actions", icon: {type: "standard", name: "marketing_actions"}},
{_id: "std52", name: "marketing_resources", icon: {type: "standard", name: "marketing_resources"}},
{_id: "std53", name: "metrics", icon: {type: "standard", name: "metrics"}},
{_id: "std54", name: "news", icon: {type: "standard", name: "news"}},
{_id: "std55", name: "note", icon: {type: "standard", name: "note"}},
{_id: "std56", name: "opportunity", icon: {type: "standard", name: "opportunity"}},
{_id: "std57", name: "orders", icon: {type: "standard", name: "orders"}},
{_id: "std58", name: "people", icon: {type: "standard", name: "people"}},
{_id: "std59", name: "performance", icon: {type: "standard", name: "performance"}},
{_id: "std60", name: "photo", icon: {type: "standard", name: "photo"}},
{_id: "std61", name: "poll", icon: {type: "standard", name: "poll"}},
{_id: "std62", name: "portal", icon: {type: "standard", name: "portal"}},
{_id: "std63", name: "post", icon: {type: "standard", name: "post"}},
{_id: "std64", name: "pricebook", icon: {type: "standard", name: "pricebook"}},
{_id: "std65", name: "process", icon: {type: "standard", name: "process"}},
{_id: "std66", name: "product", icon: {type: "standard", name: "product"}},
{_id: "std67", name: "question_best", icon: {type: "standard", name: "question_best"}},
{_id: "std68", name: "question_feed", icon: {type: "standard", name: "question_feed"}},
{_id: "std69", name: "quotes", icon: {type: "standard", name: "quotes"}},
{_id: "std70", name: "recent", icon: {type: "standard", name: "recent"}},
{_id: "std71", name: "record", icon: {type: "standard", name: "record"}},
{_id: "std72", name: "related_list", icon: {type: "standard", name: "related_list"}},
{_id: "std73", name: "report", icon: {type: "standard", name: "report"}},
{_id: "std74", name: "reward", icon: {type: "standard", name: "reward"}},
{_id: "std75", name: "scan_card", icon: {type: "standard", name: "scan_card"}},
{_id: "std76", name: "skill_entity", icon: {type: "standard", name: "skill_entity"}},
{_id: "std77", name: "social", icon: {type: "standard", name: "social"}},
{_id: "std78", name: "solution", icon: {type: "standard", name: "solution"}},
{_id: "std79", name: "sossession", icon: {type: "standard", name: "sossession"}},
{_id: "std80", name: "task", icon: {type: "standard", name: "task"}},
{_id: "std81", name: "task2", icon: {type: "standard", name: "task2"}},
{_id: "std82", name: "team_member", icon: {type: "standard", name: "team_member"}},
{_id: "std84", name: "thanks", icon: {type: "standard", name: "thanks"}},
{_id: "std85", name: "today", icon: {type: "standard", name: "today"}},
{_id: "std86", name: "topic", icon: {type: "standard", name: "topic"}},
{_id: "std87", name: "unmatched", icon: {type: "standard", name: "unmatched"}},
{_id: "std88", name: "user", icon: {type: "standard", name: "user"}}

    ]

    exps.Compoments = [
      {
        _id: "RecordPage",
        name: "RecordPage",
        desc: "View Records",
        props: [
          {
              name: "form",
              title: "Data Form",
              type: "reference",
              search_form: { _id: exps.forms.metaSearch}
          },
          {
              name: "xid",
              title: "Record Expression",
              type: "formula",
              placeholder: ""
          },
          {
              name: "e",
              title: "Edit",
              type: "boolean"
          }
        ]
      },
      {
        _id: "ListPage",
        name: "ListPage",
        desc: "List of records in a table",
        props: [
          {
              name: "form",
              title: "Data Form",
              type: "reference",
              search_form: { _id: exps.forms.metaSearch}
          },
          {
              name: "query",
              title: "Query",
              type: "text",
              placeholder: ""
          }
        ]
      },
      {
        _id: "AdminTileList",
        name: "Admin TileList",
        desc: "Admin Tiles",
        props: [
          {
              name: "formids",
              title: "form Ids",
              type: "jsonarea"
          }
        ]
      }
    ];

    exps.FORMMETA = [
        {
            _id: exps.forms.formMetadata,
            name: "Form Metadata",
            desc: "This is where you define and extend your application forms",
            collection: "formmeta",
            store: "mongo",
            layout: "1col",
            icon: {_id:"std28"},
            fields: [

                {
                    name: "name",
                    title: "Form Name",
                    type: "text",
                    placeholder: "",
                    required: true
                },
                {
                    name: "desc",
                    title: "Form Description",
                    type: "textarea",
                    placeholder: "Coplete Form Description",
                    required: false
                },
                {
                    name: "store",
                    title: "Storage Type",
                    type: "dropdown",
                    required: true,
                    default_value: "mongo",
                    dropdown_options: [
                        {
                            name: "Mongo",
                            key: "mongo"
                        },
                        {
                            name: "From Parent (can only be used as childform)",
                            key: "fromparent"
                        },
                        {
                            name: "Metadata",
                            key: "metadata"
                        },
                        {
                            name: "Rest API",
                            key: "rest"
                        },
                        {
                            name: "Salesforce Rest API",
                            key: "sfdc"
                        }
                    ]
                },
                {
                    name: "icon",
                    title: "Form Icon",
                    type: "reference",
                    required: false,
                    search_form: { _id: exps.forms.iconSearch}

                },
                {
                    name: "collection",
                    title: "Mongo Collection name",
                    type: "text",
                    default_value: "rec['name']|toApiName",
                    show_when: "rec['store'] == 'mongo'",
                    placeholder: "No Spaces please!",
                    required: "rec['store'] == 'mongo'"
                },
                {
                    name: "url",
                    title: "REST Endpoint",
                    type: "text",
                    show_when: "rec['store'] == 'rest'",
                    placeholder: "No Spaces please!",
                    required: "rec['store'] == 'rest'"
                },
                {
                    name: "fields",
                    title: "Form Feilds",
                    type: "childform",
                    layout: "list",
                    child_form: { _id: exps.forms.FormFieldMetadata},
                    _id: new ObjectID('000000000106')
                }
            ]
        },
        {
            _id: exps.forms.ComponentMetadata,
            name: "Component Metadata",
            desc: "This is you compoments",
            collection: "compomentmeta",
            store: "metadata",
            icon: {_id:"std28"},
            fields: [

                {
                    name: "name",
                    title: "Form Name",
                    type: "text",
                    placeholder: "",
                    required: true
                },
                {
                    name: "desc",
                    title: "Form Description",
                    type: "textarea",
                    placeholder: "Coplete Form Description",
                    required: false
                },
                {
                    name: "props",
                    title: "Properties",
                    type: "childform",
                    layout: "list",
                    child_form: { _id: exps.forms.FormFieldMetadata},
                    _id: new ObjectID('000000000156')
                }
            ],
            _data: exps.Compoments
        },
        {
            _id: exps.forms.FormFieldMetadata,
            name: "FormFieldMetadata",
            store: "fromparent",
            fields: [
                {
                    name: "title",
                    title: "Field Title",
                    type: "text",
                    placeholder: "Field Label",
                    required: true
                },
                {
                    name: "name",
                    title: "Field Name",
                    type: "text",
                    placeholder: "No Spaces please",
                    required: true
                },
                {
                    name: "type",
                    title: "Field Type",
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
                          name: "Checkbox",
                          key: "boolean"
                        },
                        {
                          name: "JSON",
                          key: "jsonarea"
                        },
                        {
                          name: "Formula",
                          key: "formula"
                        },
                        {
                          name: "Dropdown",
                          key: "dropdown"
                        },
                        {
                          name: "DateTime",
                          key: "datetime"
                        },
                        {
                          name: "Related List",
                          key: "relatedlist"
                        },
                        {
                          name: "Dynamic",
                          key: "dynamic"
                        }
                    ]
                },
                {
                    name: "default_value",
                    title: "Default Value",
                    type: "text",
                    placeholder: "Default Value",
                    required: false
                },
                {
                    name: "placeholder",
                    title: "Placeholder Value",
                    show_when: "rec['type'] == 'list'",
                    type: "text",
                    required: false
                },
                {
                    name: "show_when",
                    title: "Show When ( ie: rec['type'] == 'list')",
                    type: "text",
                    default_value: "true",
                    required: false
                },
                {
                    name: "createnew_form",
                    title: "Lookup Create form",
                    type: "reference",
                    placeholder: "only for lookup fields",
                    show_when: "rec['type'] == 'reference'",
                    createnew_form: { _id: exps.forms.formMetadata},
                    createnew_defaults: '{"primary": "name", "others": {}}',
                    search_form: { _id: exps.forms.metaSearch},
                    required: false,
                    _id: new ObjectID('000000000207'),
                },
                {
                    name: "createnew_defaults",
                    title: "Lookup Create New Defaults",
                    type: "text",
                    show_when: "rec['type'] == 'reference'",
                    placeholder: "{primary: 'name', others: {fieldname: 'val', fieldname: 'val'}}",
                    required: false
                },
                {
                    name: "search_form",
                    title: "Lookup Search Form",
                    type: "reference",
                    placeholder: "only for lookup fields",
                    show_when: "rec['type'] == 'reference'",
                    createnew_form: { _id: exps.forms.formMetadata},
                    createnew_defaults: '{"primary": "name", "others": {}}',
                    search_form: { _id: exps.forms.metaSearch},
                    required: false,
                    _id: new ObjectID('000000000209'),
                },
                {
                    name: "child_form",
                    title: "Child Form",
                    type: "reference",
                    show_when: "rec['type'] == 'childform' || rec['type'] == 'relatedlist'",
                    createnew_form: { _id: exps.forms.formMetadata},
                    createnew_defaults: '{"primary": "name", "others": { "type": "childform"}}',
                    search_form: { _id: exps.forms.metaSearch},
                    required: false,
                    _id: new ObjectID('000000000210'),
                },
                {
                    name: "layout",
                    title: "Childform Layout",
                    type: "dropdown",
                    show_when: "rec['type'] == 'childform'",
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
                            key: "true"
                        },
                        {
                            name: "No",
                            key: "false"
                        }
                    ]
                },
                {
                  name: "fieldmeta_el",
                  title: "Fields (EL)",
                  show_when: "rec['type'] == 'dynamic'",
                  placeholder: "context vars: rec, user, appMeta",
                  type: "formula"
                },
              {
                    name: "dropdown_options",
                    title: "Dropdown Options",
                    show_when: "rec['type'] == 'dropdown'",
                    type: "dropdown_options",
                    child_form: exps.forms.DropDownOption,
                }
            ]
        },
        {
            _id: exps.forms.DropDownOption,
            name: "DropDown Option",
            store: "fromparent",
            fields: [
              {
                  name: "key",
                  title: "key",
                  type: "text",
              },
              {
                  name: "name",
                  title: "Label",
                  type: "text"
              }
            ]
        },
        {
            _id: exps.forms.iconSearch,
            name: "iconSearch",
            store: "metadata",
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
            ],
            _data: exps.ICONS,
        },
        {
            _id: exps.forms.metaSearch,
            name: "metaSearch",
            icon: {_id:"std28"},
            store: "mongo",
            collection: "formmeta",
            fields: [
              {
                  name: "icon",
                  title: "Icon",
                  type: "reference",
                  search_form: { _id: exps.forms.iconSearch}
              },
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
            desc: "This is all the users that can logon to your applications",
            collection: "user",
            store: "mongo",
            layout: "1col",
            icon: {_id:"std88"},
            fields: [

                {
                    name: "name",
                    title: "Full Name",
                    type: "text",
                    placeholder: "",
                    required: true
                },
                {
                    name: "role",
                    title: "Role",
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
                    title: "Email",
                    type: "email",
                    placeholder: "",
                    required: true
                },
                {
                    name: "picture",
                    title: "Picture",
                    type: "image",
                    required: false
                },
                {
                    name: "provider",
                    title: "Auth Providers",
                    type: "childform",
                    child_form: { _id: exps.forms.AuthProviders},
                    _id: new ObjectID('000000000604')
                },
                {
                    name: "apps",
                    title: "Apps",
                    type: "childform",
                    createnew_form: { _id: exps.forms.UserApps},
                    child_form: { _id: exps.forms.UserApps},
                    _id: new ObjectID('000000000601'),
                }
            ]
        },
        {
          _id: exps.forms.UserSearch,
          name: "UserSearch",
          collection: "user",
          store: "mongo",
          icon: {_id:"std88"},
          fields: [
              {
                  name: "picture",
                  title: "Picture",
                  type: "image"
              },
              {
                  name: "name",
                  title: "Full Name",
                  type: "text",
              }
            ]
        },
        {
            _id: exps.forms.AuthProviders,
            name: "AuthProviders",
            store: "fromparent",
            fields: [

                {
                    name: "type",
                    title: "Auth Provider Type",
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
                    type: "text",
                    placeholder: "Field Label",
                    required: true
                },
                {
                    name: "password",
                    title: "Password",
                    type: "text",
                    placeholder: "password",
                    required: true
                }
            ]
        },
        {
            _id: exps.forms.UserApps,
            name: "User Apps",
            store: "fromparent",
            fields: [
              {
                  name: "app",
                  title: "App",
                  type: "reference",
                  createnew_form: { _id: exps.forms.App},
                  search_form: { _id: exps.forms.AppSearch},
                  required: true,
                  _id: new ObjectID('000000000901')
              },
              {
                  name: "appuserdata",
                  title: "Application User Data",
                  type: "dynamic",
                  fieldmeta_el: "rec.app._id|get('App').userfields"
              //    fieldmeta_el: "rec.app._id|get('App').userfields",
              }
            ]
        },
        {
            _id: exps.forms.AppSearch,
            name: "AppSearch",
            collection: "app",
            icon: {_id:"std8"},
            store: "mongo",
            fields: [
              {
                  name: "icon",
                  type: "reference",
                  search_form: { _id: exps.forms.iconSearch}

              },
              {
                name: "name",
                type: "text"
              },
              {
                name: "public",
                type: "dropdown",
                show_when: "false",
                dropdown_options: [
                    {
                        name: "Yes",
                        key: "yes"
                    },
                    {
                        name: "No",
                        key: "no"
                    }
                ]
              },
              {
                name: "default",
                show_when: "false",
                type: "dropdown",
                dropdown_options: [
                    {
                        name: "Yes",
                        key: "yes"
                    },
                    {
                        name: "No",
                        key: "no"
                    }
                ]
              }
            ]
        },
        {
            _id: exps.forms.App,
            name: "App",
            desc: "Define your app permissions",
            collection: "app",
            store: "mongo",
            layout: "1col",
            icon: {_id:"std8"},
            fields: [
                {
                    name: "name",
                    title: "App Name",
                    type: "text",
                    placeholder: "",
                    required: true
                },
                {
                    name: "type",
                    title: "Form Type",
                    type: "dropdown",
                    required: true,
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
                    name: "public",
                    title: "Public Access",
                    type: "dropdown",
                    required: true,
                    default_value: "no",
                    dropdown_options: [
                        {
                            name: "Yes",
                            key: "yes"
                        },
                        {
                            name: "No",
                            key: "no"
                        }
                    ]
                },
                {
                    name: "default",
                    title: "Default App",
                    type: "dropdown",
                    required: true,
                    default_value: "no",
                    dropdown_options: [
                        {
                            name: "Yes",
                            key: "yes"
                        },
                        {
                            name: "No",
                            key: "no"
                        }
                    ]
                },
                {
                    name: "icon",
                    title: "App Icon",
                    type: "reference",
                    search_form: { _id: exps.forms.iconSearch}
                },
                {
                    name: "appperms",
                    title: "App Forms",
                    type: "childform",
                    layout: "list",
                    child_form: { _id: exps.forms.AppPerms},
                    _id: new ObjectID('000000000a01')
                },
                {
                    name: "landingpage",
                    title: "Landing Page",
                    type: "childform",
                    createnew_form: { _id: exps.forms.AppPageComponent},
                    child_form: { _id: exps.forms.AppPageComponent},
                    _id: new ObjectID('000000000a02'),
                },
                {
                    name: "userfields",
                    title: "User Dynamic Fields",
                    type: "childform",
                    layout: "list",
                    child_form: { _id: exps.forms.FormFieldMetadata},
                    _id: new ObjectID('000000000a03')
                }
            ]
        },
        {
            _id: exps.forms.AppPageComponent,
            name: "App Page Component",
            store: "fromparent",
            fields: [
              {
                  name: "title",
                  title: "Title",
                  type: "text",
                  required: true
              },
              {
                  name: "component",
                  title: "component",
                  type: "reference",
                  search_form: { _id: exps.forms.ComponentMetadata},
                  required: true,
                  _id: new ObjectID('000000000e01'),
              },
              {
                  name: "props",
                  title: "Component Properties",
                  type: "dynamic",
                  fieldmeta_el: "rec.component._id|get('Component Metadata').props"
              },
              {
                  name: "position",
                  title: "Page Position",
                  type: "dropdown",
                  required: true,
                  default_value: "1col",
                  dropdown_options: [
                      {
                          name: "Header",
                          key: "head"
                      },
                      {
                          name: "Sidebar",
                          key: "side"
                      },
                      {
                          name: "Main",
                          key: "main"
                      },
                      {
                          name: "Footer",
                          key: "foot"
                      }
                  ]
              }
            ]
        },
        {
            _id: exps.forms.AppPerms,
            name: "App Meta",
            store: "fromparent",
            fields: [
              {
                  name: "form",
                  title: "Form",
                  type: "reference",
                  search_form: { _id: exps.forms.metaSearch},
                  required: true,
                  _id: new ObjectID('000000000b01'),
              },
              {
                  name: "crud",
                  title: "CRUD",
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
            desc: "Import applications",
            icon: {_id:"std43"},
            store: "rest",
            url: "/dform/defaultData",
            action: "import",
            fields: [
                {
                    name: "name",
                    title: "App Name",
                    type: "text"
                },
                {
                    name: "metadata",
                    title: "App Meta Data",
                    type: "childform",
                    layout: "list",
                    child_form: { _id: exps.forms.ImportMetaData},
                    _id: new ObjectID('000000000d01')
                }
            ]
        },
        {
            _id: exps.forms.ImportMetaData,
            name: "FormFieldMetadata",
            store: "fromparent",
            fields: [
                {
                    name: "form",
                    title: "Form",
                    type: "reference",
                    search_form: { _id: exps.forms.formMetadata}
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
                    type: "text"
                },
                {
                    name: "length",
                    title: "size (bytes)",
                    type: "text"
                },
                {
                    name: "uploadDate",
                    title: "Upload Date",
                    type: "text"
                },
                {
                    name: "ownerId",
                    title: "Owner",
                    type: "text"
                }
            ]
        }
    ];

    exps.adminApp = {_id: "admin",
        name: "Admin App",
        type: "deployed",
        public: "yes",
        default: "yes",
        appperms: [
      {form: {_id: exps.forms.formMetadata}, crud: "crud"},
      {form: {_id: exps.forms.ComponentMetadata}, crud: "crud"},
      {form: {_id: exps.forms.FormFieldMetadata}, crud: "crud"},
      {form: {_id: exps.forms.DropDownOption}, crud: "crud"},
      {form: {_id: exps.forms.metaSearch}, crud: "crud"},
      {form: {_id: exps.forms.Users}, crud: "crud"},
      {form: {_id: exps.forms.UserSearch}, crud: "crud"},
      {form: {_id: exps.forms.AuthProviders}, crud: "crud"},
      {form: {_id: exps.forms.UserApps}, crud: "crud"},
      {form: {_id: exps.forms.App}, crud: "crud"},
      {form: {_id: exps.forms.AppSearch}, crud: "crud"},
      {form: {_id: exps.forms.AppPerms}, crud: "crud"},
      {form: {_id: exps.forms.AppPageComponent}, crud: "crud"},
      {form: {_id: exps.forms.iconSearch}, crud: "crud"},
      {form: {_id: exps.forms.FileMeta}, crud: "crud"},
      {form: {_id: exps.forms.ImportMeta}, crud: "crud"},
      {form: {_id: exps.forms.ImportMetaData}, crud: "crud"}
            ],
        landingpage: [
          {
            position: "head",
            component: {_id: "AdminTileList"},
            title: "Admin Tile List",
            props: {
              formids: [exps.forms.formMetadata, exps.forms.Users, exps.forms.App, exps.forms.ImportMeta]
            }
          }
        ]
      };

    exps.systemMetabyId = function() {
      let res = {};

      for (let v of exps.FORMMETA) {
        res[v._id.toString()] = v;
      }
      return res;
    }
/*
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
*/
    return exps;
}
