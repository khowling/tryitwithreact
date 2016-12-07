"use strict";

const  
  express = require('express'),
  router = express.Router(),
//  parseString = require('xml2js').parseString,
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

const list_things =  (auth, thing) => {
    return new Promise ((acc,rej) => {
        let putreq = https.get({ hostname: auth.host, path: `/api/${thing}`,
            headers: {
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
                    //console.log (`on data ${chunk}`)
                    rawData += chunk
                    /*
                    parseString(chunk, (err, res) => {
                        console.log (`on data ${JSON.stringify(res, null, 1)}`)
                        if (err) {
                            return rej(err)
                        } else if (res["m:error"]) {
                            return rej(res["m:error"]["m:message"][0]["_"])
                        } else {
                            return acc(res.feed.entry)
                        }
                    });
                    */
                })

                res.on('end', () => {
                    //console.log (`on end ${rawData}`)
                    return acc(rawData)
                })

                
            }).on('error', (e) =>  rej(e));
    })
}


exports.find = (req, things, query) => {
    return new Promise ((acc,rej) => {
        if (query && query._id) {
            things = `${things}('${encodeURIComponent(query._id)}')`
        }
        console.log (`orm_ams: find ${things}`)

        let authandfind = () => {
            ams_authkey().then((ams_auth) => {
                req.session.ams_auth = ams_auth;
                list_things (req.session.ams_auth, things).then ((things) => acc (things), (err) => rej (err))
            }, (err) => res.status(400).send(err))
        }

        if (req.session.ams_auth) {
            list_things (req.session.ams_auth, things).then ((things) => acc (things), ({code, message}) => {
                if (code === 401) {
                    authandfind()
                } else {
                    rej (err)
                }
            })
        } else {
            authandfind()
        } 
    })
}

