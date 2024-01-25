# dts-rebuild-action

Github action to rebuild a static DTS collection file. It is meant to be 
run in a repository that has a folder called 'inscriptions' containing TEI inscriptions. More specifically this action was created for the [ISicily Repository](https://github.com/ISicily/ISicily). To use this action as-is, you'll pretty much need to use the same structure for your TEI files as is used in the I.Sicily 'inscriptions' directory.

This action will generate a DTS collection file with entries for all of the inscriptions, and save the file to `collection.json` in the root of the project.

To use, make a folder called '.github' in the root of your github project. Then make another folder inside of that called 'workflows'. Then add a file inside that folder
called updateCollection.yaml and add this to the file:

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
          errorFile: dts/error.json
          frequency: 600000
```

You can change the `collectionFile` and `errorFile` values if you'd like to save the files to a different directory and/or file name.

The `frequency` should be set to the number of milliseconds between runs of the action (as set in the cron section). This is used to check for any commits since the last run. If there've been no commits, we don't
run the job.

The workflow in the above config will run the action once a day at 2:42am UTC time. The 'cron' entry dictates when the action runs.

You can read more about scheduled github actions [here](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule) including how to set the
schedule, or how to trigger the action for other events like a commit or PR.





