const _ = require('lodash')
var xml2js = require('xml2js');
var JSZip = require("jszip");

const collectionTemplate = require("./collection-template.js")
const inscriptionTemplate = require("./inscription-template.js")
const githubUtils = require('./githubUtils.js')

const INSRIPTIONS_FOLDER = "inscriptions"

const createDTSMemberEntry = async (epidoc, fileName, permanentBaseInscriptionURI, permanentBaseInscriptionDownloadURL, errors) => {
  const path = `${INSRIPTIONS_FOLDER}/${fileName}`
  const id = fileName.slice(0, -4)  // remove the .xml extension from the end 
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
    dtsMemberEntry.description = description
    dc['dc:description'][0]['@value'] = description
    dtsMemberEntry['dts:download'] = `${permanentBaseInscriptionDownloadURL}${fileName}`
    dtsMemberEntry['@id'] = `${permanentBaseInscriptionURI}${id}`
    // dtsMemberEntry['dts:passage'] = `/api/dts/documents?id=${id}`
    return dtsMemberEntry
  }
  return null
}

async function createDTSCollection(owner, repo, permanentBaseInscriptionURI, permanentBaseInscriptionDownloadURL, collectionFile, errorFile, octokit) {
  console.log("Starting the collection build...")
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

  console.log(`Parsed the zip - ${inscriptionFiles.length} inscription files.`)
  console.log(`Adding entries to collection file...`)
  for (const file of inscriptionFiles) {
    const epidoc = await zip.file(file.name).async("string")
    const filePath = file.name.slice(-14)
    let memberEntry = await createDTSMemberEntry(epidoc, filePath, permanentBaseInscriptionURI, permanentBaseInscriptionDownloadURL, errors)
    if (memberEntry) dtsRecord.member.push(memberEntry);
  }
  const totalRecords = dtsRecord.member.length
  dtsRecord.totalItems = totalRecords
  dtsRecord['dts:totalChildren'] = totalRecords
  const collectionFileAsString = JSON.stringify(dtsRecord)
  console.log(`Saving collections file with ${totalRecords} records...`)
  await githubUtils.saveFileToGithub(owner, repo, collectionFileAsString, collectionFile, "update collection", octokit)
  if (errors.length) {
    console.log("Saving errors file.")
    await githubUtils.saveFileToGithub(owner, repo, JSON.stringify(errors), errorFile, "save errors from collection update", octokit)
  }
  console.log(`Done.`)
};

module.exports = {
  createDTSCollection
}