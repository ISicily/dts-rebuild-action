const axios = require('axios');
const _ = require('lodash')
var xml2js = require('xml2js');
const collectionTemplate = require("./collection-template.js")
const inscriptionTemplate = require("./inscription-template.js")

const createDTSMemberEntry = async (githubEntry, basePublicURL, errors) => {
  const path = githubEntry.path
  const id = path.slice(0, -4)
  const downloadURL = `https://raw.githubusercontent.com/ISicily/ISicily/master/inscriptions/${path}`
    const epidoc = await axios.get(downloadURL);
    var parser = new xml2js.Parser(/* options */);
    let inscription;
    try {
         inscription = await parser.parseStringPromise(epidoc.data)
    } catch (e) {
        console.log(`Problem with inscription at ${downloadURL}`)
        console.log(e)
        errors.push(`Problem with inscription at ${downloadURL}`)
    }

    if (inscription && inscription.TEI) {
      let dtsMemberEntry =  _.cloneDeep(inscriptionTemplate, true);
      const dc = dtsMemberEntry['dts:dublincore']
      const description = inscription.TEI.teiHeader[0].fileDesc[0].titleStmt[0].title[0]
      dtsMemberEntry.title = id
      dc['dc:title'][0]['@value'] = id
      dtsMemberEntry.description = description
      dc['dc:description'][0]['@value'] = description
      dtsMemberEntry['dts:download'] = downloadURL
      dtsMemberEntry['@id'] = `${basePublicURL}${id}`
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

async function createDTSCollection(owner, repo, basePublicURL, octokit) {
  const errors = []
  let dtsRecord = _.cloneDeep(collectionTemplate)
  const inscriptionsList = await getInscriptionsList(owner, repo, octokit) 
  for (const repoFile of inscriptionsList) {
    if (repoFile.path.endsWith('ISic000002.xml') || repoFile.path.endsWith('ISic000001.xml') || repoFile.path.endsWith('ISic000003.xml')) {
      console.log('the repo file: ')
      console.log(repoFile)
      let memberEntry = await createDTSMemberEntry(repoFile, basePublicURL, errors)
      if (memberEntry) dtsRecord.member.push(memberEntry);
    }
  }
  dtsRecord.totalItems = dtsRecord.member.length
  dtsRecord['dts:totalChildren'] = dtsRecord.member.length
  return {collectionFileAsString: JSON.stringify(dtsRecord), errors}
}

module.exports = {
  createDTSCollection
}