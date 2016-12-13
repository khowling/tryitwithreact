"use strict";


const url = require('url'),
      crypto = require('crypto'),
      https = require('https')


// ---------------------------------------------- 
// creates an ad-hoc SAS on the container
function createSAS (storageacc, container, minutes) {

// first construct the string-to-sign from the fields comprising the request,
// then encode the string as UTF-8 and compute the signature using the HMAC-SHA256 algorithm
// Note that fields included in the string-to-sign must be URL-decoded

    let signedpermissions = "rwd",
        signedstart = '',
        signedexpiry= new Date(Date.now() + (minutes*60*1000)).toISOString().substring(0, 19) + 'Z',
        canonicalizedresource= `/blob/${storageacc}/${container}`,
        signedidentifier = '', //if you are associating the request with a stored access policy.
        signedIP = '',
        signedProtocol = 'https',
        signedversion = '2015-04-05',
        rscc = '', // Blob Service and File Service Only, To define values for certain response headers, Cache-Control
        rscd = '', // Content-Disposition
        rsce = '', // Content-Encoding
        rscl = '', // Content-Language
        rsct = '', // Content-Type
        SIGN_KEY = process.env.STORAGE_KEY,
        stringToSign = 
`${signedpermissions}
${signedstart}
${signedexpiry}
${canonicalizedresource}
${signedidentifier}
${signedIP}
${signedProtocol}
${signedversion}
${rscc}
${rscd}
${rsce}
${rscl}
${rsct}`

    const sig = crypto.createHmac('sha256', new Buffer(SIGN_KEY, 'base64')).update(stringToSign, 'utf-8').digest('base64');

    return { container_url: `https://${storageacc}.blob.core.windows.net/${container}`, sas: 
        `sv=${signedversion}&` +  // signed version
        "sr=c&" +   // signed resource 'c' = Container 'b' = Blob
        `sp=${signedpermissions}&` + //  The permissions associated with the shared access signature
        //    "st=2016-08-15T11:03:04Z&" +
        `se=${signedexpiry}&` + // signed expire 2017-08-15T19:03:04Z
        //    "sip=0.0.0.0-255.255.255.255&" +
        `spr=${signedProtocol}&` +
        `sig=${sig}`}



}






const  
  ams_api_version = '2.13',
  ams_initial_host = 'media.windows.net',
  aad_acs = 'wamsprodglobal001acs.accesscontrol.windows.net',
  ams_account_name = 'kehowli',
  ams_account_key = 'huj4dgUqzlffMaufoZec0fuLR6LrP201C7rDdhFpUBI='



// ---------------------------------------------- AMS Authentication & AccessPolicy
const ams_authkey = () =>  {
  return new Promise ((acc,rej) => {
    let putreq = https.request({
            hostname: aad_acs,
            path: `/v2/OAuth${ams_api_version.replace(/\./g, '-')}`,
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
                        /* --- No, dont call AMS proxy Storage methods
                        // get AccessPolicy (to write to AssetFiles)
                        let apolicy_req = https.request({
                            hostname: auth.host,
                            path: `/api/AccessPolicies`,
                            method: 'POST',
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
                                    auth.access_policy = JSON.parse(rawData)
                                    return acc(auth)
                                });

                            }).on('error', (e) =>  rej(e));

                        apolicy_req.write (JSON.stringify({"Name":"NewUploadPolicy", "DurationInMinutes":"440", "Permissions":"2"}))
                        apolicy_req.end()
                        ---------------------------------- */
                         return acc(auth)

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

                
            }).on('error', (e) =>  rej({code: 'error', message: e}));
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
                    return acc(rawData && JSON.parse(rawData))
                });

            }).on('error', (e) =>  rej({code: 'error', message: e}));

    if (body) putreq.write (JSON.stringify(body))
    putreq.end()
  })
}


exports.save = (formdef, userdoc, context) => {
    return new Promise ((acc,rej) => {
        let things = formdef.parent ? formdef.parent.field.name : formdef.form.collection
        if (formdef.parent) {
            userdoc.ParentAssetId = formdef.parent.query._id
            // remove the attachment
            if (formdef.form.name === 'AMS Asset Files' ) {
                delete userdoc.file
            }
        }

        console.log (`AMS Save: ${things} ${JSON.stringify(userdoc, null, 1)}`)

        let change_things_promise = (auth) => { return new Promise((acc, rej) => {
            change_things ('POST', auth, things, userdoc).then ((topthing) => {
                if (formdef.form.name !== 'AMS Asset Files') {
                    acc (topthing)
                } else {
                    console.log ('AMS Save: get SAS locator for the asset: ${topthing.Uri}')
                    topthing._saslocator = createSAS ('kehowlimedia', userdoc.ParentAssetId.replace('nb:cid:UUID:','asset-'), 10)
                    acc (topthing)
                    
                    /* ------ Just create SAS directly -----
                    change_things ('POST', auth, 'Locators', {  
                        "AccessPolicyId": auth.access_policy.Id,
                        "AssetId": userdoc.ParentAssetId,
                        "StartTime": new Date().toISOString(), // "2015-02-18T16:45:53",
                        "Type":1
                        }).then ((saslocator) => {
                            console.log (`AMS Save: got SAS locator: ${JSON.stringify(saslocator)}`)
                            topthing._saslocator = saslocator
                            acc (topthing)
                        }, (err) => rej (err)) 
                    ------------------------------------- */
                }
            }, (err) => rej (err)) 
        })}

        if (context.ams_auth) {
            change_things_promise(context.ams_auth).then((succ) =>  acc (succ), ({code, message}) => {
                if (code === 401) { // unathenticated
                    ams_authkey().then((ams_auth) => {
                        context.ams_auth = ams_auth;
                        change_things_promise(ams_auth).then((succ) =>  acc (succ), ({code, message}) => rej (`${code} ${message}`))
                    }, (err) => rej(err))
                } else {
                    rej (`${code} ${message}`)   
                }
            })
        } else {
             ams_authkey().then((ams_auth) => {
                context.ams_auth = ams_auth;
                change_things_promise(ams_auth).then((succ) =>  acc (succ), ({code, message}) => rej (`${code} ${message}`))
            }, (err) => rej(err))
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

exports.delete = (formdef, query, context) => {
    return new Promise ((acc,rej) => {
        if (query && query._id) {
            let things = `${formdef.form.collection}('${encodeURIComponent(query._id)}')`
        
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
            return rej(`delete requires an query id`)
        }
    })
}
