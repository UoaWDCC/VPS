# Deploying backend

We have considered and tried the following two ways approaching Continuous Deployment:

- Connect heroku to Github Repo and let Heroku handle CD. But it says only repo admins have access to link it (even if heroku is granted access to the organization)
- Use Github Actions to Deploy when PR is merged. That I need to configure Heroku-API-key on Github Secrets

Since the repository is not owned by any of the team members, and is owned by the lecturer of SOFTENG761, unfortunately, we cannot have CD set up for thie repository. All deployments needs to be done from terminal. Please contact @lucas2005gao if there are updates in the backend to be deployed.

## Deploying manually to Heroku

1. Setup heroku `git remote add heroku https://git.heroku.com/virtual-patient-system.git`

If this is fast-forwarding the heroku remote, then simply do

1. Push to Heroku `git subtree push --prefix backend heroku master`

OR, If this requires a forced push then do

1. `git subtree split --prefix backend master`
2. copy the generated commit hash from the above command, and paste it in the `$(hashcode)` below
3. `git push heroku $(hashcode):master --force`
