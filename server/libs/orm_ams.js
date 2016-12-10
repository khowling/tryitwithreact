"use strict";

const  
  express = require('express'),
  router = express.Router(),
  https = require('https'),
  url = require('url'),
  ams_api_version = '2.13',
  ams_initial_host = 'media.windows.net',
  aad_acs = 'wamsprodglobal001acs.accesscontrol.windows.net',
  aad_acs_path = `/v2/OAuth${ams_api_version.replace(/\./g, '-')}`,
  ams_account_name = 'kehowli',
  ams_account_key = 'huj4dgUqzlffMaufoZec0fuLR6LrP201C7rDdhFpUBI='



// ---------------------------------------------- Create Container ACL
const ams_authkey = () =>  {
  return new Promise ((acc,rej) => {
    let putreq = https.request({
            hostname: aad_acs,
            path: aad_acs_path,
            method: 'POST',
            headers: {}
            }, (res) => {

                console.log (`ams_authkey status ${res.statusCode}`)

                if(!(res.statusCode === 200 || res.statusCode === 201)) {
                    console.log (`${res.statusCode} : ${res.statusMessage}`)
                    res.resume();
                    return rej(res.statusCode)
                }

                let rawData = '';
                res.on('data', (chunk) => {
                    rawData += chunk
                })

                res.on('end', () => {
                    let auth = {token: JSON.parse(rawData), host: ams_initial_host}
                    //console.log (`on data ${JSON.stringify(auth.token)}`)
                    https.get({hostname: auth.host, path: '/', headers: {
                        'x-ms-version': ams_api_version,
                        'Authorization': `Bearer ${auth.token.access_token}`
                    }}, (res2) => {
                        if (res2.statusCode === 301) {
                            //console.log (`${res2.statusCode}  ${res2.statusMessage} ${(res2.headers.location)}`)
                            auth.host = url.parse(res2.headers.location).hostname
                        }
                        acc(auth)
                    }).on('error', (e) =>  rej(e));
                    
                });

            }).on('error', (e) =>  rej(e));

    putreq.write (`grant_type=client_credentials&client_id=${ams_account_name}&client_secret=${encodeURIComponent(ams_account_key)}&scope=urn%3aWindowsAzureMediaServices`)
    putreq.end()
  })
}

// ---------------------------------------------- list
const list_things =  (auth, thing) => {
    return new Promise ((acc,rej) => {
        console.log (`AMS list_things: /api/${thing}`)
        let putreq = https.get({ hostname: auth.host, path: `/api/${thing}`,
            headers: {
                'Accept': 'application/json',
                'x-ms-version': ams_api_version,
                'Authorization': `Bearer ${auth.token.access_token}`
            }}, (res) => {
                console.log (`list_things status ${res.statusCode}`)

                if(!(res.statusCode === 200 || res.statusCode === 201)) {
                    console.log (`${res.statusCode} : ${res.statusMessage}`)
                    res.resume();
                    return rej({code: res.statusCode, message: res.statusMessage})
                }

                let rawData = '';
                res.on('data', (chunk) => {
                    //console.log (`list_things got data ${chunk}`)
                    rawData += chunk
                })

                res.on('end', () => {
                    console.log (`list_things got end ${rawData}`)
                    return acc(JSON.parse(rawData))
                })

                
            }).on('error', (e) =>  rej(e));
    })
}

// ---------------------------------------------- save
const change_things = (mode, auth, thing, body) =>  {
  return new Promise ((acc,rej) => {
    console.log (`change_things: ${auth.host} ${mode} /api/${thing} : ${JSON.stringify(body)}`)
    let putreq = https.request({
            hostname: auth.host,
            path: `/api/${thing}`,
            method: mode,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-ms-version': ams_api_version,
                'Authorization': `Bearer ${auth.token.access_token}`
            }}, (res) => {

                console.log (`change_things status ${res.statusCode} : headers ${res.rawHeaders}`)

                if(!(res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 204)) {
                    console.log (`${res.statusCode} : ${res.statusMessage}`)
                    res.resume();
                    return rej({code: res.statusCode, message: res.statusMessage})
                }

                let rawData = '';
                res.on('data', (chunk) => {
                    //console.log (`change_things got data: ${chunk}`)
                    rawData += chunk
                })

                res.on('end', () => {
                    //console.log (`change_things got end ${rawData}`)
                    return acc(rawData)
                });

            }).on('error', (e) =>  rej(e));

    if (body) putreq.write (JSON.stringify(body))
    putreq.end()
  })
}


