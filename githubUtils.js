
const {Base64} = require('js-base64');

async function getManifestSha(owner, repo, path, octokit) {
    let sha
    try {
      const response = await octokit.rest.repos.getContent({owner, repo, path})
      sha = response.data.sha
    } catch (e) {
      console.log(`Couldn't find ${path} in Github repository ${owner}/${repo}: ${e}`);
    }
      return sha
  }
  
  async function saveFileToGithub(owner, repo, fileContentsAsString, path, message, octokit) {
      try {
          const sha = await getManifestSha(owner, repo, path, octokit)
         let content = Base64.encode(fileContentsAsString)
         let config = {owner, repo, path, message, content, ...(sha && {sha})}
         const result = await octokit.rest.repos.createOrUpdateFileContents(config)
      } catch (e) {
          console.log(`Problem saving file ${path} back to the Github repository: ${e}`);
      }
  }

  module.exports = {
    saveFileToGithub
  }