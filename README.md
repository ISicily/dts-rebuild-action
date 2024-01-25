# dts-rebuild-action

Github action to rebuild a static DTS collection file once a day. It is meant to be 
run in a repository that has a folder called 'inscriptions' in which are TEI inscriptions. More specifically this action was created for the [I.Sicily Repository](https://github.com/ISicily/ISicily).

It will generate a DTS collection file with entries for all of the inscriptions, and save the file to `collection.json` in the root of the project.

To use, make a folder called '.github' in the root of your github project. Then make another folder inside of that called 'workflows'. Then add a file inside that folder
called updateCollection.yaml and add this to the file:

```
name: update IIIF collection

on:
  schedule: 
      - cron: '42 2 * * *'
jobs:

  update-collection:
    runs-on: ubuntu-latest
    name: Updates collection files
    steps:
      - name: Update files
        uses: isicily/dts-rebuild-action@master
        with:
          owner: ${{ github.repository_owner }}
          repo: ${{ github.event.repository.name }}
          token: ${{ github.token }}
```

The 'cron' dictates when the action runs. The above is set to run every day at 2:42am UTC time.

You can read more about scheduled github actions [here](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule) including how to set the
schedule.