exports.save = (formdef, userdoc, context) => {
    return new Promise ((acc,rej) => {
        let things = formdef.parent ? formdef.parent.field.name : formdef.form.collection
        if (formdef.parent) {
            userdoc.ParentAssetId = formdef.parent.query._id
        }
        console.log (`orm_ams: save ${things} ${JSON.stringify(userdoc, null, 1)}`)

        let authandfind = () => {
            ams_authkey().then((ams_auth) => {
                context.ams_auth = ams_auth;
                change_things ('POST', context.ams_auth, things, userdoc).then ((things) => acc (things), (err) => rej (err))
            }, (err) => rej(err))
        }

        if (context.ams_auth) {
            change_things ('POST', context.ams_auth, things, userdoc).then ((things) => acc (things), ({code, message}) => {
                if (code === 401) {
                    authandfind()
                } else {
                    rej (`${code} ${message}`)
                }
            })
        } else {
            authandfind()
        }
    })
}

exports.find = (formdef, query, context) => {
    return new Promise ((acc,rej) => {
        console.log (`ams find formdef: ${JSON.stringify(formdef.form.name)}, query ${JSON.stringify(query)}`)
        let things = formdef.form.collection, children = []
        if (query && query._id) {
            things = `${formdef.form.collection}('${encodeURIComponent(query._id)}')`
            if (query.display === "all") {
                console.log (`ams find: pull all the childforms`)
                for (var field of formdef.form.fields.filter((f) => f.type === 'childform')) {
                    // TODO
                    console.log (`ams find: push ${field.name}`)
                    children.push(field.name)
                }
            }
        }
        console.log (`orm_ams: find ${things}`)

        let list_things_promise = (auth) => { return new Promise((acc, rej) => {
            list_things (auth, things).then ((topthing) => {
                    
                    if (children.length === 0) {
                        acc (topthing)
                    } else {
                        list_things (context.ams_auth, `${things}/${children[0]}`).then ((childthings) => {
                            topthing[children[0]] = childthings
                            acc (topthing)
                        }, (err) => rej (err))
                    }
                }, (err) => rej (err))
        })}

        if (context.ams_auth) {
            list_things_promise(context.ams_auth).then((succ) =>  acc (succ), ({code, message}) => {
                if (code === 401) { // unathenticated
                    ams_authkey().then((ams_auth) => {
                        context.ams_auth = ams_auth;
                        list_things_promise(ams_auth).then((succ) =>  acc (succ), ({code, message}) => rej (`${code} ${message}`))
                    }, (err) => rej(err))
                } else {
                    rej (`${code} ${message}`)   
                }
            })
        } else {
             ams_authkey().then((ams_auth) => {
                context.ams_auth = ams_auth;
                list_things_promise(ams_auth).then((succ) =>  acc (succ), ({code, message}) => rej (`${code} ${message}`))
            }, (err) => rej(err))
        } 
    })
}

exports.delete = (things, parent, query, context) => {
    return new Promise ((acc,rej) => {
        if (query && query._id) {
            things = `${things}('${encodeURIComponent(query._id)}')`
        
            console.log (`orm_ams: find ${things}`)

            let authandfind = () => {
                ams_authkey().then((ams_auth) => {
                    context.ams_auth = ams_auth;
                    change_things ('DELETE', context.ams_auth, things, userdoc).then ((things) => acc (things), (err) => rej (err))
                }, (err) => rej(err))
            }

            if (context.ams_auth) {
                change_things ('DELETE', context.ams_auth, things, null).then ((things) => acc (things), ({code, message}) => {
                    if (code === 401) {
                        authandfind()
                    } else {
                        rej (`${code} ${message}`)
                    }
                })
            } else {
                authandfind()
            } 
        } else {
            return rej(`delete requires an ${things} id`)
        }
    })
}
