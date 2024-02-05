const { Octokit } = require("octokit");
const dtsUtils = require('./dtsUtils.js')

const main = async () => {
  try {

    const owner = 'jchartrand'
    const repo = 'ISicily-myFork';
    const collectionFile = 'dts/collection.json'
    const permanentBaseInscriptionURI = 'http://sicily.classics.ox.ac.uk/inscription/'
    const permanentBaseInscriptionDownloadURL = ' https://raw.githubusercontent.com/ISicily/ISicily/master/inscriptions/'
    const errorFile = 'dts/error.json'
   
    const octokit = await new Octokit({
        auth: ''
      });

    await dtsUtils.createDTSCollection(owner, repo, permanentBaseInscriptionURI, permanentBaseInscriptionDownloadURL, collectionFile, errorFile, octokit)
    
  } catch (error) {
    console.log("error when running the rebuild")
    console.log(error)
  }
}

main();