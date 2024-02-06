# dts-rebuild-action

Github action to rebuild a static DTS collection file. It is meant to be 
run in a repository that has a folder called 'inscriptions' containing TEI inscriptions. More specifically this action was created for the [ISicily Repository](https://github.com/ISicily/ISicily). To use this action as-is, you'll pretty much need to use the same structure for your TEI files as is used in the I.Sicily 'inscriptions' directory.

This action will generate a DTS collection object with entries for all of the inscriptions, and save it to `dts/collection.json`.  You can change where the file is saved as described further below.

It will also create a file called `dts/error.json` if there were any errors during a run.

To use this action, make a folder called '.github' in the root of your github project (your project that has an 'inscriptions' folder containing TEI inscriptions). Then make another folder inside of that called 'workflows'. Then add a file inside that folder called updateCollection.yaml and add this to the file:

```
name: update DTS collection file
on:
  schedule: 
      - cron: '42 2 * * *'
jobs:
  update-collection:
    runs-on: ubuntu-latest
    name: Updates collection file
    steps:
      - name: Update files
        uses: ISicily/dts-rebuild-action@main
        with:
          owner: ${{ github.repository_owner }}
          repo: ${{ github.event.repository.name }}
          token: ${{ github.token }}
          collectionFile: dts/collection.json
          permanentBaseInscriptionURI: http://sicily.classics.ox.ac.uk/inscription/
          permanentBaseInscriptionDownloadURL: https://raw.githubusercontent.com/ISicily/ISicily/master/inscriptions/
          errorFile: dts/error.json
```
<br/><br/>
You can change the `collectionFile` and `errorFile` values if you'd like to save the files to a different directory and/or file name.

The `permanentBaseInscriptionURI` value should be the base uri for the identifiers of your inscriptions. These identifiers are added to the dts entry for each inscription. 

With I.Sicily, the URI for an inscription is like so:

`http://sicily.classics.ox.ac.uk/inscription/ISic0000001`

hence the following `permanentBaseInscriptionURI`:

`http://sicily.classics.ox.ac.uk/inscription/`

As you can see, the id for the inscription is tacked onto the end of the `permanentBaseInscriptionURI`.

The `permanentBaseInscriptionDownloadURL` value should be the base url with which to construct a url from which the raw xml for your inscriptions can be downloaded.

With I.Sicily the inscriptions can be downloaded from a url like so:

`http://sicily.classics.ox.ac.uk/inscription/ISic0000001.xml`

and so in that case the `permanentBaseInscriptionDownloadURL` is:

`http://sicily.classics.ox.ac.uk/inscription/`

As you can see, the id for the inscription, and the `.xml` file extension are both tacked onto the end of the `permanentBaseInscriptionDownloadURL`.

The workflow in the above config will run the action once a day at 2:42am UTC time. The 'cron' entry dictates when the action runs.

You can read more about scheduled github actions [here](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule) including how to set the
schedule, or how to trigger the action for other events like a commit or PR.

To change what goes into the collection.json file, look at the collection-template.json and inscription-template.json files as well as the dtsUtils.js code which populates those templates using data from the TEI files gotten from the inscription folder.

# Important

You likely have to grant your action permisson to write to your repository.  Do that by opening the Settings screen for the repository, and then choosing Actions/General, like so:

<img width="1020" alt="image" src="https://github.com/ISicily/dts-rebuild-action/assets/547165/576ad8be-0eac-4a6a-afae-f4bdd818c055">
<br/><br/><br/><br/>
Then scroll down to the 'Workflow Permissions' section and select 'Read and write permissions', like so:
<br/><br/><br/><br/>
<img width="1016" alt="image" src="https://github.com/ISicily/dts-rebuild-action/assets/547165/a7139684-3360-46b7-a421-4be1d0e16a44">
<br/><br/><br/><br/>
And finally 'Save'


