const axios = require('axios');
const _ = require('lodash')
var xml2js = require('xml2js');
const {Base64} = require('js-base64');
const collectionTemplate = require("./collection-template.js")
const inscriptionTemplate = require("./inscription-template.js")

const createDTSMemberEntry = async (githubEntry, permanentBaseInscriptionURI, permanentBaseInscriptionDownloadURL, owner, repo, octokit, errors) => {
  const path = githubEntry.path  // e.g., ISic000002.xml
  const id = path.slice(0, -4)  // remove the .xml from the end
  const result = await octokit.rest.repos.getContent({owner,repo,path})
 // const res = await axios.get(githubEntry.url);
  const epidoc = Base64.decode(result.data.content);
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
      let dtsMemberEntry =  _.cloneDeep(inscriptionTemplate, true);
      const dc = dtsMemberEntry['dts:dublincore']
      const description = inscription.TEI.teiHeader[0].fileDesc[0].titleStmt[0].title[0]
      dtsMemberEntry.title = id
      dc['dc:title'][0]['@value'] = id
      dtsMemberEntry.description = description
      dc['dc:description'][0]['@value'] = description
      dtsMemberEntry['dts:download'] = `${permanentBaseInscriptionDownloadURL}${path}`
      dtsMemberEntry['@id'] = `${permanentBaseInscriptionURI}${id}`
     // dtsMemberEntry['dts:passage'] = `/api/dts/documents?id=${id}`
      return dtsMemberEntry
    }
    return null
  
}

async function getInscriptionsList(owner, repo, octokit) {

  let repoContents = await octokit.rest.repos.getContent({owner, repo})
		let treeSHA = repoContents.data.find(entry=>entry.path === 'inscriptions').sha
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
    //if (repoFile.path.endsWith('ISic000002.xml') || repoFile.path.endsWith('ISic000001.xml') ) {
      let memberEntry = await createDTSMemberEntry(repoFile, permanentBaseInscriptionURI, permanentBaseInscriptionDownloadURL, owner, repo, octokit, errors)
      if (memberEntry) dtsRecord.member.push(memberEntry);
   // }
  }
  dtsRecord.totalItems = dtsRecord.member.length
  dtsRecord['dts:totalChildren'] = dtsRecord.member.length
  return {collectionFileAsString: JSON.stringify(dtsRecord), errors}
}

module.exports = {
  createDTSCollection
}