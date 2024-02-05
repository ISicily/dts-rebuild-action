const core = require('@actions/core');
const github = require('@actions/github');
const dtsUtils = require('./dtsUtils.js')

const main = async () => {
  try {

    const owner = core.getInput('owner', { required: true });
    const repo = core.getInput('repo', { required: true });
    const token = core.getInput('token', { required: true });

    const collectionFile = core.getInput('collectionFile', { required: true });
    const permanentBaseInscriptionURI = core.getInput('permanentBaseInscriptionURI', { required: true });
    const permanentBaseInscriptionDownloadURL = core.getInput('permanentBaseInscriptionDownloadURL', { required: true });
    const errorFile = core.getInput('errorFile', { required: true });
 
    const octokit = new github.getOctokit(token);

    await dtsUtils.createDTSCollection(owner, repo, permanentBaseInscriptionURI, permanentBaseInscriptionDownloadURL, collectionFile, errorFile, octokit)
    
  } catch (error) {
    console.log("error when running the rebuild")
    console.log(error)
    core.setFailed(error.message);
  }
}

main();