# Git conventions

## Branches

Create a branch for your issue and name the branch __VPS-{ISSUE NUMBER}/{ISSUE NAME}__ (if the issue name is long, a shorter version if also fine)
  - e.g. the issue below has the name __Add labels in toolbar__ but a branch named __VPS-007/toolbar-label__
![picture 1](images/97c5a60476136bad6a548f65d9bea375b1b0934fc378a53cb54920bbb5ee0897.png)
![picture 2](images/d915d14397f3a85223e85e824f70f1545f538d87f638bd888071d2fb6756de3c.png)  

## Commit messages

For each commit you make, follow this convention: __[VPS-{ISSUE NUMBER}] Your commit message__
  - e.g. __[VPS-007] add toolbar labels with minimal styling__
![picture 3](images/8a5fac4d45ed78c426c0fb7895c51ddd9f7e942d19549312091180d83254f170.png)  


## Pull requests

Once you've made all your commits, open a PR with the name __VPS-{ISSUE NUMBER}/{ISSUE NAME}__ and fill in the details (the PR template can be found [here]( https://github.com/UoaWDCC/VPS/blob/master/.github/pull_request_template.md))
  - e.g. __VPS-007/Add labels in toolbar__
![picture 1](images/0eeffe2bfa8023951ea66309f2227a02f700d20f61516555641970dba3d37bd6.png)  

# File Structure

```.
├── frontend/
│ └── src
│ └── package.json
├── backend/
│ └── src
│ └── package.json
├── wiki/
│ ├── react-movable.md
│ └── ...
├── README.md
├── package.json
└── ...
```