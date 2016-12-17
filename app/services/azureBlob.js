

// ---------------------------------------------- creates a new block blob
const putblock = (blockid, data, saslocator) => {
    return new Promise ((acc,rej) => {

        let comp
        if (!Array.isArray(blockid)) {
            comp = `comp=block&blockid=${new Buffer(blockid).toString('base64')}`
        } else {
            comp = "comp=blocklist"
            data = '<?xml version="1.0" encoding="utf-8"?>' +
                    '<BlockList>' +
                    blockid.map((l) => `<Latest>${new Buffer(l).toString('base64')}</Latest>`).join('') +
                    '</BlockList>'
            console.log ('putting ' + data)
        }

        console.log (`putting blockid ${blockid}`)// size: ${data.length.toLocaleString()} bytes`)
        let xhr = new XMLHttpRequest();

        xhr.open('PUT', `${saslocator}&${comp}`);

        // Requires CORS set on Storage Account
        // response headers!
        //xhr.setRequestHeader("Access-Control-Allow-Origin", "*")

        // request headers, automatic??
        //xhr.setRequestHeader("Access-Control-Request-Method", "POST")
        //xhr.setRequestHeader("Access-Control-Request-Headers", "Content-Type")

        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200 || xhr.status === 201) {
              acc(blockid)
            } else  { 
              errors++
              console.log (`oh ${client.responseText}`)
              rej(client.statusText)
            }
          }
        }
        xhr.send(data);
    })
}

const BLOCK_SIZE = 4* 1024 * 1024

const storageacc = "kehowlimedia",
      storageaccurl = `https://${storageacc}.blob.core.windows.net`,
      acccontainer = "uploads",
      sas = "sv=2015-04-05&ss=b&srt=sco&sp=rwdlac&se=2017-02-04T04:07:11Z&st=2016-12-07T20:07:11Z&spr=https&sig=OGxCypsc6o5eLx2jwhHKMZHYHOdgK47anR5xmmdbMzU%3D"


export default function (file, evtFn, locator) {
  return new Promise ((acc,rej) => {
    let startt = new Date().getTime(),
        reader = new FileReader(),
        saslocator = locator || `${storageaccurl}/${acccontainer}/${encodeURIComponent(file.name)}?${sas}`,
        new_index

    console.log (`uploading file ${file.name}, size: ${file.size.toLocaleString()}, blocksz: ${BLOCK_SIZE}`)
    let readNextChunk = (index) => {  
      new_index = Math.min (file.size, index+BLOCK_SIZE)
      reader.readAsArrayBuffer(file.slice(index, new_index))
      console.log (`slice ${index} to ${new_index}`)
    }

    let currblock = 0, sendblockids = []
    reader.onload = (event) => {
      let blockid = "KH01" + ('00000'+currblock++).slice(-5)
      sendblockids.push(blockid);
      console.log (`putting block (${sendblockids.length}) ${blockid}`)
      

      putblock(blockid, event.target.result, saslocator).then((succ) => {
        if (new_index < file.size) {
          readNextChunk(new_index)
          evtFn({loaded: new_index, total: file.size})
        } else {
          putblock(sendblockids, null, saslocator).then ((succ) => {
            console.log (`finished  ${(new Date().getTime() - startt)/1000}s`);
            acc({url: saslocator})
          }, (err) => rej(err))
        }
      }, (err) => {
        console.error (`putblock error : ${err}`)
      })   
    }
    readNextChunk(0)
  })
}