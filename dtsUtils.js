//const axios = require('axios');
const _ = require('lodash')
var xml2js = require('xml2js');
var JSZip = require("jszip");
//const {Base64} = require('js-base64');
const collectionTemplate = require("./collection-template.js")
const inscriptionTemplate = require("./inscription-template.js")

const githubUtils = require('./githubUtils.js')
const INSRIPTIONS_FOLDER = "inscriptions"

const createDTSMemberEntry = async (epidoc, fileName, permanentBaseInscriptionURI, permanentBaseInscriptionDownloadURL, errors) => {
  // const path = `${INSRIPTIONS_FOLDER}/${githubEntry.path}`  // e.g., ISic000002.xml
  const path = `${INSRIPTIONS_FOLDER}/${fileName}`
  const id = fileName.slice(0, -4)  // remove the .xml from the end and inscriptions/ from the beginning
  // const result = await octokit.rest.repos.getContent({owner,repo,path})
  // const res = await axios.get(githubEntry.url);
  //const epidoc = Base64.decode(result.data.content);
  var parser = new xml2js.Parser(/* options */);
  let inscription;
  try {
    inscription = await parser.parseStringPromise(epidoc)
  } catch (e) {
    console.log(`Problem with inscription: ${path}`)
    console.log(e)
    errors.push(`Problem with inscription: ${path}`)
  }

  if (inscription && inscription.TEI) {
    let dtsMemberEntry = _.cloneDeep(inscriptionTemplate, true);
    const dc = dtsMemberEntry['dts:dublincore']
    const description = inscription.TEI.teiHeader[0].fileDesc[0].titleStmt[0].title[0]
    dtsMemberEntry.title = id
    dc['dc:title'][0]['@value'] = id
    // dc['dc:identifier'][0]['@value'] = githubEntry.sha
    dtsMemberEntry.description = description
    dc['dc:description'][0]['@value'] = description
    dtsMemberEntry['dts:download'] = `${permanentBaseInscriptionDownloadURL}${fileName}`
    dtsMemberEntry['@id'] = `${permanentBaseInscriptionURI}${id}`
    // dtsMemberEntry['dts:passage'] = `/api/dts/documents?id=${id}`
    return dtsMemberEntry
  }
  return null

}

/* async function getInscriptionsList(owner, repo, octokit) {

  let repoContents = await octokit.rest.repos.getContent({owner, repo})
    let treeSHA = repoContents.data.find(entry=>entry.path === INSRIPTIONS_FOLDER).sha
    let githubResponse = await octokit.rest.git.getTree(
      {
        owner,
        repo,
        tree_sha: treeSHA
      }
    )
    return githubResponse.data.tree
}

async function createDTSCollection(owner, repo, permanentBaseInscriptionURI, permanentBaseInscriptionDownloadURL, octokit) {
  const errors = []
  let dtsRecord = _.cloneDeep(collectionTemplate)
  const inscriptionsList = await getInscriptionsList(owner, repo, octokit) 
  for (const repoFile of inscriptionsList) {
    if (repoFile.path.endsWith('ISic000002.xml') || repoFile.path.endsWith('ISic000001.xml') ) {
      let memberEntry = await createDTSMemberEntry(repoFile, permanentBaseInscriptionURI, permanentBaseInscriptionDownloadURL, owner, repo, octokit, errors)
      if (memberEntry) dtsRecord.member.push(memberEntry);
    }
  }
  dtsRecord.totalItems = dtsRecord.member.length
  dtsRecord['dts:totalChildren'] = dtsRecord.member.length
  const collectionFileAsString = JSON.stringify(dtsRecord)
  //return {collectionFileAsString: JSON.stringify(dtsRecord), errors}

  await githubUtils.saveFileToGithub(owner, repo, collectionFileAsString, collectionFile, "update collection", octokit)
  if (errors.length) {
    await githubUtils.saveFileToGithub(owner, repo, JSON.stringify(errors), errorFile, "save errors from collection update", octokit)
  }
}
 */

async function createDTSCollection(owner, repo, permanentBaseInscriptionURI, permanentBaseInscriptionDownloadURL, collectionFile, errorFile, octokit) {
  const errors = []
  let dtsRecord = _.cloneDeep(collectionTemplate)

  let result = await octokit.request(`GET /repos/${owner}/${repo}/zipball`, {
    owner,
    repo,
    archive_fomrat: 'zipball'
  });

  const zip = await JSZip.loadAsync(result.data)

  const inscriptionFiles = zip.filter(function (relativePath, file) {
    return file.name.includes("/inscriptions/ISic") && file.name.endsWith('.xml')
  });

  for (const file of inscriptionFiles) {
    const epidoc = await zip.file(file.name).async("string")
    const filePath = file.name.slice(-14)
    let memberEntry = await createDTSMemberEntry(epidoc, filePath, permanentBaseInscriptionURI, permanentBaseInscriptionDownloadURL, errors)
    if (memberEntry) dtsRecord.member.push(memberEntry);
  }
  dtsRecord.totalItems = dtsRecord.member.length
  dtsRecord['dts:totalChildren'] = dtsRecord.member.length
  const collectionFileAsString = JSON.stringify(dtsRecord)
  //return {collectionFileAsString: JSON.stringify(dtsRecord), errors}

  await githubUtils.saveFileToGithub(owner, repo, collectionFileAsString, collectionFile, "update collection", octokit)
  if (errors.length) {
    await githubUtils.saveFileToGithub(owner, repo, JSON.stringify(errors), errorFile, "save errors from collection update", octokit)
  }

};

/* request({
  method : "GET",
  url : "http://localhost/.../file.zip",
  encoding: null // <- this one is important !
}, function (error, response, body) {
  if(error ||  response.statusCode !== 200) {
    // handle error
    return;
  }
  JSZip.loadAsync(body).then(function (zip) {
    return zip.file("content.txt").async("string");
  }).then(function (text) {
    console.log(text);
  });
}); */
//}

module.exports = {
  createDTSCollection
}